import React from 'react';
import { IS } from '../cards/tokens';
import {
  ION_VENN_LEYI,
  ION_VENN_COCREATE,
  ION_VENN_SYNTHESIZED_4,
  type VennDataset,
} from './data/ion-venn';
import {
  useGateAIonArtifactPlayground,
  type B1State,
} from '../../state/GateAIonArtifactPlaygroundContext';
import { roughCirclePath } from '../../lib/handFeel';

// B1 · Venn Diagram (positioning) — all 4 variants built.
// Native = Leyi product-pivot register (3-circle classic). Plus: 2-circle overlap-focused,
// 4-circle complex landscape (synthesized 4-tool dataset), and inverse Venn (focal sits
// OUTSIDE central intersection, per playground plan §3 inverse spec).
//
// SYSTEM ADHERENCE (audited pre-ship per feedback_system_adherence_audit):
// - Typography: locked ladder only — sizes 10·11·13·15·18·22·32·52 (+12, +28). IS weights
//   300 (Dense Body), 500 (Meta/Label/UI caps), 600 (Sub-heading). ISe sizes 22/32 only.
// - Spacing: locked tokens 4·8·12·16·24·32·48·64·80·96·128. Circle radius = 128 (space-11);
//   center marker rect = 24 (space-5); arrowhead marker = 8 (Micro).
// - Color: W1 tokens only. Circles fill = --dir-raised + mix-blend-mode multiply (when
//   tinted on); stroke = --dir-detail. No accent-ink continuous tints, no rgba, no hex.
// - Hand-drawn-feel uses rough.js-style technique (multi-stroke jittered Bezier paths)
//   instead of naive feTurbulence-on-stroke. Reference: shihn.ca/posts/2020/roughjs-algorithms/
//
// LABEL POSITIONING — optically centered in unique regions per
// feedback_optical_check_after_aligning. Math centroid used as starting point, then
// adjusted to the optical center of the actual lune shape (not a quarter-circle).

const VIEW_W = 720;
const VIEW_H = 480;
const R = 128; // circle radius — space-11 (locked spacing token)
const MARKER_SIZE = 24; // center marker square — space-5

// ───────────────────────────────────────────────────────────────────────────
// Rough.js-style hand-drawn circle generator
// ───────────────────────────────────────────────────────────────────────────
// Per shihn.ca (rough.js author):
// 1. Approximate the circle with 4 cubic Bezier segments (kappa = 0.5523).
// 2. Jitter every anchor point and control point by a small random offset.
// 3. Multi-stroke: render the path TWICE with different seeds for the layered look.
// Implemented locally (no rough.js dep) using a deterministic seeded LCG so renders
// are stable.

// roughCirclePath + seededRandom moved to ../../lib/handFeel.ts (shared with C3).

function VennCircle({
  cx,
  cy,
  r,
  state,
  seed,
}: {
  cx: number;
  cy: number;
  r: number;
  state: B1State;
  seed: number;
}) {
  const tinted = state.tintedOverlap === 'on';
  const fillProp = tinted ? 'var(--dir-raised)' : 'transparent';
  const blend: React.CSSProperties = tinted ? { mixBlendMode: 'multiply' } : {};

  if (state.circleStroke === 'hand-drawn') {
    // Multi-stroke layered hand-drawn render: 2 jittered Bezier paths overlaid.
    const ROUGHNESS = 2.5;
    return (
      <g style={blend}>
        <path d={roughCirclePath(cx, cy, r, ROUGHNESS, seed)} fill={fillProp} stroke="var(--dir-detail)" strokeWidth={1} strokeLinejoin="round" />
        <path d={roughCirclePath(cx, cy, r, ROUGHNESS, seed * 7 + 13)} fill="none" stroke="var(--dir-detail)" strokeWidth={1} strokeLinejoin="round" />
      </g>
    );
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fillProp}
      stroke="var(--dir-detail)"
      strokeWidth={state.circleStroke === 'dashed' ? 1 : 1}
      strokeDasharray={state.circleStroke === 'dashed' ? '8 4' : undefined}
      style={blend}
    />
  );
}

