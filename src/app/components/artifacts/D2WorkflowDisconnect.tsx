import React from 'react';
import { IS } from '../cards/tokens';
import { ION_WORKFLOW_DISCONNECT } from './data/ion-workflow-disconnect';
import { useGateAIonArtifactPlayground, type D2State } from '../../state/GateAIonArtifactPlaygroundContext';

// D2 · Workflow Disconnect — full rebuild with stronger shared elements:
// - IonCard: framed mark with ✦ glyph + "ION" caps, replacing bare glyph
// - WorkflowRow: 3 mini tool cards connected, replacing bland tick line
// - RoughArrow: rough.js-style hand-drawn jittered Bezier (Holmes register)
// - Editorial type hierarchy with eyebrows, captions, deliberate proportions
//
// SYSTEM ADHERENCE:
// - Typography: locked ladder — 10/11/13/18 + 28 (proof-numerals exception for ✦).
// - Spacing: locked tokens — 4·8·12·16·24·32·48·64·96·128.
// - Color: W1 only — no new tokens, no accent-ink continuous tints.

// ───────────────────────────────────────────────────────────────────────────
// Shared atoms
// ───────────────────────────────────────────────────────────────────────────

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// rough.js-style jittered cubic-Bezier between two points. Multi-stroke for hand-drawn feel.
function roughCurvePath(x0: number, y0: number, x1: number, y1: number, seed: number, roughness: number, controlOffsetY: number): string {
  const rand = seededRandom(seed);
  const j = () => (rand() - 0.5) * 2 * roughness;
  const cx1 = x0 + (x1 - x0) * 0.33 + j();
  const cy1 = y0 + controlOffsetY + j();
  const cx2 = x0 + (x1 - x0) * 0.67 + j();
  const cy2 = y1 + controlOffsetY + j();
  return `M ${(x0 + j()).toFixed(2)} ${(y0 + j()).toFixed(2)} C ${cx1.toFixed(2)} ${cy1.toFixed(2)}, ${cx2.toFixed(2)} ${cy2.toFixed(2)}, ${(x1 + j()).toFixed(2)} ${(y1 + j()).toFixed(2)}`;
}

const TOOL_LABELS = ['Fg', 'Sl', 'Cd', 'Br'];
const TOOL_NAMES = ['Figma', 'Slack', 'Code editor', 'Browser'];

function IonCard({ size = 'normal', style = 'filled' }: { size?: 'normal' | 'large' | 'small'; style?: D2State['iconStyle'] }) {
  const w = size === 'large' ? 144 : size === 'small' ? 96 : 128;
  const h = size === 'large' ? 128 : size === 'small' ? 80 : 96;
  const glyphSize = size === 'large' ? 32 : size === 'small' ? 22 : 28;
  // iconStyle variants:
  // - filled (default): raised bg, primary border, primary ink
  // - outline: transparent bg, primary border, primary ink
  // - hand-drawn: dashed border + raised bg (visually "sketched" without rough.js
  //   on this surface to keep the ✦ glyph crisp)
  const bg = style === 'outline' ? 'transparent' : 'var(--dir-raised)';
  const border = style === 'hand-drawn'
    ? '1.5px dashed var(--dir-text-primary)'
    : '1px solid var(--dir-text-primary)';
  return (
    <div
      style={{
        width: w,
        height: h,
        border,
        backgroundColor: bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        flexShrink: 0,
      }}
    >
      <span style={{ fontFamily: IS, fontSize: glyphSize, fontWeight: 600, lineHeight: 1, color: 'var(--dir-text-primary)' }}>
        ✦
      </span>
      <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)' }}>
        Ion
      </span>
    </div>
  );
}

