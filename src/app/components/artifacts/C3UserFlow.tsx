import React from 'react';
import { IS } from '../cards/tokens';
import { ION_USER_FLOW_SIMPLIFIED, type C3Node } from './data/ion-user-flow';
import { useGateAIonArtifactPlayground, type C3State } from '../../state/GateAIonArtifactPlaygroundContext';
import {
  roughRectPath,
  roughOvalPath,
  roughDiamondPath,
  roughLinePath,
  roughOrthogonalPath,
  roughRectPoints,
  roughOvalPoints,
  roughDiamondPoints,
  HAND_FEEL_BASE,
  penTipPath,
  sampleLine,
  sampleOrthogonal,
  handFeelArrowChevron,
  rotatePointsAround,
  crossHatchRotationFor,
  scalePointsAround,
  parallelPassScaleFor,
  parallelPassTranslateFor,
  offsetLinePerpendicular,
} from '../../lib/handFeel';

// C3 · User Flow / Decision Tree — 4 register candidates rendered for compare.
// Source: gate-a-ion-c3-userflow-register-research.md (4 ranked reframe candidates).
//
// Candidate A · Hand-feel UML (rough.js applied to flowchart shapes) — RECOMMENDED
// Candidate B · Annotated-editorial UML (clean strokes + Ion-grounded annotations)
// Candidate C · Numbered-stepper Holmes register (small-caps numbers + forking-rect decision)
// Candidate D · Diptych register (clean forward + heavy hand-feel loopback only)
//
// The user flips through the Variant dropdown to compare visually. The winner gets
// locked as native; the others archive as register-alternatives.
//
// SYSTEM ADHERENCE (audited per candidate):
// - Typography: locked ladder only — IS 10/500/0.12em uppercase (eyebrow, decision
//   eyebrow, step numbers, branch labels, source caps), IS 11/300 (node labels,
//   annotations, captions). No off-ladder sizes. ISe not used.
// - Spacing: locked tokens — gap 24 (Block) section gap, gap 8/12 (Micro/Tight)
//   inside annotation rows, internal SVG geometry uses pixel-multiples-of-4.
// - Color: W1 tokens only — node strokes + edges = --dir-text-primary,
//   node fills = --dir-raised, annotation = --dir-text-secondary, eyebrow +
//   step-number + caps = --dir-detail. No accent tints, no rgba.
//
// rough.js technique: implemented locally (no external dep), seeded LCG for
// stability. Calibration target per research: between B1/D1 and Excalidraw —
// roughness 1.4-1.6 for boxes, 1.2 for the diamond, 0.9-1.1 for forward edges.

// ───────────────────────────────────────────────────────────────────────────
// Shared geometry — asymmetric box widths fit-to-label content
// ───────────────────────────────────────────────────────────────────────────

const VB_W = 1280;
const ROW_Y = 240;
const NODE_H = 44;
const DIAMOND_H = 80;
const GAP = 36;          // widened from 24 → 36 so arrows have breathing room
                          // alongside wobbly box edges (request 2026-05-05)
const ARROW_BUFFER = 4;   // pull arrow ends back from box edge by this much
                          // so wobble overshoots don't visually merge with arrows

// Per-node widths sized to label length × IS 11 metrics (~6.5px/char) + 48px
// horizontal padding, snapped to multiples of 4 (locked spacing token).
// Diamond is wider to accommodate the longer "Iteration acceptable?" label
// inside its rotated bounding box.
const NODE_W: Record<string, number> = {
  start:    120,
  open:     100,
  prompt:   152,
  generate: 140,
  iterate:  168,
  check:    200,  // diamond
  end:      160,
};

// Compute left-edge X positions running left-to-right with GAP between each.
const NODES_ORDER = ['start', 'open', 'prompt', 'generate', 'iterate', 'check', 'end'];
const POS: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  let x = 8; // 8px left margin inside viewBox
  for (const id of NODES_ORDER) {
    map[id] = x;
    x += NODE_W[id] + GAP;
  }
  return map;
})();

function rightAnchor(id: string): { x: number; y: number } {
  return { x: POS[id] + NODE_W[id] + ARROW_BUFFER, y: ROW_Y };
}
function leftAnchor(id: string): { x: number; y: number } {
  return { x: POS[id] - ARROW_BUFFER, y: ROW_Y };
}
function topCenter(id: string, h: number = NODE_H): { x: number; y: number } {
  return { x: POS[id] + NODE_W[id] / 2, y: ROW_Y - h / 2 };
}

// Rough.js technique now extracted to lib/handFeel.ts (shared module).
// `wobble` multiplier from C3State.handFeel scales each shape's base roughness
// at render time. Default 1.0 = current calibration; 0 = clean; 2 = doubly
// wobbly. Excalidraw signature zone begins around 1.4.

// ───────────────────────────────────────────────────────────────────────────
// Shared atoms
// ───────────────────────────────────────────────────────────────────────────

function ArrowHeadDef({ id }: { id: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="9" refY="5"
      markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--dir-text-primary)" />
    </marker>
  );
}