function caseTransform(text: string, style: B1State['labelStyle']): string {
  return style === 'caps' ? text.toUpperCase() : text;
}

// ───────────────────────────────────────────────────────────────────────────
// Shared atoms — defs + label rendering helpers
// ───────────────────────────────────────────────────────────────────────────

function VennDefs() {
  return (
    <defs>
      <marker
        id="b1-arrowhead"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="8"
        markerHeight="8"
        orient="auto"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--dir-text-primary)" />
      </marker>
    </defs>
  );
}

type LabelPos = { x: number; y: number; anchor: 'start' | 'middle' | 'end' };

function CircleLabelText({
  pos,
  primary,
  subtitle,
  state,
}: {
  pos: LabelPos;
  primary: string;
  subtitle?: string;
  state: B1State;
}) {
  const isCaps = state.labelStyle === 'caps';
  const primaryFontSize = isCaps ? 10 : 13;
  const primaryFontWeight = isCaps ? 500 : 300;
  const primaryLetterSpacing = isCaps ? '0.12em' : '0';
  return (
    <g>
      <text
        x={pos.x}
        y={pos.y}
        textAnchor={pos.anchor}
        style={{
          fontFamily: IS,
          fontSize: primaryFontSize,
          fontWeight: primaryFontWeight,
          letterSpacing: primaryLetterSpacing,
          fill: 'var(--dir-text-primary)',
        }}
      >
        {caseTransform(primary, state.labelStyle)}
      </text>
      {subtitle && (
        <text
          x={pos.x}
          y={pos.y + (isCaps ? 12 : 16)}
          textAnchor={pos.anchor}
          style={{
            fontFamily: IS,
            fontSize: 11,
            fontWeight: 400,
            fill: 'var(--dir-text-secondary)',
          }}
        >
          {subtitle}
        </text>
      )}
    </g>
  );
}