function WorkflowToolCard({ abbr, name }: { abbr: string; name: string }) {
  return (
    <div
      style={{
        width: 96,
        padding: '12px 8px',
        border: '1px solid var(--dir-text-primary)',
        backgroundColor: 'var(--dir-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}
    >
      <span style={{ fontFamily: IS, fontSize: 18, fontWeight: 600, color: 'var(--dir-text-primary)' }}>
        {abbr}
      </span>
      <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)' }}>
        {name}
      </span>
    </div>
  );
}

function WorkflowRow({ inFrame = false, count = 3 }: { inFrame?: boolean; count?: number }) {
  const n = Math.min(Math.max(count, 1), TOOL_LABELS.length);
  const labels = TOOL_LABELS.slice(0, n);
  const inner = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {labels.map((abbr, i) => (
        <React.Fragment key={i}>
          <WorkflowToolCard abbr={abbr} name={TOOL_NAMES[i]!} />
          {i < labels.length - 1 && (
            <span aria-hidden style={{ width: 16, height: 1, backgroundColor: 'var(--dir-text-primary)', flexShrink: 0 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
  if (!inFrame) return inner;
  return (
    <div
      style={{
        padding: 24,
        border: '1px solid var(--dir-text-primary)',
        backgroundColor: 'var(--dir-bg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        alignItems: 'center',
      }}
    >
      {inner}
      <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)' }}>
        Established workflow
      </span>
    </div>
  );
}

function CompositionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
      {children}
    </p>
  );
}

function CompositionCaption({ children, max = 680 }: { children: React.ReactNode; max?: number }) {
  return (
    <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 300, lineHeight: 1.6, color: 'var(--dir-text-secondary)', margin: 0, maxWidth: max }}>
      {children}
    </p>
  );
}

function SynthesizedMarker({ note }: { note: string }) {
  return (
    <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
      {note}
    </p>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Native: single-icon + curved hand-drawn arrow toward labeled workflow row
// ───────────────────────────────────────────────────────────────────────────

// Arrow endpoint marker — varies by arrowEndpoints toggle.
// - solid: filled triangle (default)
// - open: stroke-only V (no fill)
// - hand-drawn: slightly thicker stroke with rounded tips
function ArrowMarkerDef({ id, mode }: { id: string; mode: D2State['arrowEndpoints'] }) {
  if (mode === 'open') {
    return (
      <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="10" markerHeight="10" orient="auto">
        <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="var(--dir-text-primary)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </marker>
    );
  }
  if (mode === 'hand-drawn') {
    return (
      <marker id={id} viewBox="0 0 12 12" refX="9" refY="6" markerWidth="10" markerHeight="10" orient="auto">
        <path d="M 1 1 L 10 6 L 1 10" fill="none" stroke="var(--dir-text-primary)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </marker>
    );
  }
  return (
    <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--dir-text-primary)" />
    </marker>
  );
}

// Caption layout per captionPlacement toggle. 'under' renders below diagram (default),
// 'side' renders right of diagram (horizontal split), 'inline' renders as a small
// caption between diagram and synthesized marker.
function CaptionLayout({
  placement,
  density,
  caption,
  children,
}: {
  placement: D2State['captionPlacement'];
  density: D2State['annotationDensity'];
  caption: string;
  children: React.ReactNode;
}) {
  // annotationDensity:
  // - minimal: hide caption entirely
  // - standard: caption only (default)
  // - verbose: caption + an extra interpretive line beneath
  const showCaption = density !== 'minimal';
  const verbose = density === 'verbose';
  const captionBlock = showCaption ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <CompositionCaption>{caption}</CompositionCaption>
      {verbose && (
        <p
          style={{
            fontFamily: IS,
            fontSize: 11,
            fontWeight: 300,
            lineHeight: 1.6,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            maxWidth: 680,
            fontStyle: 'italic',
          }}
        >
          The disconnect isn't just architectural — it's a habit problem. Ion sits outside the muscle memory of the existing workflow, so re-entry requires deliberate context switching every time.
        </p>
      )}
    </div>
  ) : null;
  if (placement === 'side') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32, alignItems: 'start' }}>
        {children}
        {captionBlock}
      </div>
    );
  }
  if (placement === 'inline') {
    return (
      <>
        {children}
        {captionBlock && (
          <div style={{ paddingLeft: 12, borderLeft: '1px solid var(--dir-border)' }}>
            {captionBlock}
          </div>
        )}
      </>
    );
  }
  // under (default)
  return (
    <>
      {children}
      {captionBlock}
    </>
  );
}

