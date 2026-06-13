// ─── SVG sanitization security battery (browser harness) ────────────────────
// Drives the REAL sanitizer (src/app/lib/svgUpload.ts) against the hostile
// payload corpus, in a real Chromium page — the exact runtime DOMPurify uses in
// production. For each payload it:
//   1. clears the execution beacon (window.__dd_xss_fired)
//   2. runs sanitizeSvgMarkup(payload)  ← the production read-path call
//   3. injects the cleaned string via dangerouslySetInnerHTML  ← production sink
//      (DeskPage.tsx line 296/332 / DeskGallery.tsx 392 do exactly this)
//   4. for click/animation vectors, synthetically triggers the event
//   5. waits a tick, then reads the beacon — nonzero = the payload EXECUTED
//   6. records sanitized-string token checks + file-gate verdict
//
// The driver (security-battery.mjs) reads window.__dd_secResults and screenshots.
// Repo-side tool only — tools/ never ships in the Make drag-drop.

import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  sanitizeSvgMarkup,
  prepareSvgUpload,
} from '../../src/app/lib/svgUpload';
import {
  PAYLOADS,
  BEACON_FLAG,
  type Payload,
  type ExpectedOutcome,
} from './payloads';

declare global {
  interface Window {
    [BEACON_FLAG]: number;
    __dd_secResults?: ItemResult[];
    __dd_secDone?: boolean;
  }
}

interface ItemResult {
  id: string;
  family: string;
  desc: string;
  expected: ExpectedOutcome;
  executed: boolean; // beacon fired → the attack ran
  sanitizedLen: number;
  sanitizedPreview: string;
  forbiddenHits: string[]; // forbidden tokens that survived in the sanitized string
  fileGate?: 'ok' | 'rejected' | 'n/a' | 'error';
  pass: boolean;
  reason: string;
}

const TIMINGS = { settleMs: 30, perItemMs: 0 };

// Mirror production: build a File and run it through the upload gate.
async function runFileGate(p: Payload): Promise<ItemResult['fileGate']> {
  if (!p.alsoFileGate) return 'n/a';
  try {
    const file = new File([p.markup], `${p.id}.svg`, { type: 'image/svg+xml' });
    const res = await prepareSvgUpload(file);
    return res.ok ? 'ok' : 'rejected';
  } catch {
    return 'error';
  }
}

// Trigger DOM events that some vectors depend on (onclick, <a> activation).
function pokeEvents(host: HTMLElement) {
  const clickTarget = host.querySelector<HTMLElement>('#dd-click-target');
  if (clickTarget) {
    clickTarget.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, view: window }),
    );
  }
  // Also click any anchors that survived (javascript: hrefs).
  host.querySelectorAll('a').forEach((a) => {
    try {
      a.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, view: window }),
      );
    } catch {
      /* noop */
    }
  });
}

function evaluate(p: Payload, executed: boolean, forbiddenHits: string[], fileGate: ItemResult['fileGate']): { pass: boolean; reason: string } {
  // An execution beacon firing is ALWAYS a hard failure, regardless of expected.
  if (executed) {
    return { pass: false, reason: 'EXECUTED — beacon fired (live XSS)' };
  }
  switch (p.expected) {
    case 'rejected':
      if (fileGate === 'rejected') return { pass: true, reason: 'file gate rejected, no exec' };
      return {
        pass: false,
        reason: `expected file rejection, got fileGate=${fileGate}`,
      };
    case 'no-exec':
      return { pass: true, reason: 'no execution' };
    case 'no-exec-and-stripped':
      if (forbiddenHits.length === 0) return { pass: true, reason: 'no exec, dangerous tokens stripped' };
      return {
        pass: false,
        reason: `no exec BUT forbidden token(s) survived: ${forbiddenHits.join(', ')}`,
      };
    default:
      return { pass: false, reason: 'unknown expected outcome' };
  }
}