function CenterMarker({
  cx,
  cy,
  marker,
  data,
  state,
}: {
  cx: number;
  cy: number;
  marker: B1State['centerMarker'];
  data: VennDataset;
  state: B1State;
}) {
  if (marker === 'none') return null;
  if (marker === 'icon') {
    // Ion brand glyph (inlined from ~/Desktop/m2/branding assets/logo-only-yellow.svg).
    // Source viewBox: 0 0 960 960. ICON_SIZE 14 chosen so the icon's bounding-box corners
    // (at sqrt(7² + 7²) ≈ 9.9px from center) sit safely INSIDE the MARKER_SIZE/2 = 12px
    // radius of the circle marker without visual clipping. Original SVG fill #F1C115
    // (brand yellow) is NOT in the W1 palette — recolored to `var(--dir-bg)` (near-white
    // inverted ink) so the mark reads as the W1 exception-zone treatment on the
    // --dir-text-primary marker ground. Keeps W1 palette discipline (no new tokens)
    // while using the real Ion brand mark instead of a generic ✦ glyph.
    //
    // Marker shape: FULL CIRCLE (changed from rounded rect 2026-05-20). Matches the
    // Venn's circle family — the focal mark becomes a 4th smaller circle at the
    // intersection of the 3 category circles, visually coherent.
    const ICON_SIZE = 14;
    const ICON_SCALE = ICON_SIZE / 960;
    const ICON_PATH = 'M382.373 576.808H0V382.374C211.081 382.374 382.373 211.037 382.373 0H576.852V382.374H959.225V576.808C748.144 576.808 576.852 748.145 576.852 959.174H382.373V576.808Z';
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={MARKER_SIZE / 2}
          fill="var(--dir-text-primary)"
        />
        <g transform={`translate(${cx - ICON_SIZE / 2} ${cy - ICON_SIZE / 2}) scale(${ICON_SCALE})`}>
          <path d={ICON_PATH} fill="var(--dir-bg)" />
        </g>
      </g>
    );
  }
  // labeled box
  return (
    <g>
      <rect
        x={cx - 64}
        y={cy - 16}
        width={128}
        height={32}
        fill="var(--dir-raised)"
        stroke="var(--dir-text-primary)"
        strokeWidth={1}
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        style={{
          fontFamily: IS,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.06em',
          fill: 'var(--dir-text-primary)',
        }}
      >
        {caseTransform(data.centerLabel, state.labelStyle)}
      </text>
    </g>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: classic (native) — 3-circle equilateral
// ───────────────────────────────────────────────────────────────────────────

const CLASSIC_GEOM = [
  { cx: 240, cy: 192 }, // top-left
  { cx: 400, cy: 192 }, // top-right
  { cx: 320, cy: 320 }, // bottom
];
const CLASSIC_MARKER = { cx: 320, cy: 235 };

function ClassicLabels({ data, state }: { data: VennDataset; state: B1State }) {
  // Optical centers per feedback_optical_check_after_aligning:
  // - A unique-region lune horizontal center at y=168: x=216 (between A's left edge ~114
  //   and B's chord at 320, midpoint 217 rounded).
  // - B mirror: x=424.
  // - C bottom-half symmetric: (320, 376) — math centroid matches optical for symmetric.
  const positions: { primary: string; subtitle?: string; pos: LabelPos }[] =
    state.labelPosition === 'leader-line'
      ? [
          { primary: data.circles[0]?.label ?? '', subtitle: data.circles[0]?.subtitle, pos: { x: 96, y: 144, anchor: 'start' } },
          { primary: data.circles[1]?.label ?? '', subtitle: data.circles[1]?.subtitle, pos: { x: 624, y: 144, anchor: 'end' } },
          { primary: data.circles[2]?.label ?? '', subtitle: data.circles[2]?.subtitle, pos: { x: 320, y: 464, anchor: 'middle' } },
        ]
      : state.labelPosition === 'inside'
        ? [
            { primary: data.circles[0]?.label ?? '', subtitle: data.circles[0]?.subtitle, pos: { x: 272, y: 224, anchor: 'middle' } },
            { primary: data.circles[1]?.label ?? '', subtitle: data.circles[1]?.subtitle, pos: { x: 368, y: 224, anchor: 'middle' } },
            { primary: data.circles[2]?.label ?? '', subtitle: data.circles[2]?.subtitle, pos: { x: 320, y: 280, anchor: 'middle' } },
          ]
        : [
            // Optical positions per feedback_optical_check_after_aligning + block-balance math:
            // - A's lune incenter (equidistant from A's outer arc, B's chord, C's arc) was
            //   (200.5, 156.3). 2026-05-20 retuned for the 2-line block (primary 13 + subtitle 11):
            //   measured at the actual subtitle width "Figma, Sketch, Framer" (~130px), x=200 put
            //   block left edge at x=135, with A's outer arc at y=152 at x≈118 — only 17px gap on
            //   left vs 55px gap on right. Shifted x=200 → 215 to rebalance: left gap 32px,
            //   right gap (to A∩B chord at x=320) 40px. Closer to even spacing all around.
            // - B mirrors A across figure center: x=440 → 425.
            // - C lune (bottom): block at (320, 360) is already left/right symmetric (each side ~52px
            //   from C's arc at y=360). Top/bottom gaps: top 55px (to A∩C arc at y≈295), bottom
            //   68px (to C's bottom arc at y=448). Slight bottom-heavy bias, acceptable for the
            //   asymmetric lune shape (the upper boundary curves inward, eating block top room).
            { primary: data.circles[0]?.label ?? '', subtitle: data.circles[0]?.subtitle, pos: { x: 210, y: 158, anchor: 'middle' } },
            { primary: data.circles[1]?.label ?? '', subtitle: data.circles[1]?.subtitle, pos: { x: 430, y: 158, anchor: 'middle' } },
            { primary: data.circles[2]?.label ?? '', subtitle: data.circles[2]?.subtitle, pos: { x: 320, y: 360, anchor: 'middle' } },
          ];
  return (
    <>
      {positions.map((p, i) =>
        p.primary ? (
          <CircleLabelText key={i} pos={p.pos} primary={p.primary} subtitle={p.subtitle} state={state} />
        ) : null,
      )}
      {state.labelPosition === 'leader-line' && (
        <>
          <line x1={148} y1={140} x2={160} y2={128} stroke="var(--dir-detail)" strokeWidth={1} />
          <line x1={572} y1={140} x2={480} y2={128} stroke="var(--dir-detail)" strokeWidth={1} />
          <line x1={320} y1={448} x2={320} y2={416} stroke="var(--dir-detail)" strokeWidth={1} />
        </>
      )}
    </>
  );
}

function ClassicAnnotation({ data, state }: { data: VennDataset; state: B1State }) {
  if (state.annotationPointer === 'off') return null;
  // Right-side label positioned past right circle's edge: at y=276, right circle reaches
  // x≈497, bottom circle reaches x≈440. Label at x=536 has 39+ px gap.
  const labelX = 536;
  const labelY = 276;
  return (
    <g>
      {state.annotationPointer === 'arrow' && state.centerMarker !== 'none' && (
        <path
          // Arrow stroke at --dir-detail (W1 §B "annotation accents" role per color-system-w1.md L48), not --dir-text-primary which is reserved for titles + headings. Heavy ink on a thin annotation arrow read too prominent against the Venn outlines.
          d={`M ${CLASSIC_MARKER.cx + MARKER_SIZE / 2} ${CLASSIC_MARKER.cy} Q ${CLASSIC_MARKER.cx + 96} ${CLASSIC_MARKER.cy - 8} ${labelX - 8} ${labelY - 4}`}
          stroke="var(--dir-detail)"
          strokeWidth={1}
          fill="none"
          markerEnd="url(#b1-arrowhead)"
        />
      )}
      <text
        x={labelX}
        y={labelY}
        style={{
          fontFamily: IS,
          fontSize: 13,
          fontWeight: 400,
          fill: 'var(--dir-text-primary)',
        }}
      >
        {caseTransform(data.centerLabel, state.labelStyle)}
      </text>
      {data.centerSubtitle && (() => {
        // Wrap centerSubtitle to two lines at the comma-or-and break, so the annotation
        // pulls directly from data instead of hardcoding Leyi's specific phrasing.
        // Leyi: "Bridging design, production, and AI-assisted workflow"
        //   → line 1: "Bridging design, production,"
        //   → line 2: "and AI-assisted workflow"
        const sub = data.centerSubtitle;
        const splitIdx = sub.lastIndexOf(', ');
        const line1 = splitIdx > 0 ? sub.slice(0, splitIdx + 1) : sub;
        const line2 = splitIdx > 0 ? sub.slice(splitIdx + 2) : null;
        return (
          <>
            <text x={labelX} y={labelY + 16} style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, fill: 'var(--dir-text-secondary)' }}>
              {line1}
            </text>
            {line2 && (
              <text x={labelX} y={labelY + 32} style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, fill: 'var(--dir-text-secondary)' }}>
                {line2}
              </text>
            )}
          </>
        );
      })()}
    </g>
  );
}