function NativeSingleIconArrow({ state }: { state: D2State }) {
  const data = ION_WORKFLOW_DISCONNECT;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <CompositionEyebrow>{data.eyebrow}</CompositionEyebrow>
      <CaptionLayout placement={state.captionPlacement} density={state.annotationDensity} caption={data.caption}>
        {/* Composition with overlay SVG for the curved arrow */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, paddingTop: 16, paddingBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: state.iconCount }).map((_, i) => (
              <IonCard key={i} style={state.iconStyle} />
            ))}
          </div>
          {/* SVG arrow positioned absolutely between Ion and workflow */}
          <svg
            viewBox="0 0 256 96"
            aria-hidden
            style={{ position: 'absolute', left: 128, top: '50%', transform: 'translateY(-50%)', width: 256, height: 96, pointerEvents: 'none' }}
          >
            <defs>
              <ArrowMarkerDef id="d2-native-arrow" mode={state.arrowEndpoints} />
            </defs>
            {state.arrowStyle === 'wavy' ? (
              <>
                <path d={roughCurvePath(8, 48, 248, 48, 7, 2, -16)} stroke="var(--dir-text-primary)" strokeWidth={1.5} fill="none" strokeLinecap="round" />
                <path d={roughCurvePath(8, 48, 248, 48, 53, 2, -14)} stroke="var(--dir-text-primary)" strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.7} markerEnd="url(#d2-native-arrow)" />
              </>
            ) : state.arrowStyle === 'straight' ? (
              <line x1={8} y1={48} x2={248} y2={48} stroke="var(--dir-text-primary)" strokeWidth={1.5} markerEnd="url(#d2-native-arrow)" />
            ) : state.arrowStyle === 'dashed' ? (
              <line x1={8} y1={48} x2={248} y2={48} stroke="var(--dir-text-primary)" strokeWidth={1.5} strokeDasharray="8 4" markerEnd="url(#d2-native-arrow)" />
            ) : (
              // curved (native)
              <path d="M 8 48 Q 128 16, 248 48" stroke="var(--dir-text-primary)" strokeWidth={1.5} fill="none" markerEnd="url(#d2-native-arrow)" />
            )}
          </svg>
          <WorkflowRow inFrame count={Math.max(state.iconCount, 3)} />
        </div>
      </CaptionLayout>
      {data.synthesized && (
        <SynthesizedMarker note="illustrative · caption is interpretation, deck has only the section title" />
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Multi-icon constellation: Ion separate, dashed barrier, workflow tools as a group
// ───────────────────────────────────────────────────────────────────────────

function VariantMultiIcon({ state }: { state: D2State }) {
  const data = ION_WORKFLOW_DISCONNECT;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <CompositionEyebrow>{data.eyebrow} · multi-icon constellation</CompositionEyebrow>
      <CaptionLayout
        placement={state.captionPlacement}
        density={state.annotationDensity}
        caption="Ion stands on one side of a dashed barrier as a separate tool. The user's established workflow — Figma, Slack, code editor — operates as a self-contained system on the other side, with no integration crossing the line."
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1px auto', gap: 32, alignItems: 'center', padding: 16 }}>
          {/* Ion side — iconCount stacks Ion cards to reinforce "multi-icon" intent */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {Array.from({ length: Math.max(state.iconCount, 1) }).map((_, i) => (
              <IonCard key={i} size="large" style={state.iconStyle} />
            ))}
            <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)' }}>
              Separate tool
            </span>
          </div>
          {/* Vertical dashed barrier — the disconnect */}
          <div aria-hidden style={{ width: 1, height: 192, backgroundImage: 'repeating-linear-gradient(to bottom, var(--dir-detail) 0 4px, transparent 4px 8px)' }} />
          {/* Workflow side */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <WorkflowRow inFrame count={Math.max(state.iconCount, 3)} />
          </div>
        </div>
      </CaptionLayout>
      <SynthesizedMarker note="synthesized · workflow tool labels are illustrative" />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Annotated icons: editorial leader-line annotations (Holmes register)
// ───────────────────────────────────────────────────────────────────────────

function VariantAnnotatedIcons({ state }: { state: D2State }) {
  const data = ION_WORKFLOW_DISCONNECT;
  // annotationDensity in this variant maps to how many annotations show.
  // minimal: 1, standard: 3 (default), verbose: 3 + extra interpretation column.
  const allAnnotations = [
    { num: '01', title: 'The new tool', body: 'Designer enters Ion only when they remember to — not part of muscle memory.' },
    { num: '02', title: 'The link', body: 'Manual context switch. No integration into the existing workflow.' },
    { num: '03', title: 'The flow', body: 'Where the actual work lives — Slack threads, Figma files, code reviews.' },
    { num: '04', title: 'The habit gap', body: 'Re-entering Ion requires a deliberate prompt — there is no surface in the existing flow that pulls the user back.' },
  ];
  const annotations = state.annotationDensity === 'minimal'
    ? allAnnotations.slice(0, 1)
    : state.annotationDensity === 'verbose'
      ? allAnnotations
      : allAnnotations.slice(0, 3);
  const gridCols = `repeat(${annotations.length}, 1fr)`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <CompositionEyebrow>{data.eyebrow} · annotated · Holmes register</CompositionEyebrow>

      {/* Top row: numbered editorial annotations (count varies with annotationDensity) */}
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 32 }}>
        {annotations.map((anno, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)', fontVariantNumeric: 'tabular-nums', margin: 0 }}>
              {anno.num} · {anno.title}
            </p>
            <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.6, color: 'var(--dir-text-secondary)', margin: 0 }}>
              {anno.body}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom row: diagram itself */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, paddingTop: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: Math.max(state.iconCount, 1) }).map((_, i) => (
            <IonCard key={i} style={state.iconStyle} />
          ))}
        </div>
        <svg viewBox="0 0 256 96" aria-hidden style={{ position: 'absolute', left: 128, top: '50%', transform: 'translateY(-50%)', width: 256, height: 96, pointerEvents: 'none' }}>
          <defs>
            <ArrowMarkerDef id="d2-anno-arrow" mode={state.arrowEndpoints} />
          </defs>
          <path d="M 8 48 Q 128 16, 248 48" stroke="var(--dir-text-primary)" strokeWidth={1.5} fill="none" markerEnd="url(#d2-anno-arrow)" />
        </svg>
        <WorkflowRow inFrame count={Math.max(state.iconCount, 3)} />
      </div>

      <SynthesizedMarker note="annotations are interpretation · deck has only the section title" />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Before / after: structural placement contrast — Ion outside vs Ion inside