// Stroke-edge grain filters (Step 5 — texture/grain).
// feTurbulence generates seeded fractal noise; feDisplacementMap offsets the
// source pixels using the noise as a displacement field. Result: edge-break
// that reads as pencil/charcoal grain without altering the underlying
// hand-drawn geometry.
//
// Defensible per gate-a-ion-texture-and-pen-tip-research.md §3:
// - Geometry already hand-drawn at the rough.js layer — filter is additive grain only.
// - Seed explicit + committed = deterministic per MDN.
// - Scale stays ≤3.5px so it doesn't degrade into "fake wobble on clean line."
// - Not animated.
function TextureFilterDefs({ idPrefix }: { idPrefix: string }) {
  return (
    <>
      {/* Light pencil-edge grain — subtle break, low octaves */}
      <filter id={`${idPrefix}-grain-light`} x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" />
      </filter>
      {/* Heavy pencil-edge grain — more octaves, larger displacement */}
      <filter id={`${idPrefix}-grain-heavy`} x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="13" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" />
      </filter>
      {/* Chalky / charcoal grit — high octaves + large scale */}
      <filter id={`${idPrefix}-grain-chalky`} x="-12%" y="-12%" width="124%" height="124%">
        <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="4" seed="29" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" />
      </filter>
      {/* Paper tooth — high-frequency small-detail break, low displacement.
          Mimics drawing on rough cold-press paper: stroke catches the tooth. */}
      <filter id={`${idPrefix}-grain-paper-tooth`} x="-6%" y="-6%" width="112%" height="112%">
        <feTurbulence type="fractalNoise" baseFrequency="0.18" numOctaves="2" seed="41" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" />
      </filter>
      {/* Ribbed / laid-paper — horizontal-bias noise (low-X high-Y baseFrequency).
          Strokes appear to break along horizontal grain like laid paper. */}
      <filter id={`${idPrefix}-grain-ribbed`} x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence type="fractalNoise" baseFrequency="0.02 0.6" numOctaves="2" seed="53" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" />
      </filter>
      {/* Stipple — very-high-frequency fractal noise. Dot-like edge break,
          halftone-adjacent register. */}
      <filter id={`${idPrefix}-grain-stipple`} x="-6%" y="-6%" width="112%" height="112%">
        <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="3" seed="67" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" />
      </filter>
      {/* Wet ink — slight Gaussian blur THEN displacement. Fountain-pen on
          absorbent paper register — soft edge with subtle bleed. */}
      <filter id={`${idPrefix}-grain-wet-ink`} x="-8%" y="-8%" width="116%" height="116%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" result="blurred" />
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="79" result="noise" />
        <feDisplacementMap in="blurred" in2="noise" scale="1.3" />
      </filter>
      {/* Smudge — asymmetric vertical-bias displacement (high-Y, low-X freq).
          Reads like charcoal rubbed sideways along the stroke. */}
      <filter id={`${idPrefix}-grain-smudge`} x="-12%" y="-12%" width="124%" height="124%">
        <feTurbulence type="fractalNoise" baseFrequency="0.025 0.12" numOctaves="3" seed="89" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="4.2" />
      </filter>
      {/* Canvas weave — uniform medium-high frequency in both axes. Stroke
          breaks reflect the woven crosshatch of canvas. */}
      <filter id={`${idPrefix}-grain-canvas`} x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence type="turbulence" baseFrequency="0.22" numOctaves="2" seed="103" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" />
      </filter>
    </>
  );
}

/** Map texture state to filter URL (or undefined for 'none'). */
function textureFilterUrl(
  texture: 'none' | 'light' | 'heavy' | 'chalky' | 'paper-tooth' | 'ribbed' | 'stipple' | 'wet-ink' | 'smudge' | 'canvas',
  idPrefix: string,
): string | undefined {
  if (texture === 'none') return undefined;
  return `url(#${idPrefix}-grain-${texture})`;
}

function NodeLabel({ node, h, fontSize = 11 }: { node: C3Node; h: number; fontSize?: number }) {
  const x = POS[node.id];
  const w = NODE_W[node.id];
  const y = ROW_Y - h / 2;
  return (
    <foreignObject x={x} y={y} width={w} height={h}>
      <div
        // @ts-expect-error xmlns required for foreignObject children in some browsers
        xmlns="http://www.w3.org/1999/xhtml"
        style={{
          width: '100%', height: '100%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          padding: node.shape === 'diamond' ? '0 22px' : '0 12px',
          textAlign: 'center', boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            fontFamily: IS, fontSize, fontWeight: 300, lineHeight: 1.35,
            color: 'var(--dir-text-primary)',
          }}
        >
          {node.label}
        </span>
      </div>
    </foreignObject>
  );
}