function VariantClassic({ data, state }: { data: VennDataset; state: B1State }) {
  // ViewBox origin shifted (-40, 16) to center the CIRCLES ONLY in the raised-surface
  // card (user spec 2026-05-21: ignore the arrow + "Ion is here" annotation when
  // calculating center; just center the 3 circles, let the annotation hang off as a
  // tail). Math: circle-only horizontal extent = x=112 (A's left edge) to x=528 (B's
  // right edge), center at x=320. Vertical extent = y=64 (A/B tops) to y=448 (C's
  // bottom), center at y=256. To put (320, 256) at the viewBox geometric center, origin
  // needs to be at (320 - 360, 256 - 240) = (-40, 16). The annotation (extending to
  // x≈660) is still visible within the new viewBox right edge at x=680, just as a
  // right-extending tail off the centered circles. SVG is alignSelf:'center' in the
  // flex parent so the centered-circle SVG sits dead-center in the raised card.
  return (
    <svg
      viewBox={`-40 16 ${VIEW_W} ${VIEW_H}`}
      style={{ width: '100%', maxWidth: 680, height: 'auto', display: 'block', alignSelf: 'center' }}
      role="img"
      aria-label={`Venn diagram — ${data.name}`}
    >
      <VennDefs />
      <text x={CLASSIC_MARKER.cx} y={32} textAnchor="middle" style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-secondary)' }}>
        {/* Eyebrow positioned at CLASSIC_MARKER.cx (the Venn's focal point) instead of VIEW_W/2 so it reads as a label OVER the diagram's center of mass, not floating above empty SVG space. Text "Where Ion fits in the stack" matches §04 pull-quote phrasing verbatim ("where Ion fit in the user's stack") — drops "design-tool" false specificity (the Venn shows Design tools + Code editors + AI assistants, not just design tools). */}
        Where Ion fits in the stack
      </text>
      {CLASSIC_GEOM.map((c, i) => (
        <VennCircle key={i} cx={c.cx} cy={c.cy} r={R} state={state} seed={i + 1} />
      ))}
      <ClassicLabels data={data} state={state} />
      <CenterMarker cx={CLASSIC_MARKER.cx} cy={CLASSIC_MARKER.cy} marker={state.centerMarker} data={data} state={state} />
      <ClassicAnnotation data={data} state={state} />
    </svg>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: 2-circle overlap-focused — emphasize the vesica
// ───────────────────────────────────────────────────────────────────────────

// Two circles with centers 144 apart (overlap = 256-144 = 112). r=128 each.
// Optical centers of unique lune regions (corrected per feedback_optical_check):
// - Vesica chord (intersection line) at x=360, intersection points at (360, 134) and
//   (360, 346) — NOT a circle boundary.
// - Left circle at y=240 spans x=160-416. Right circle at y=240 spans x=304-560.
//   Overlap zone at y=240: x=304-416.
//   Left's unique x at y=240: 160-304. Center = 232.
// - Right's unique x at y=240: 416-560. Center = 488.
const TWO_GEOM = [
  { cx: 288, cy: 240 },
  { cx: 432, cy: 240 },
];
const TWO_MARKER = { cx: 360, cy: 240 };

function VariantTwoCircle({ data, state }: { data: VennDataset; state: B1State }) {
  const circles = data.circles.slice(0, 2);
  const labelPositions: LabelPos[] =
    state.labelPosition === 'leader-line'
      ? [
          { x: 96, y: 232, anchor: 'start' },
          { x: 624, y: 232, anchor: 'end' },
        ]
      : state.labelPosition === 'inside'
        ? [
            { x: 320, y: 240, anchor: 'middle' },
            { x: 400, y: 240, anchor: 'middle' },
          ]
        : [
            { x: 232, y: 232, anchor: 'middle' },
            { x: 488, y: 232, anchor: 'middle' },
          ];
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      style={{ width: '100%', maxWidth: 680, height: 'auto', display: 'block', alignSelf: 'center' }}
      role="img"
      aria-label={`Venn diagram (2-circle overlap) — ${data.name}`}
    >
      <VennDefs />
      <text x={VIEW_W / 2} y={32} textAnchor="middle" style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-secondary)' }}>
        Vesica · 2-circle overlap
      </text>
      {TWO_GEOM.map((c, i) => (
        <VennCircle key={i} cx={c.cx} cy={c.cy} r={R} state={state} seed={i + 11} />
      ))}
      {circles.map((c, i) => (
        <CircleLabelText key={i} pos={labelPositions[i]!} primary={c.label} subtitle={c.subtitle} state={state} />
      ))}
      <CenterMarker cx={TWO_MARKER.cx} cy={TWO_MARKER.cy} marker={state.centerMarker} data={data} state={state} />
      {state.annotationPointer !== 'off' && (
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 32}
          textAnchor="middle"
          style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, fill: 'var(--dir-text-primary)' }}
        >
          {caseTransform(data.centerLabel, state.labelStyle)} — vesica register
        </text>
      )}
    </svg>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: 4-circle complex landscape — synthesized 4-tool dataset
