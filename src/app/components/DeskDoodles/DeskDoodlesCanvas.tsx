import { useState } from 'react';
import { NavLink } from 'react-router';
import { IS, ISe } from '../../lib/typography';
import { PILL, CTA, SECTION_LABEL } from '../../lib/chromeStyles';
import { SmartHachureChrome } from '../chrome/SmartHachureChrome';
import {
  CollapsiblePanel,
  PanelToggle,
  useMinimizeUi,
  usePanelOpen,
} from '../chrome/CollapsiblePanel';
// DrawSurface + stroke helpers extracted to DrawSurface.tsx 2026-06-11
// (mechanical move — also hosted by the /desk DrawPanel popup).
import { DrawSurface, type CanvasMode, type InputMode } from './DrawSurface';

export function DeskDoodlesCanvas() {
  const [mode, setMode] = useState<CanvasMode>('svg');
  const [input, setInput] = useState<InputMode>('draw');
  const [leftOpen, toggleLeft, setLeftOpen] = usePanelOpen('canvas.left');
  const [rightOpen, toggleRight, setRightOpen] = usePanelOpen('canvas.right');
  useMinimizeUi([
    { open: leftOpen, setOpen: setLeftOpen },
    { open: rightOpen, setOpen: setRightOpen },
  ]);

  return (
    <div
      style={{
        // Definite height (not min-height) so the canvas frame's maxHeight
        // chain resolves — the page never scrolls; the frame fits the
        // leftover space the flex layout measures, no estimated pixels.
        height: '100vh',
        background: 'var(--dir-bg)',
        color: 'var(--dir-text-primary)',
        fontFamily: IS,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top chrome — brand left, mode toggle center, publish right */}
      <header
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--dir-border)',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 24,
          background: 'var(--dir-bg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NavLink
            to="/"
            style={{
              fontFamily: ISe,
              fontSize: 18,
              letterSpacing: '-0.01em',
              color: 'var(--dir-text-primary)',
              textDecoration: 'none',
            }}
          >
            Desk Doodles
          </NavLink>
          <PanelToggle
            side="left"
            open={leftOpen}
            label="Input"
            onToggle={toggleLeft}
            controlsId="canvas-left-panel"
          />
        </div>

        <div
          role="tablist"
          aria-label="Canvas mode"
          style={{
            display: 'inline-flex',
            border: '1px solid var(--dir-border)',
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          {(['svg', '3d'] as CanvasMode[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              style={{
                ...PILL,
                border: 'none',
                borderRadius: 0,
                background: mode === m ? 'var(--dir-accent)' : 'transparent',
                color: mode === m ? 'var(--dir-bg)' : 'var(--dir-text-body)',
              }}
            >
              {m === 'svg' ? '2D' : '3D'}
            </button>
          ))}
        </div>

        <div style={{ justifySelf: 'end', display: 'flex', gap: 8, alignItems: 'center' }}>
          <PanelToggle
            side="right"
            open={rightOpen}
            label="Controls"
            onToggle={toggleRight}
            controlsId="canvas-right-panel"
          />
          <button
            disabled
            title="Publishing lives on /desk — this page is the test surface"
            style={{
              ...CTA,
              cursor: 'not-allowed',
              opacity: 0.5,
            }}
          >
            Publish
          </button>
        </div>
      </header>

      {/* Body — left dock + main canvas + right Smart Hachure chrome */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left dock */}
        <CollapsiblePanel
          side="left"
          open={leftOpen}
          width={280}
          id="canvas-left-panel"
          style={{
            borderRight: '1px solid var(--dir-border)',
            background: 'var(--dir-raised)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Input section */}
          <section style={{ padding: 24, borderBottom: '1px solid var(--dir-border)' }}>
            <h2 style={{ ...SECTION_LABEL, margin: '0 0 16px 0' }}>
              Input
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(
                [
                  ['draw', 'Draw'],
                  ['upload-svg', 'Upload SVG'],
                  ['upload-image', 'Upload image'],
                ] as [InputMode, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setInput(key)}
                  // Intentional PILL override — sentence-case 13/400 type for the dock (locked 2026-06-10).
                  style={{
                    ...PILL,
                    width: '100%',
                    textAlign: 'center',
                    textTransform: 'none',
                    letterSpacing: 'normal',
                    fontSize: 13,
                    fontWeight: 400,
                    padding: '10px 14px',
                    background: input === key ? 'var(--dir-bg)' : 'transparent',
                    color: 'var(--dir-text-primary)',
                    borderColor: input === key ? 'var(--dir-accent)' : 'var(--dir-border)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Settings section */}
          <section style={{ padding: 24, flex: 1 }}>
            <h2 style={{ ...SECTION_LABEL, margin: '0 0 16px 0' }}>
              Settings
            </h2>
            <p
              style={{
                fontFamily: IS,
                fontSize: 13,
                color: 'var(--dir-text-body-soft)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Style picker + Smart Hachure controls wire in Day 7. Engine is already in repo
              (lib/smartHachure/, lib/f3HandFeel.ts).
            </p>
          </section>
        </CollapsiblePanel>

        {/* Main canvas area */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            padding: 48,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'var(--dir-bg)',
          }}
        >
          <DrawSurface mode={mode} input={input} />
        </main>
        {/* Right chrome — Smart Hachure modifier panel from the audit/playground */}
        <CollapsiblePanel
          side="right"
          open={rightOpen}
          width={360}
          id="canvas-right-panel"
          style={{
            borderLeft: '1px solid var(--dir-border)',
            background: 'var(--dir-raised)',
            overflowY: 'auto',
          }}
        >
          <SmartHachureChrome />
        </CollapsiblePanel>
      </div>
    </div>
  );
}