function ArtifactHeader({ candidateName, tagline }: { candidateName: string; tagline: string }) {
  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p
        style={{
          fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0,
        }}
      >
        Synthesized · illustrative only · simplified Ion flow · {candidateName}
      </p>
      <p
        style={{
          fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.6,
          color: 'var(--dir-text-secondary)', margin: 0, maxWidth: 720,
        }}
      >
        {tagline}
      </p>
    </header>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Candidate A · Hand-feel UML (rough.js applied to all shapes)
// ───────────────────────────────────────────────────────────────────────────

function CandidateA({ state }: { state: C3State }) {
  const { nodes } = ION_USER_FLOW_SIMPLIFIED;
  const VB_H = 360;
  const ARC_TOP_Y = 100;
  const showLabels = state.decisionLabels === 'on';

  // Per-shape roughness derived from base calibration × user-tunable wobble multiplier.
  // wobble defaults to 1.0 (current calibration); 0 = clean; 2 = doubly wobbly.
  // strokeCount and strokeWidth are user-tunable too.
  const wobble = state.handFeel.wobble;
  const strokeCount = state.handFeel.strokeCount;
  const strokeWidthMul = state.handFeel.strokeWidth;
  const endpointBehavior = state.handFeel.endpointBehavior;
  const sketchingStyle = state.handFeel.sketchingStyle;
  const penTip = state.handFeel.penTip;
  const usePenTip = penTip !== 'plain';
  const textureFilter = textureFilterUrl(state.handFeel.texture, 'c3a');

  // Generate N seed offsets for layered multi-stroke renders. First layer is the
  // primary fill-bearing path; subsequent layers add the "drawn-twice" residue.
  // Each offset is a coprime increment to keep the LCG sequences distinct.
  const seedOffsets = (base: number): number[] => {
    const increments = [0, 47, 113, 181, 257];
    return increments.slice(0, strokeCount).map((inc) => base + inc);
  };

  // Build per-layer mods for the shape helpers. layerIndex drives loose-overlap
  // spread; endpointBehavior + sketchingStyle pass through unchanged.
  const layerMods = (i: number) => ({
    endpointBehavior,
    sketchingStyle,
    layerIndex: i,
  });

  const renderShape = (n: C3Node) => {
    const ROUGH_BOX = HAND_FEEL_BASE.rect * wobble;
    const ROUGH_DIAMOND = HAND_FEEL_BASE.diamond * wobble;
    if (n.shape === 'oval') {
      const x = POS[n.id]; const y = ROW_Y - NODE_H / 2; const w = NODE_W[n.id];
      const seeds = seedOffsets(n.id.charCodeAt(0) * 13);
      // Pen-tip mode: render N layered closed-loop polygons via perfect-freehand
      // with rough.js-jittered points (different seeds per layer for distinct
      // jitter), plus a paper fill underneath for label legibility.
      if (usePenTip) {
        const cx = x + w / 2;
        const cy = ROW_Y;
        return (
          <g key={n.id}>
            <path d={roughOvalPath(x, y, w, NODE_H, ROUGH_BOX, seeds[0], layerMods(0))}
              fill="var(--dir-raised)" stroke="none" />
            {seeds.map((s, i) => {
              let pts = roughOvalPoints(x, y, w, NODE_H, ROUGH_BOX, s, layerMods(i));
              if (sketchingStyle === 'cross-hatch') {
                pts = rotatePointsAround(pts, cx, cy, crossHatchRotationFor(i));
              } else if (sketchingStyle === 'parallel-pass') {
                pts = scalePointsAround(pts, cx, cy, parallelPassScaleFor(i));
              }
              return (
                <path key={i}
                  d={penTipPath(pts, penTip, strokeWidthMul, s)}
                  fill="var(--dir-text-primary)" stroke="none" />
              );
            })}
          </g>
        );
      }
      const cxOval = x + w / 2;
      const cyOval = ROW_Y;
      return (
        <g key={n.id}>
          {seeds.map((s, i) => {
            const rot = sketchingStyle === 'cross-hatch' ? crossHatchRotationFor(i) : 0;
            const trans = sketchingStyle === 'parallel-pass' ? parallelPassTranslateFor(i) : { dx: 0, dy: 0 };
            const transform = rot ? `rotate(${rot} ${cxOval} ${cyOval})` : (trans.dx || trans.dy ? `translate(${trans.dx} ${trans.dy})` : undefined);
            return (
              <path key={i}
                d={roughOvalPath(x, y, w, NODE_H, ROUGH_BOX, s, layerMods(i))}
                fill={i === 0 ? 'var(--dir-raised)' : 'none'}
                stroke="var(--dir-text-primary)"
                strokeWidth={(i === 0 ? 1.25 : 1) * strokeWidthMul}
                strokeLinejoin="round"
                transform={transform} />
            );
          })}
        </g>
      );
    }
    if (n.shape === 'rect') {
      const x = POS[n.id]; const y = ROW_Y - NODE_H / 2; const w = NODE_W[n.id];
      const seeds = seedOffsets(n.id.charCodeAt(0) * 13);
      if (usePenTip) {
        const cx = x + w / 2;
        const cy = ROW_Y;
        return (
          <g key={n.id}>
            <path d={roughRectPath(x, y, w, NODE_H, ROUGH_BOX, seeds[0], layerMods(0))}
              fill="var(--dir-raised)" stroke="none" />
            {seeds.map((s, i) => {
              let pts = roughRectPoints(x, y, w, NODE_H, ROUGH_BOX, s, layerMods(i));
              if (sketchingStyle === 'cross-hatch') {
                pts = rotatePointsAround(pts, cx, cy, crossHatchRotationFor(i));
              } else if (sketchingStyle === 'parallel-pass') {
                pts = scalePointsAround(pts, cx, cy, parallelPassScaleFor(i));
              }
              return (
                <path key={i}
                  d={penTipPath(pts, penTip, strokeWidthMul, s)}
                  fill="var(--dir-text-primary)" stroke="none" />
              );
            })}
          </g>
        );
      }
      const cxRect = x + w / 2;
      const cyRect = ROW_Y;
      return (
        <g key={n.id}>
          {seeds.map((s, i) => {
            const rot = sketchingStyle === 'cross-hatch' ? crossHatchRotationFor(i) : 0;
            const trans = sketchingStyle === 'parallel-pass' ? parallelPassTranslateFor(i) : { dx: 0, dy: 0 };
            const transform = rot ? `rotate(${rot} ${cxRect} ${cyRect})` : (trans.dx || trans.dy ? `translate(${trans.dx} ${trans.dy})` : undefined);
            return (
              <path key={i}
                d={roughRectPath(x, y, w, NODE_H, ROUGH_BOX, s, layerMods(i))}
                fill={i === 0 ? 'var(--dir-raised)' : 'none'}
                stroke="var(--dir-text-primary)"
                strokeWidth={(i === 0 ? 1.25 : 1) * strokeWidthMul}
                strokeLinejoin="round"
                transform={transform} />
            );
          })}
        </g>
      );
    }
    // diamond
    const cx = POS.check + NODE_W.check / 2; const cy = ROW_Y;
    const hw = NODE_W.check / 2; const hh = DIAMOND_H / 2;
    const seeds = seedOffsets(91);
    if (usePenTip) {
      return (
        <g key={n.id}>
          <path d={roughDiamondPath(cx, cy, hw, hh, ROUGH_DIAMOND, seeds[0], layerMods(0))}
            fill="var(--dir-raised)" stroke="none" />
          {seeds.map((s, i) => {
            let pts = roughDiamondPoints(cx, cy, hw, hh, ROUGH_DIAMOND, s, layerMods(i));
            if (sketchingStyle === 'cross-hatch') {
              pts = rotatePointsAround(pts, cx, cy, crossHatchRotationFor(i));
            } else if (sketchingStyle === 'parallel-pass') {
              pts = scalePointsAround(pts, cx, cy, parallelPassScaleFor(i));
            }
            return (
              <path key={i}
                d={penTipPath(pts, penTip, strokeWidthMul, s)}
                fill="var(--dir-text-primary)" stroke="none" />
            );
          })}
        </g>
      );
    }
    return (
      <g key={n.id}>
        {seeds.map((s, i) => {
          const rot = sketchingStyle === 'cross-hatch' ? crossHatchRotationFor(i) : 0;
          const trans = sketchingStyle === 'parallel-pass' ? parallelPassTranslateFor(i) : { dx: 0, dy: 0 };
          const transform = rot ? `rotate(${rot} ${cx} ${cy})` : (trans.dx || trans.dy ? `translate(${trans.dx} ${trans.dy})` : undefined);
          return (
            <path key={i}
              d={roughDiamondPath(cx, cy, hw, hh, ROUGH_DIAMOND, s, layerMods(i))}
              fill={i === 0 ? 'var(--dir-raised)' : 'none'}
              stroke="var(--dir-text-primary)"
              strokeWidth={(i === 0 ? 1.25 : 1) * strokeWidthMul}
              strokeLinejoin="round"
              transform={transform} />
          );
        })}
      </g>
    );
  };

  // Forward edges: rough lines
  const forwardEdges: Array<[string, string, string?]> = [
    ['start', 'open'], ['open', 'prompt'], ['prompt', 'generate'],
    ['generate', 'iterate'], ['iterate', 'check'],
    ['check', 'end', 'Yes'],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <ArtifactHeader
        candidateName="Candidate A · Hand-feel UML"
        tagline="Same UML shape vocabulary, redrawn with rough.js multi-stroke jittered Bezier (sibling-coherent with B1 Venn + D1 wavy spectrum). Asymmetric box widths fit each label. Decision diamond carries an eyebrow cap."
      />
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%"
        style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
        role="img" aria-label="Hand-feel UML user flow with rough.js shapes">
        <defs>
          <ArrowHeadDef id="c3a-arrow" />
          <TextureFilterDefs idPrefix="c3a" />
        </defs>

        {/* Hand-feel content wrapped in filter group when texture is active.
            Text labels + decision eyebrow render OUTSIDE the filter group so
            feDisplacementMap doesn't warp letterforms. */}
        <g filter={textureFilter}>
        {/* Loopback (rough orthogonal) — rendered behind nodes */}
        {(() => {
          const start = topCenter('check', DIAMOND_H);
          const target = topCenter('generate', NODE_H);
          const segs: Array<[number, number, number, number]> = [
            [start.x, start.y, start.x, ARC_TOP_Y],
            [start.x, ARC_TOP_Y, target.x, ARC_TOP_Y],
            [target.x, ARC_TOP_Y, target.x, target.y],
          ];
          const lineSeeds = seedOffsets(211);
          // Pen-tip render: use perfect-freehand polygon fills instead of plain
          // strokes when a non-'plain' preset is selected. Sample the orthogonal
          // path into a contiguous point sequence, feed each layer through
          // perfect-freehand with the preset's params, render as filled SVG path.
          return (
            <g>
              {usePenTip
                ? (() => {
                    // Pen-tip render: N layered polygons (per stroke count) with
                    // sketching-style applied per layer. parallel-pass = each
                    // layer offset perpendicular; cross-hatch falls back since
                    // rotation around an orthogonal U doesn't read clean.
                    const basePts = sampleOrthogonal(segs, 36);
                    const target = topCenter('generate', NODE_H);
                    const chevron = handFeelArrowChevron(
                      target.x, target.y,
                      target.x, target.y - 24,
                      penTip, strokeWidthMul, lineSeeds[0] + 71,
                    );
                    return (
                      <>
                        {lineSeeds.map((s, i) => {
                          let pts = basePts;
                          if (sketchingStyle === 'parallel-pass') {
                            pts = offsetLinePerpendicular(basePts, i);
                          }
                          return (
                            <path key={i}
                              d={penTipPath(pts, penTip, strokeWidthMul, s)}
                              fill="var(--dir-text-primary)" stroke="none" />
                          );
                        })}
                        {chevron && <path d={chevron} fill="var(--dir-text-primary)" stroke="none" />}
                      </>
                    );
                  })()
                : lineSeeds.map((s, i) => (
                    <path key={i}
                      d={roughOrthogonalPath(segs, HAND_FEEL_BASE.orthogonal * wobble, s, layerMods(i))}
                      fill="none"
                      stroke="var(--dir-text-primary)"
                      strokeWidth={1 * strokeWidthMul}
                      strokeLinecap="round"
                      markerEnd={i === lineSeeds.length - 1 ? 'url(#c3a-arrow)' : undefined} />
                  ))}
              {showLabels && (
                <text x={(start.x + target.x) / 2} y={ARC_TOP_Y - 10} textAnchor="middle"
                  style={{
                    fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
                    textTransform: 'uppercase', fill: 'var(--dir-detail)',
                  }}>
                  No · regenerate
                </text>
              )}
            </g>
          );
        })()}

        {/* Forward edges */}
        {forwardEdges.map(([from, to, label], i) => {
          const a = rightAnchor(from);
          const b = leftAnchor(to);
          const edgeSeeds = seedOffsets((i + 1) * 31);
          return (
            <g key={i}>
              {usePenTip
                ? (() => {
                    // Pen-tip render: N layered polygons + hand-feel chevron.
                    const basePts = sampleLine(a.x, a.y, b.x, b.y, 14);
                    const chevron = handFeelArrowChevron(
                      b.x, b.y, a.x, a.y,
                      penTip, strokeWidthMul, edgeSeeds[0] + 71,
                    );
                    return (
                      <>
                        {edgeSeeds.map((s, k) => {
                          let pts = basePts;
                          if (sketchingStyle === 'parallel-pass') {
                            pts = offsetLinePerpendicular(basePts, k);
                          }
                          return (
                            <path key={k}
                              d={penTipPath(pts, penTip, strokeWidthMul, s)}
                              fill="var(--dir-text-primary)" stroke="none" />
                          );
                        })}
                        {chevron && <path d={chevron} fill="var(--dir-text-primary)" stroke="none" />}
                      </>
                    );
                  })()
                : edgeSeeds.map((s, k) => (
                    <path key={k}
                      d={roughLinePath(a.x, a.y, b.x, b.y, HAND_FEEL_BASE.line * wobble, s, layerMods(k))}
                      fill="none"
                      stroke="var(--dir-text-primary)"
                      strokeWidth={1 * strokeWidthMul}
                      strokeLinecap="round"
                      markerEnd={k === edgeSeeds.length - 1 ? 'url(#c3a-arrow)' : undefined} />
                  ))}
              {showLabels && label && (
                <text x={(a.x + b.x) / 2} y={a.y - 8} textAnchor="middle"
                  style={{
                    fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
                    textTransform: 'uppercase', fill: 'var(--dir-detail)',
                  }}>
                  {label}
                </text>
              )}
            </g>
          );
        })}

        {/* Shapes (still inside filter group — texture applies to outlines too) */}
        {nodes.map(renderShape)}
        </g>

        {/* Decision eyebrow + node labels render OUTSIDE the filter so text
            stays crisp regardless of texture preset. */}
        <text x={POS.check + NODE_W.check / 2} y={ROW_Y - DIAMOND_H / 2 - 16} textAnchor="middle"
          style={{
            fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', fill: 'var(--dir-detail)',
          }}>
          Decision
        </text>
        {nodes.map((n) => <NodeLabel key={`l-${n.id}`} node={n} h={n.shape === 'diamond' ? DIAMOND_H : NODE_H} />)}
      </svg>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Candidate B · Annotated-editorial UML (clean strokes + Ion-grounded annotations)
// ───────────────────────────────────────────────────────────────────────────

function CandidateB({ state }: { state: C3State }) {
  const { nodes } = ION_USER_FLOW_SIMPLIFIED;
  const ANNOT_GAP = 18;          // axis ↔ annotation gap
  const ANNOT_HEIGHT = 56;       // 2-line annotation block per node
  const VB_H = ROW_Y + DIAMOND_H / 2 + ANNOT_GAP + ANNOT_HEIGHT + 24;
  const ARC_TOP_Y = 100;
  const showLabels = state.decisionLabels === 'on';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <ArtifactHeader
        candidateName="Candidate B · Annotated-editorial UML"
        tagline="Clean vector strokes (no wobble). Each step carries an Ion-grounded annotation under it; decision diamond gets an eyebrow cap and full-word branch labels. Type and composition do the lifting."
      />
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%"
        style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
        role="img" aria-label="Annotated-editorial UML user flow with Ion-grounded captions">
        <defs><ArrowHeadDef id="c3b-arrow" /></defs>

        {/* Loopback */}
        {(() => {
          const start = topCenter('check', DIAMOND_H);
          const target = topCenter('generate', NODE_H);
          const d = `M ${start.x} ${start.y} V ${ARC_TOP_Y} H ${target.x} V ${target.y}`;
          return (
            <g>
              <path d={d} fill="none" stroke="var(--dir-text-primary)" strokeWidth={1}
                markerEnd="url(#c3b-arrow)" />
              {showLabels && (
                <text x={(start.x + target.x) / 2} y={ARC_TOP_Y - 8} textAnchor="middle"
                  style={{
                    fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
                    textTransform: 'uppercase', fill: 'var(--dir-text-secondary)',
                  }}>
                  No — regenerate
                </text>
              )}
            </g>
          );
        })()}

        {/* Forward edges with full-word branch labels.
            The check→end gap is only ~28px so a long label like "Yes — ship it"
            clips into the handoff oval. Use the short form there and let the
            decision eyebrow + annotation under the diamond carry the context. */}
        {([
          ['start', 'open'], ['open', 'prompt'], ['prompt', 'generate'],
          ['generate', 'iterate'], ['iterate', 'check'],
          ['check', 'end', 'Yes'],
        ] as Array<[string, string, string?]>).map(([from, to, label], i) => {
          const a = rightAnchor(from);
          const b = leftAnchor(to);
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="var(--dir-text-primary)" strokeWidth={1}
                markerEnd="url(#c3b-arrow)" />
              {showLabels && label && (
                <text x={(a.x + b.x) / 2} y={a.y - 8} textAnchor="middle"
                  style={{
                    fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
                    textTransform: 'uppercase', fill: 'var(--dir-text-secondary)',
                  }}>
                  {label}
                </text>
              )}
            </g>
          );
        })}

        {/* Decision eyebrow */}
        <text x={POS.check + NODE_W.check / 2} y={ROW_Y - DIAMOND_H / 2 - 14} textAnchor="middle"
          style={{
            fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', fill: 'var(--dir-detail)',
          }}>
          Decision
        </text>

        {/* Clean shapes */}
        {nodes.map((n) => {
          if (n.shape === 'oval') {
            const x = POS[n.id]; const y = ROW_Y - NODE_H / 2;
            return <rect key={n.id} x={x} y={y} width={NODE_W[n.id]} height={NODE_H}
              rx={22} ry={22} fill="var(--dir-raised)" stroke="var(--dir-text-primary)" strokeWidth={1.25} />;
          }
          if (n.shape === 'rect') {
            const x = POS[n.id]; const y = ROW_Y - NODE_H / 2;
            return <rect key={n.id} x={x} y={y} width={NODE_W[n.id]} height={NODE_H}
              rx={2} ry={2} fill="var(--dir-raised)" stroke="var(--dir-text-primary)" strokeWidth={1.25} />;
          }
          const cx = POS.check + NODE_W.check / 2;
          const hw = NODE_W.check / 2; const hh = DIAMOND_H / 2;
          const points = `${cx},${ROW_Y - hh} ${cx + hw},${ROW_Y} ${cx},${ROW_Y + hh} ${cx - hw},${ROW_Y}`;
          return <polygon key={n.id} points={points} fill="var(--dir-raised)" stroke="var(--dir-text-primary)" strokeWidth={1.25} />;
        })}

        {/* Labels */}
        {nodes.map((n) => <NodeLabel key={`l-${n.id}`} node={n} h={n.shape === 'diamond' ? DIAMOND_H : NODE_H} />)}

        {/* Annotations under each node — IS 11/300 */}
        {nodes.map((n) => {
          if (!n.annotation) return null;
          const x = POS[n.id];
          const w = NODE_W[n.id];
          const annotY = ROW_Y + (n.shape === 'diamond' ? DIAMOND_H / 2 : NODE_H / 2) + ANNOT_GAP;
          return (
            <foreignObject key={`a-${n.id}`} x={x - 8} y={annotY} width={w + 16} height={ANNOT_HEIGHT}>
              <div
                // @ts-expect-error xmlns
                xmlns="http://www.w3.org/1999/xhtml"
                style={{ textAlign: 'center', padding: '0 4px' }}>
                <p
                  style={{
                    fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.4,
                    color: 'var(--dir-text-secondary)', margin: 0,
                  }}
                >
                  {n.annotation}
                </p>
              </div>
            </foreignObject>
          );
        })}
      </svg>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Candidate C · Numbered-stepper Holmes register
// ───────────────────────────────────────────────────────────────────────────
// Step numbers (small-caps eyebrow) above each node. Decision step is a heavier
// rectangle with two exit arrows from its right side at different y-positions,
// each with full-word branch labels. Loopback uses curved-endpoint quadratic
// beziers (not orthogonal jogs).

function CandidateC({ state }: { state: C3State }) {
  const { nodes } = ION_USER_FLOW_SIMPLIFIED;
  const VB_H = 440;
  const ARC_TOP_Y = 84;
  const showLabels = state.decisionLabels === 'on';

  // Replace diamond with a heavier rectangle (forking-rect treatment).
  // Two exit arrows from its right side at offset y-positions.
  const decision = nodes.find((n) => n.id === 'check')!;
  const decisionX = POS.check;
  const decisionW = NODE_W.check;
  const decisionY = ROW_Y - NODE_H / 2;          // use same height as other rects for consistency
  const decisionRightX = decisionX + decisionW;
  const upperExitY = ROW_Y - 12;
  const lowerExitY = ROW_Y + 12;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <ArtifactHeader
        candidateName="Candidate C · Numbered-stepper (Holmes register)"
        tagline="Each step carries a small-caps step number. Decision becomes a heavier-bordered forking rectangle with two exit arrows. Loopback uses curved-endpoint Bezier (not orthogonal jogs). Closer to NYT / Bloomberg explanation graphics."
      />
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%"
        style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
        role="img" aria-label="Numbered-stepper Holmes-register user flow">
        <defs><ArrowHeadDef id="c3c-arrow" /></defs>

        {/* Loopback — orthogonal U-shape with quadratic-rounded corners.
            Earlier curved-endpoint attempt produced visual artifacts (overlapping
            beziers + L moves at the decision exit). Cleaner: orthogonal U with
            16px corner radius via quadratic Bezier turns. The "curves at the
            corners" still distinguish this from candidates A/B/D's sharp jogs. */}
        {(() => {
          const sx = decisionRightX;
          const sy = lowerExitY;
          const tx = POS.generate + NODE_W.generate / 2;
          const ty = ROW_Y - NODE_H / 2;
          const r = 16;
          const d = [
            `M ${sx} ${sy}`,
            `H ${sx + r}`,
            `Q ${sx + r * 2} ${sy} ${sx + r * 2} ${sy - r}`,
            `V ${ARC_TOP_Y + r}`,
            `Q ${sx + r * 2} ${ARC_TOP_Y} ${sx + r} ${ARC_TOP_Y}`,
            `H ${tx + r}`,
            `Q ${tx} ${ARC_TOP_Y} ${tx} ${ARC_TOP_Y + r}`,
            `V ${ty}`,
          ].join(' ');
          return (
            <g>
              <path d={d} fill="none" stroke="var(--dir-text-primary)" strokeWidth={1.25}
                markerEnd="url(#c3c-arrow)" />
              {showLabels && (
                <text x={(sx + tx) / 2 + 16} y={ARC_TOP_Y - 12} textAnchor="middle"
                  style={{
                    fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em',
                    textTransform: 'uppercase', fill: 'var(--dir-detail)',
                  }}>
                  Regenerate
                </text>
              )}
            </g>
          );
        })()}

        {/* Forward edges — straight horizontals between consecutive non-decision nodes */}
        {([
          ['start', 'open'], ['open', 'prompt'], ['prompt', 'generate'],
          ['generate', 'iterate'], ['iterate', 'check'],
        ] as Array<[string, string]>).map(([from, to], i) => {
          const a = rightAnchor(from);
          const b = leftAnchor(to);
          return (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="var(--dir-text-primary)" strokeWidth={1}
              markerEnd="url(#c3c-arrow)" />
          );
        })}

        {/* Upper exit from decision → end (handoff). Label placed above the
            upper exit arrow with vertical clearance so it doesn't collide with
            the arrow line. The 24px gap is too narrow for "ITERATION ACCEPTABLE"
            at full caps spacing — placed at y = upperExitY - 14 reads cleanly
            above the arrow into the negative space above the row. */}
        <line x1={decisionRightX} y1={upperExitY} x2={POS.end} y2={ROW_Y}
          stroke="var(--dir-text-primary)" strokeWidth={1}
          markerEnd="url(#c3c-arrow)" />
        {showLabels && (
          <text x={(decisionRightX + POS.end) / 2} y={upperExitY - 14} textAnchor="middle"
            style={{
              fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em',
              textTransform: 'uppercase', fill: 'var(--dir-detail)',
            }}>
            Accept
          </text>
        )}

        {/* Step numbers above each node */}
        {nodes.map((n) => {
          const x = POS[n.id] + NODE_W[n.id] / 2;
          const y = ROW_Y - NODE_H / 2 - 14;
          return (
            <text key={`n-${n.id}`} x={x} y={y} textAnchor="middle"
              style={{
                fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em',
                textTransform: 'uppercase', fill: 'var(--dir-detail)',
                fontVariantNumeric: 'tabular-nums',
              }}>
              {n.stepNumber}
            </text>
          );
        })}

        {/* Shapes — decision = heavier-stroked rect, others = canonical */}
        {nodes.map((n) => {
          if (n.id === 'check') {
            return (
              <rect key={n.id} x={decisionX} y={decisionY}
                width={decisionW} height={NODE_H}
                rx={2} ry={2}
                fill="var(--dir-raised)"
                stroke="var(--dir-text-primary)"
                strokeWidth={2} />
            );
          }
          if (n.shape === 'oval') {
            const x = POS[n.id]; const y = ROW_Y - NODE_H / 2;
            return <rect key={n.id} x={x} y={y} width={NODE_W[n.id]} height={NODE_H}
              rx={22} ry={22} fill="var(--dir-raised)" stroke="var(--dir-text-primary)" strokeWidth={1.25} />;
          }
          const x = POS[n.id]; const y = ROW_Y - NODE_H / 2;
          return <rect key={n.id} x={x} y={y} width={NODE_W[n.id]} height={NODE_H}
            rx={2} ry={2} fill="var(--dir-raised)" stroke="var(--dir-text-primary)" strokeWidth={1.25} />;
        })}

        {/* Labels — diamond label rendered inside the rect at full NODE_H */}
        {nodes.map((n) => <NodeLabel key={`l-${n.id}`} node={n} h={NODE_H} />)}
      </svg>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Candidate D · Diptych register (clean forward + heavy hand-feel loopback)
// ───────────────────────────────────────────────────────────────────────────
// Forward path renders clean (same as the original native). Loopback alone
// gets the rough.js multi-stroke treatment plus heavier weight, calling out
// the iteration/regeneration moment as the human-residue point in the flow.

function CandidateD({ state }: { state: C3State }) {
  const { nodes } = ION_USER_FLOW_SIMPLIFIED;
  const VB_H = 360;
  const ARC_TOP_Y = 100;
  const showLabels = state.decisionLabels === 'on';
  // Diptych intentionally pushes the loopback's roughness ABOVE the base — it's
  // the only hand-feel element in the candidate. wobble + strokeCount + strokeWidth
  // all scale the loopback proportionally so the user can dial down if it reads
  // too cartoony, or up if the contrast with the clean forward path is too subtle.
  const wobble = state.handFeel.wobble;
  const strokeCount = state.handFeel.strokeCount;
  const strokeWidthMul = state.handFeel.strokeWidth;
  const endpointBehavior = state.handFeel.endpointBehavior;
  const sketchingStyle = state.handFeel.sketchingStyle;
  const penTip = state.handFeel.penTip;
  const usePenTip = penTip !== 'plain';
  const textureFilter = textureFilterUrl(state.handFeel.texture, 'c3d');
  // Generate seed offsets per the strokeCount toggle. Roughness varies slightly
  // by layer to preserve the "drawn twice" residue. At strokeCount = 1 only the
  // primary heaviest layer renders.
  const dLoopbackLayers = (() => {
    const base = [
      { rough: 2.8, width: 1.8, seed: 311 },
      { rough: 2.4, width: 1.5, seed: 311 + 47 },
      { rough: 2.6, width: 1.6, seed: 311 + 113 },
      { rough: 2.5, width: 1.4, seed: 311 + 181 },
      { rough: 2.3, width: 1.3, seed: 311 + 257 },
    ];
    return base.slice(0, strokeCount).map((l, idx) => ({
      rough: l.rough * wobble,
      width: l.width * strokeWidthMul,
      seed: l.seed,
      mods: { endpointBehavior, sketchingStyle, layerIndex: idx },
    }));
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <ArtifactHeader
        candidateName="Candidate D · Diptych register"
        tagline="Forward path renders clean (mechanical, disciplined). Loopback alone is hand-drawn at heavier weight — the only place in the flow where iteration is non-deterministic. The contrast carries the register: system clean when working, human residue at the re-decision moment."
      />
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%"
        style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
        role="img" aria-label="Diptych register: clean forward path + hand-feel loopback">
        <defs>
          <ArrowHeadDef id="c3d-arrow" />
          <TextureFilterDefs idPrefix="c3d" />
        </defs>

        {/* Loopback (rough orthogonal, heavier weight, multi-stroke).
            Texture filter applies ONLY to the loopback in D — the diptych
            concept is "clean forward, hand-feel loopback" so grain belongs
            on the loopback only. */}
        {(() => {
          const start = topCenter('check', DIAMOND_H);
          const target = topCenter('generate', NODE_H);
          const segs: Array<[number, number, number, number]> = [
            [start.x, start.y, start.x, ARC_TOP_Y],
            [start.x, ARC_TOP_Y, target.x, ARC_TOP_Y],
            [target.x, ARC_TOP_Y, target.x, target.y],
          ];
          return (
            <g filter={textureFilter}>
              {/* Layered passes for the hand-feel multi-stroke. Layer count tied
                  to strokeCount toggle. Roughness raised above base so the contrast
                  with the clean forward path actually reads at the artifact's render
                  scale. Last layer carries the arrowhead. */}
              {usePenTip
                ? (() => {
                    // Pen-tip render: N layered polygons (heavy diptych weight)
                    // + hand-feel chevron.
                    const pts = sampleOrthogonal(segs, 36);
                    const target = topCenter('generate', NODE_H);
                    const chevron = handFeelArrowChevron(
                      target.x, target.y,
                      target.x, target.y - 24,
                      penTip, strokeWidthMul * 1.4, dLoopbackLayers[0].seed + 71,
                    );
                    return (
                      <>
                        {dLoopbackLayers.map((layer, i) => (
                          <path key={i}
                            d={penTipPath(pts, penTip, strokeWidthMul * 1.4, layer.seed)}
                            fill="var(--dir-text-primary)" stroke="none" />
                        ))}
                        {chevron && <path d={chevron} fill="var(--dir-text-primary)" stroke="none" />}
                      </>
                    );
                  })()
                : dLoopbackLayers.map((layer, i) => (
                    <path key={i}
                      d={roughOrthogonalPath(segs, layer.rough, layer.seed, layer.mods)}
                      fill="none"
                      stroke="var(--dir-text-primary)"
                      strokeWidth={layer.width}
                      strokeLinecap="round"
                      markerEnd={i === dLoopbackLayers.length - 1 ? 'url(#c3d-arrow)' : undefined} />
                  ))}
              {showLabels && (
                <text x={(start.x + target.x) / 2} y={ARC_TOP_Y - 12} textAnchor="middle"
                  style={{
                    fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em',
                    textTransform: 'uppercase', fill: 'var(--dir-detail)',
                  }}>
                  No — designer regenerates
                </text>
              )}
            </g>
          );
        })()}

        {/* Forward edges (clean) */}
        {([
          ['start', 'open'], ['open', 'prompt'], ['prompt', 'generate'],
          ['generate', 'iterate'], ['iterate', 'check'],
          ['check', 'end', 'Yes'],
        ] as Array<[string, string, string?]>).map(([from, to, label], i) => {
          const a = rightAnchor(from);
          const b = leftAnchor(to);
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="var(--dir-text-primary)" strokeWidth={1}
                markerEnd="url(#c3d-arrow)" />
              {showLabels && label && (
                <text x={(a.x + b.x) / 2} y={a.y - 8} textAnchor="middle"
                  style={{
                    fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
                    textTransform: 'uppercase', fill: 'var(--dir-text-secondary)',
                  }}>
                  {label}
                </text>
              )}
            </g>
          );
        })}

        {/* Decision eyebrow */}
        <text x={POS.check + NODE_W.check / 2} y={ROW_Y - DIAMOND_H / 2 - 14} textAnchor="middle"
          style={{
            fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', fill: 'var(--dir-detail)',
          }}>
          Decision
        </text>

        {/* Clean shapes — same as Candidate B */}
        {nodes.map((n) => {
          if (n.shape === 'oval') {
            const x = POS[n.id]; const y = ROW_Y - NODE_H / 2;
            return <rect key={n.id} x={x} y={y} width={NODE_W[n.id]} height={NODE_H}
              rx={22} ry={22} fill="var(--dir-raised)" stroke="var(--dir-text-primary)" strokeWidth={1.25} />;
          }
          if (n.shape === 'rect') {
            const x = POS[n.id]; const y = ROW_Y - NODE_H / 2;
            return <rect key={n.id} x={x} y={y} width={NODE_W[n.id]} height={NODE_H}
              rx={2} ry={2} fill="var(--dir-raised)" stroke="var(--dir-text-primary)" strokeWidth={1.25} />;
          }
          const cx = POS.check + NODE_W.check / 2;
          const hw = NODE_W.check / 2; const hh = DIAMOND_H / 2;
          const points = `${cx},${ROW_Y - hh} ${cx + hw},${ROW_Y} ${cx},${ROW_Y + hh} ${cx - hw},${ROW_Y}`;
          return <polygon key={n.id} points={points} fill="var(--dir-raised)" stroke="var(--dir-text-primary)" strokeWidth={1.25} />;
        })}

        {/* Labels */}
        {nodes.map((n) => <NodeLabel key={`l-${n.id}`} node={n} h={n.shape === 'diamond' ? DIAMOND_H : NODE_H} />)}
      </svg>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Top-level dispatch
// ───────────────────────────────────────────────────────────────────────────

export function C3UserFlow() {
  const { c3 } = useGateAIonArtifactPlayground();
  if (c3.variant === 'candidate-a') return <CandidateA state={c3} />;
  if (c3.variant === 'candidate-b') return <CandidateB state={c3} />;
  if (c3.variant === 'candidate-c') return <CandidateC state={c3} />;
  return <CandidateD state={c3} />;
}