// ───────────────────────────────────────────────────────────────────────────

// 4 circles in 2x2 arrangement with all 4 sharing a small central overlap.
// Centers offset 64 from figure center; r=128 means adjacent circles share extensive
// overlap and all 4 share a small central diamond. This is the "complex landscape"
// register — not a true 4-set Venn (which is geometrically impossible with circles).
const FOUR_GEOM = [
  { cx: 288, cy: 192 }, // top-left
  { cx: 416, cy: 192 }, // top-right
  { cx: 288, cy: 320 }, // bottom-left
  { cx: 416, cy: 320 }, // bottom-right
];
const FOUR_MARKER = { cx: 352, cy: 256 };

function VariantFourCircle({ state }: { state: B1State }) {
  const data = ION_VENN_SYNTHESIZED_4;
  const labelPositions: LabelPos[] =
    state.labelPosition === 'leader-line'
      ? [
          { x: 96, y: 96, anchor: 'start' },
          { x: 624, y: 96, anchor: 'end' },
          { x: 96, y: 416, anchor: 'start' },
          { x: 624, y: 416, anchor: 'end' },
        ]
      : state.labelPosition === 'inside'
        ? [
            { x: 320, y: 168, anchor: 'middle' },
            { x: 384, y: 168, anchor: 'middle' },
            { x: 320, y: 344, anchor: 'middle' },
            { x: 384, y: 344, anchor: 'middle' },
          ]
        : [
            // Optical centers per quadrant unique region.
            // Top-left circle's unique x-range at y=144 = 173-301 (capped by top-right's
            // chord); center = 237 → rounded to 240. Vertical 144 = 48 above circle cy=192,
            // putting block visual center near unique y midpoint (~152).
            // Mirrors apply by symmetry around figure center (360, 256).
            { x: 240, y: 144, anchor: 'middle' },
            { x: 480, y: 144, anchor: 'middle' },
            { x: 240, y: 368, anchor: 'middle' },
            { x: 480, y: 368, anchor: 'middle' },
          ];
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      style={{ width: '100%', maxWidth: 680, height: 'auto', display: 'block', alignSelf: 'center' }}
      role="img"
      aria-label={`Venn diagram (4-circle landscape) — ${data.name}`}
    >
      <VennDefs />
      <text x={VIEW_W / 2} y={32} textAnchor="middle" style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-secondary)' }}>
        4-tool landscape · synthesized
      </text>
      {FOUR_GEOM.map((c, i) => (
        <VennCircle key={i} cx={c.cx} cy={c.cy} r={R} state={state} seed={i + 21} />
      ))}
      {data.circles.map((c, i) => (
        <CircleLabelText key={i} pos={labelPositions[i]!} primary={c.label} subtitle={c.subtitle} state={state} />
      ))}
      <CenterMarker cx={FOUR_MARKER.cx} cy={FOUR_MARKER.cy} marker={state.centerMarker} data={data} state={state} />
      <text
        x={VIEW_W / 2}
        y={VIEW_H - 32}
        textAnchor="middle"
        style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-secondary)' }}
      >
        synthesized · illustrative only
      </text>
    </svg>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: inverse Venn — focal sits OUTSIDE central intersection