function App() {
  const [results, setResults] = useState<ItemResult[]>([]);
  const [done, setDone] = useState(false);
  const sinkRef = useRef<HTMLDivElement>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const out: ItemResult[] = [];
      for (const p of PAYLOADS) {
        // 1. reset beacon
        window[BEACON_FLAG] = 0;

        // 2. the production sanitizer call
        let sanitized = '';
        let sanitizeError = '';
        try {
          sanitized = sanitizeSvgMarkup(p.markup);
        } catch (e) {
          sanitizeError = (e as Error).message;
        }

        // 3. production sink — inject via the same path as dangerouslySetInnerHTML
        const sink = sinkRef.current!;
        sink.innerHTML = '';
        const host = document.createElement('div');
        host.setAttribute('data-payload', p.id);
        // dangerouslySetInnerHTML lowers to assigning .innerHTML — identical here.
        host.innerHTML = sanitized;
        sink.appendChild(host);

        // 4. trigger event-dependent vectors
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        pokeEvents(host);

        // 5. settle, then read the beacon
        await new Promise((r) => setTimeout(r, TIMINGS.settleMs));
        const executed = (window[BEACON_FLAG] || 0) > 0;

        // 6a. forbidden-token survival check (case-insensitive)
        const lower = sanitized.toLowerCase();
        const forbiddenHits = (p.forbiddenTokens || []).filter((t) =>
          lower.includes(t.toLowerCase()),
        );

        // 6b. file-gate verdict (only for alsoFileGate payloads)
        const fileGate = await runFileGate(p);

        const { pass, reason } = evaluate(p, executed, forbiddenHits, fileGate);

        out.push({
          id: p.id,
          family: p.family,
          desc: p.desc,
          expected: p.expected,
          executed,
          sanitizedLen: sanitized.length,
          sanitizedPreview: sanitized.slice(0, 160) + (sanitized.length > 160 ? '…' : ''),
          forbiddenHits,
          fileGate,
          pass,
          reason: sanitizeError ? `sanitize threw: ${sanitizeError}` : reason,
        });
        setResults([...out]);
      }
      // Clear the sink so the screenshot shows only the report (not injected art).
      if (sinkRef.current) sinkRef.current.innerHTML = '';
      window.__dd_secResults = out;
      window.__dd_secDone = true;
      setDone(true);
    })();
  }, []);

  const passCount = results.filter((r) => r.pass).length;
  const failCount = results.filter((r) => !r.pass).length;

  return (
    <div
      style={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 12,
        lineHeight: 1.45,
        padding: 20,
        color: '#1a1a1a',
        background: '#faf8f3',
        minHeight: '100vh',
      }}
    >
      <h1 style={{ fontSize: 18, margin: '0 0 4px' }}>
        SVG Sanitization Security Battery
      </h1>
      <div style={{ marginBottom: 12, color: '#555' }}>
        Target: <code>sanitizeSvgMarkup / prepareSvgUpload</code> (src/app/lib/svgUpload.ts)
        · DOMPurify SVG profile · real Chromium runtime
      </div>
      <div
        data-status={done ? 'done' : 'running'}
        style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: 999,
          fontWeight: 700,
          marginBottom: 16,
          background: !done ? '#e8e2d4' : failCount === 0 ? '#1f7a3d' : '#a11',
          color: !done ? '#444' : '#fff',
        }}
      >
        {!done
          ? `running… ${results.length}/${PAYLOADS.length}`
          : failCount === 0
          ? `ALL ${passCount} PASS — sanitizer holds`
          : `${failCount} FAILURE(S) / ${passCount} pass — REVIEW`}
      </div>

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #333' }}>
            <th style={th}>id</th>
            <th style={th}>family</th>
            <th style={th}>vector</th>
            <th style={th}>expected</th>
            <th style={th}>exec?</th>
            <th style={th}>file gate</th>
            <th style={th}>result</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr
              key={r.id}
              data-id={r.id}
              data-pass={r.pass ? '1' : '0'}
              style={{ borderBottom: '1px solid #ddd', background: r.pass ? 'transparent' : '#fde7e7' }}
            >
              <td style={td}>{r.id}</td>
              <td style={td}>{r.family}</td>
              <td style={{ ...td, maxWidth: 280 }}>{r.desc}</td>
              <td style={td}>{r.expected}</td>
              <td style={{ ...td, fontWeight: 700, color: r.executed ? '#a11' : '#1f7a3d' }}>
                {r.executed ? 'FIRED' : 'no'}
              </td>
              <td style={td}>{r.fileGate}</td>
              <td style={{ ...td, fontWeight: 700, color: r.pass ? '#1f7a3d' : '#a11' }}>
                {r.pass ? 'PASS' : `FAIL — ${r.reason}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* The production sink. Cleared after the run so the screenshot is the report. */}
      <div ref={sinkRef} aria-hidden style={{ position: 'absolute', left: -99999, top: 0 }} />
    </div>
  );
}

const th: React.CSSProperties = { padding: '6px 8px', fontWeight: 700 };
const td: React.CSSProperties = { padding: '5px 8px', verticalAlign: 'top' };

createRoot(document.getElementById('root')!).render(<App />);