// ───────────────────────────────────────────────────────────────────────────

function VariantBeforeAfter({ state }: { state: D2State }) {
  const data = ION_WORKFLOW_DISCONNECT;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <CompositionEyebrow>{data.eyebrow} · before / after pair</CompositionEyebrow>

      {/* BEFORE — Ion outside the workflow box */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)', fontVariantNumeric: 'tabular-nums', margin: 0 }}>
          01 · Before — Ion outside the workflow
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 48, padding: 16 }}>
          <IonCard style={state.iconStyle} />
          <WorkflowRow inFrame count={Math.max(state.iconCount, 3)} />
        </div>
      </div>

      {/* AFTER — Ion absorbed into the workflow box */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)', fontVariantNumeric: 'tabular-nums', margin: 0 }}>
          02 · After — Ion integrated into the workflow
        </p>
        <div
          style={{
            padding: 24,
            border: '1px solid var(--dir-text-primary)',
            backgroundColor: 'var(--dir-raised)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <WorkflowToolCard abbr="Fg" name="Figma" />
            <span aria-hidden style={{ width: 16, height: 1, backgroundColor: 'var(--dir-text-primary)' }} />
            <IonCard size="small" style={state.iconStyle} />
            <span aria-hidden style={{ width: 16, height: 1, backgroundColor: 'var(--dir-text-primary)' }} />
            <WorkflowToolCard abbr="Sl" name="Slack" />
            <span aria-hidden style={{ width: 16, height: 1, backgroundColor: 'var(--dir-text-primary)' }} />
            <WorkflowToolCard abbr="Cd" name="Code editor" />
          </div>
          <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)' }}>
            Workflow with Ion in the chain
          </span>
        </div>
      </div>

      <CompositionCaption>
        Before: Ion sits outside the workflow box entirely. After: Ion is one of the cards in the chain — Figma · Ion · Slack · Code editor — pulled into the ecosystem alongside the established tools.
      </CompositionCaption>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Disconnect-as-gap: hatched gap zone between the two sides
// ───────────────────────────────────────────────────────────────────────────

function VariantDisconnectAsGap({ state }: { state: D2State }) {
  const data = ION_WORKFLOW_DISCONNECT;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <CompositionEyebrow>{data.eyebrow} · disconnect-as-gap</CompositionEyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 0, alignItems: 'center', padding: 16 }}>
        <IonCard style={state.iconStyle} />
        {/* Hatched gap zone with dashed boundaries + label */}
        <div
          style={{
            position: 'relative',
            height: 128,
            margin: '0 24px',
            border: '1px dashed var(--dir-detail)',
            borderTop: 'none',
            borderBottom: 'none',
            backgroundImage:
              'repeating-linear-gradient(-45deg, var(--dir-border) 0 1px, transparent 1px 8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)', backgroundColor: 'var(--dir-bg)', padding: '4px 8px' }}>
            The gap
          </span>
          <span style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, color: 'var(--dir-text-secondary)', backgroundColor: 'var(--dir-bg)', padding: '4px 8px' }}>
            no integration path
          </span>
        </div>
        <WorkflowRow inFrame count={Math.max(state.iconCount, 3)} />
      </div>
      <CompositionCaption>
        The disconnect is rendered as a labeled hatched zone — the empty middle is the artifact's subject, not just absence of connection. Both sides face the gap; neither crosses it.
      </CompositionCaption>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Dispatch
// ───────────────────────────────────────────────────────────────────────────

export function D2WorkflowDisconnect() {
  const { d2 } = useGateAIonArtifactPlayground();
  if (d2.variant === 'single-icon-arrow') return <NativeSingleIconArrow state={d2} />;
  if (d2.variant === 'multi-icon') return <VariantMultiIcon state={d2} />;
  if (d2.variant === 'annotated-icons') return <VariantAnnotatedIcons state={d2} />;
  if (d2.variant === 'before-after') return <VariantBeforeAfter state={d2} />;
  return <VariantDisconnectAsGap state={d2} />;
}