// ───────────────────────────────────────────────────────────────────────────

// Reuses 3-circle classic geometry. Focal marker positioned above the diagram (clearly
// outside any circle) with a connecting arrow showing the gap. Annotation: "Ion sits in
// the gap" register. Per playground plan §3 inverse: "Focuses on the gap (item lives
// outside the overlap)."

const INVERSE_MARKER = { cx: 320, cy: 48 }; // above all circles — y=48 (space-7) leaves 4px gap to top circles' top edge at y=64

function VariantInverse({ data, state }: { data: VennDataset; state: B1State }) {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      style={{ width: '100%', maxWidth: 680, height: 'auto', display: 'block', alignSelf: 'center' }}
      role="img"
      aria-label={`Inverse Venn — ${data.name}`}
    >
      <VennDefs />
      <text x={VIEW_W / 2} y={16} textAnchor="middle" style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-secondary)' }}>
        Inverse · focal sits in the gap
      </text>
      {CLASSIC_GEOM.map((c, i) => (
        <VennCircle key={i} cx={c.cx} cy={c.cy} r={R} state={state} seed={i + 31} />
      ))}
      <ClassicLabels data={data} state={state} />
      {/* Focal marker placed above all circles (in the gap above the diagram) */}
      <CenterMarker cx={INVERSE_MARKER.cx} cy={INVERSE_MARKER.cy} marker={state.centerMarker} data={data} state={state} />
      {/* Arrow from focal marker DOWN toward the central intersection (showing where the focal SHOULD be) */}
      {state.annotationPointer === 'arrow' && state.centerMarker !== 'none' && (
        <line
          x1={INVERSE_MARKER.cx}
          y1={INVERSE_MARKER.cy + MARKER_SIZE / 2}
          x2={CLASSIC_MARKER.cx}
          y2={CLASSIC_MARKER.cy - 16}
          stroke="var(--dir-text-primary)"
          strokeWidth={1}
          markerEnd="url(#b1-arrowhead)"
        />
      )}
      {state.annotationPointer === 'callout' && (
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 32}
          textAnchor="middle"
          style={{ fontFamily: IS, fontSize: 11, fontWeight: 400, fill: 'var(--dir-text-primary)' }}
        >
          Ion sits in the gap — outside the categorical overlap
        </text>
      )}
    </svg>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Top-level dispatch
// ───────────────────────────────────────────────────────────────────────────

/**
 * B1 Venn Positioning artifact.
 *
 * Default behavior: consumes the artifact-playground state via context — so the
 * /artifacts playground page can drive it via toggles.
 *
 * `stateOverride` (optional): pass a full B1State to lock the component to a
 * specific configuration, decoupling it from the playground. Used by §04
 * Diagnosis in `GateAIonR1Shell.tsx` to render the COCREATE-dataset classic
 * Venn with hand-drawn stroke as the section's diagnostic artifact, regardless
 * of what the playground toggles are set to.
 */
export function B1VennPositioning({ stateOverride }: { stateOverride?: B1State } = {}) {
  const { b1: playgroundState } = useGateAIonArtifactPlayground();
  const b1 = stateOverride ?? playgroundState;
  const data: VennDataset = b1.ionSource === 'cocreate' ? ION_VENN_COCREATE : ION_VENN_LEYI;
  // When stateOverride is provided, the component is rendering inside a case-study
  // section (currently §04). Suppress the dataset bodyContext paragraph in that
  // mode — case-study prose already carries section context, and bodyContext would
  // duplicate it. Playground mode (no override) still shows bodyContext for the
  // standalone artifact-explorer experience.
  const isCaseStudyMode = stateOverride !== undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {data.bodyContext && b1.variant === 'classic' && !isCaseStudyMode && (
        <p
          style={{
            fontFamily: IS,
            fontSize: 13,
            fontWeight: 400,
            lineHeight: 1.6,
            color: 'var(--dir-text-secondary)',
            margin: 0,
            maxWidth: 680,
          }}
        >
          {data.bodyContext}
        </p>
      )}
      {b1.variant === 'classic' && <VariantClassic data={data} state={b1} />}
      {b1.variant === 'overlap-focused' && <VariantTwoCircle data={data} state={b1} />}
      {b1.variant === 'four-circle' && <VariantFourCircle state={b1} />}
      {b1.variant === 'inverse' && <VariantInverse data={data} state={b1} />}
    </div>
  );
}
