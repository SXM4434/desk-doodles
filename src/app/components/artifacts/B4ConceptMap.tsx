import React from 'react';
import { IS } from '../cards/tokens';
import { ION_CONCEPT_MAP, type ConceptNode, type ConceptLink } from './data/ion-concept-map';
import { useGateAIonArtifactPlayground, type B4State } from '../../state/GateAIonArtifactPlaygroundContext';

// B4 · Concept Map — three registers built on the same Ion concept-map dataset.
//
// Native: Novak hierarchical top-down (HTML/CSS grid). Locked.
// Variants:
//   · Node-link classic — force-directed organic feel, hand-tuned positions, SVG.
//   · Mind-map radial — Buzan-style concentric, curved branches, SVG.
//
// SYSTEM ADHERENCE:
// - Typography: locked ladder — IS 10/500/0.12em uppercase (eyebrow + edge labels),
//   IS 11/300 (leaf labels), IS 11/500 (tier-2 labels), IS 13/500 (root focal).
// - Spacing: locked tokens — viewBox dimensions and padding from token list.
// - Color: W1 only — strokes + text --dir-text-primary, focal fill --dir-raised,
//   edge labels --dir-detail, cross-links dashed.

type Pos = { x: number; y: number };

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function filterByNodeCount(state: B4State): { nodes: ConceptNode[]; links: ConceptLink[] } {
  const data = ION_CONCEPT_MAP;
  const root = data.nodes.find((n) => n.level === 0)!;
  const tier2 = data.nodes.filter((n) => n.level === 1);
  const allLeaves = data.nodes.filter((n) => n.level === 2);
  const visibleLeaves = allLeaves.slice(0, Math.max(0, state.nodeCount - 1 - tier2.length));
  const visibleIds = new Set([root.id, ...tier2.map((n) => n.id), ...visibleLeaves.map((n) => n.id)]);
  const nodes = data.nodes.filter((n) => visibleIds.has(n.id));
  const links = data.links.filter(
    (l) => visibleIds.has(l.from) && visibleIds.has(l.to) && (state.showCrossLinks === 'on' || !l.isCrossLink),
  );
  return { nodes, links };
}

type NodeRender = { lines: string[]; width: number; height: number };

function leafLines(label: string): string[] {
  // Deterministic 2-line wrap at first space — keeps all leaves the same shape
  // so the variant geometry can budget a single uniform leaf footprint.
  const idx = label.indexOf(' ');
  if (idx === -1) return [label];
  return [label.slice(0, idx), label.slice(idx + 1)];
}

function computeNodeRender(node: ConceptNode): NodeRender {
  if (node.level === 0) {
    return { lines: ['Designer agency in', 'AI-assisted work'], width: 168, height: 56 };
  }
  if (node.level === 1) {
    return { lines: [node.label], width: 84, height: 32 };
  }
  return { lines: leafLines(node.label), width: 96, height: 44 };
}

function VariantNodeMark({
  pos,
  node,
  shape,
  highlightFocal,
}: {
  pos: Pos;
  node: ConceptNode;
  shape: B4State['nodeShape'];
  highlightFocal: boolean;
}) {
  const render = computeNodeRender(node);
  const { width: w, height: h, lines } = render;
  const fontSize = node.level === 0 ? 13 : 11;
  const fontWeight = node.level === 0 ? 500 : node.level === 1 ? 500 : 300;
  const isFocal = highlightFocal && node.isFocal === true;
  const fill = isFocal ? 'var(--dir-raised)' : 'var(--dir-bg)';
  const stroke = 'var(--dir-text-primary)';

  let shapeEl: React.ReactNode;
  if (shape === 'circle') {
    const r = Math.max(w, h) / 2;
    shapeEl = <circle cx={pos.x} cy={pos.y} r={r} fill={fill} stroke={stroke} strokeWidth={1} />;
  } else if (shape === 'box') {
    shapeEl = <rect x={pos.x - w / 2} y={pos.y - h / 2} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={1} />;
  } else {
    shapeEl = (
      <rect
        x={pos.x - w / 2}
        y={pos.y - h / 2}
        width={w}
        height={h}
        rx={h / 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
      />
    );
  }

  const lineHeight = fontSize * 1.25;
  const totalTextHeight = lines.length * lineHeight;
  const firstBaselineY = pos.y - totalTextHeight / 2 + fontSize * 0.85;

  return (
    <g>
      {shapeEl}
      <text
        textAnchor="middle"
        style={{
          fontFamily: IS,
          fontSize,
          fontWeight,
          letterSpacing: node.level === 0 ? '-0.01em' : '0',
          fill: 'var(--dir-text-primary)',
        }}
      >
        {lines.map((line, i) => (
          <tspan key={i} x={pos.x} y={firstBaselineY + i * lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function EdgeLabel({ x, y, label }: { x: number; y: number; label: string }) {
  // Halo via paint-order=stroke so the label punches through the edge line cleanly.
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      style={{
        fontFamily: IS,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fill: 'var(--dir-detail)',
        stroke: 'var(--dir-bg)',
        strokeWidth: 4,
        paintOrder: 'stroke',
      }}
    >
      {label}
    </text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Native register — Novak hierarchical top-down (HTML/CSS grid)
// ─────────────────────────────────────────────────────────────────────────────

function NodeBox({
  label,
  shape,
  focal,
  level,
}: {
  label: string;
  shape: B4State['nodeShape'];
  focal: boolean;
  level: 0 | 1 | 2;
}) {
  const isFocal = focal && level === 0;
  const padding = level === 0 ? '12px 24px' : '10px 16px';
  const borderRadius = shape === 'oval' ? 999 : shape === 'circle' ? 999 : 0;
  const fontSize = level === 0 ? 13 : level === 1 ? 13 : 11;
  const fontWeight = level === 0 ? 500 : level === 1 ? 500 : 300;
  return (
    <div
      style={{
        padding,
        border: '1px solid var(--dir-text-primary)',
        backgroundColor: isFocal ? 'var(--dir-raised)' : 'var(--dir-bg)',
        borderRadius,
        display: 'inline-block',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: IS,
          fontSize,
          fontWeight,
          lineHeight: 1.4,
          letterSpacing: level === 0 ? '-0.01em' : '0',
          color: 'var(--dir-text-primary)',
          margin: 0,
        }}
      >
        {label}
      </p>
    </div>
  );
}

function ConnectorLine({ label, showLabel }: { label: string; showLabel: boolean }) {
  // Segmented connector: line(top) → label(middle, breathing room) → line(bottom).
  // When label is hidden, render a single solid 32px line for consistent vertical rhythm.
  if (!showLabel) {
    return <span aria-hidden style={{ display: 'block', width: 1, height: 32, backgroundColor: 'var(--dir-text-primary)' }} />;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span aria-hidden style={{ width: 1, height: 16, backgroundColor: 'var(--dir-text-primary)' }} />
      <span
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--dir-detail)',
          padding: '8px 0',
        }}
      >
        {label}
      </span>
      <span aria-hidden style={{ width: 1, height: 16, backgroundColor: 'var(--dir-text-primary)' }} />
    </div>
  );
}

function NativeHierarchical({ state }: { state: B4State }) {
  const data = ION_CONCEPT_MAP;
  const nodeBudget = state.nodeCount;
  const root = data.nodes.find((n) => n.level === 0)!;
  const tier2 = data.nodes.filter((n) => n.level === 1);
  const leaves = data.nodes.filter((n) => n.level === 2);
  const visibleLeaves = leaves.slice(0, Math.max(0, nodeBudget - 1 - tier2.length));
  const visibleLeafIds = new Set(visibleLeaves.map((n) => n.id));

  const clusters = tier2.map((t2) => {
    const childLinks = data.links.filter((l) => l.from === t2.id && visibleLeafIds.has(l.to));
    const children = childLinks.map((link) => ({
      leaf: leaves.find((n) => n.id === link.to)!,
      linkLabel: link.label,
    }));
    const fromRootLink = data.links.find((l) => l.from === root.id && l.to === t2.id);
    return {
      tier2: t2,
      rootLinkLabel: fromRootLink?.label ?? '',
      children,
    };
  });

  const crossLinks =
    state.showCrossLinks === 'on'
      ? data.links.filter((l) => l.isCrossLink && visibleLeafIds.has(l.from) && visibleLeafIds.has(l.to))
      : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
      <p
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--dir-detail)',
          margin: 0,
          alignSelf: 'flex-start',
        }}
      >
        Concept map · Novak hierarchical top-down
      </p>

      <NodeBox label={root.label} shape={state.nodeShape} focal={state.highlightFocal === 'on'} level={0} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, width: '100%' }}>
        {clusters.map((c, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
            <ConnectorLine label={c.rootLinkLabel} showLabel={state.connectionLabels === 'on'} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, width: '100%', alignItems: 'start' }}>
        {clusters.map((c, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <NodeBox label={c.tier2.label} shape={state.nodeShape} focal={false} level={1} />
            {c.children.map((child, j) => (
              <React.Fragment key={j}>
                <ConnectorLine label={child.linkLabel} showLabel={state.connectionLabels === 'on'} />
                <NodeBox label={child.leaf.label} shape={state.nodeShape} focal={false} level={2} />
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>

      {crossLinks.length > 0 && (
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingTop: 16,
            borderTop: '1px dashed var(--dir-detail)',
          }}
        >
          <p
            style={{
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--dir-detail)',
              margin: 0,
            }}
          >
            Cross-links · Novak signature
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {crossLinks.map((link, i) => {
              const fromNode = data.nodes.find((n) => n.id === link.from);
              const toNode = data.nodes.find((n) => n.id === link.to);
              if (!fromNode || !toNode) return null;
              return (
                <li key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: IS, fontSize: 11, fontWeight: 500, color: 'var(--dir-text-primary)' }}>
                    {fromNode.label}
                  </span>
                  <span
                    style={{
                      fontFamily: IS,
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--dir-detail)',
                    }}
                  >
                    {link.label}
                  </span>
                  <span style={{ fontFamily: IS, fontSize: 11, fontWeight: 500, color: 'var(--dir-text-primary)' }}>
                    {toNode.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p
        style={{
          fontFamily: IS,
          fontSize: 11,
          fontWeight: 300,
          lineHeight: 1.6,
          color: 'var(--dir-text-secondary)',
          margin: 0,
          maxWidth: 680,
          alignSelf: 'flex-start',
        }}
      >
        Designer agency at the root. Trust / Control / Speed as the second tier. Atomic concerns as leaves with labeled connection verbs. Cross-links surface separately — Novak's signature device for connecting concepts that span branches.
      </p>
      {data.synthesized && (
        <p
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--dir-detail)',
            margin: 0,
            alignSelf: 'flex-start',
          }}
        >
          synthesized · structure interpreted from Demo Day 3 Insights + affinity themes
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant · Node-link classic (force-directed organic feel)
// ─────────────────────────────────────────────────────────────────────────────
//
// Hand-tuned positions to feel like the output of a force-directed simulation
// (clusters around tier-2 parents, varying edge lengths, cross-links allowed to
// cross other edges — that crossing energy is part of the register).

const FD_VIEWBOX = { w: 720, h: 500 };

const FD_POSITIONS: Record<string, Pos> = {
  // Root center, three cluster centers in equilateral arrangement around it.
  root: { x: 360, y: 230 },
  trust: { x: 190, y: 130 },
  speed: { x: 530, y: 130 },
  control: { x: 360, y: 380 },
  // Trust cluster — upper-left, leaves fanned around tier-2.
  'trust-pred': { x: 90, y: 60 },
  'trust-valid': { x: 90, y: 200 },
  'trust-partner': { x: 260, y: 50 },
  // Speed cluster — upper-right (mirror of trust).
  'spd-async': { x: 640, y: 60 },
  'spd-cycle': { x: 640, y: 200 },
  'spd-checks': { x: 470, y: 50 },
  // Control cluster — bottom row, evenly spaced.
  'ctl-iter': { x: 220, y: 430 },
  'ctl-scope': { x: 360, y: 460 },
  'ctl-qa': { x: 510, y: 430 },
};

// Cross-links route around the root box rather than through it. A null entry
// means the straight path already clears every node, so no curve is needed.
const FD_CROSSLINK_CONTROL: Record<string, Pos | null> = {
  'trust-pred|ctl-iter': null, // straight path stays well left of root
  'trust-valid|spd-cycle': { x: 365, y: 350 }, // dip below root
  'trust-partner|ctl-qa': { x: 520, y: 200 }, // skirt right of root
};

function StraightEdge({
  from,
  to,
  label,
  showLabel,
  dashed,
  labelT = 0.5,
}: {
  from: Pos;
  to: Pos;
  label: string;
  showLabel: boolean;
  dashed: boolean;
  labelT?: number;
}) {
  // labelT shifts the label along the segment (0 = at from, 1 = at to). Used to
  // bias root→tier-2 labels off the root box corner.
  const lx = from.x + labelT * (to.x - from.x);
  const ly = from.y + labelT * (to.y - from.y);
  return (
    <>
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke="var(--dir-text-primary)"
        strokeWidth={1}
        strokeDasharray={dashed ? '4 3' : undefined}
      />
      {showLabel && <EdgeLabel x={lx} y={ly + 3} label={label} />}
    </>
  );
}

// Quadratic bezier dashed edge — used for cross-links that need to route around
// an obstacle (in force-directed, around the root box).
function CurvedDashedEdge({
  from,
  to,
  control,
  label,
  showLabel,
}: {
  from: Pos;
  to: Pos;
  control: Pos;
  label: string;
  showLabel: boolean;
}) {
  return (
    <>
      <path
        d={`M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`}
        fill="none"
        stroke="var(--dir-text-primary)"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      {showLabel && <EdgeLabel x={control.x} y={control.y + 3} label={label} />}
    </>
  );
}

function VariantNodeLinkClassic({ state }: { state: B4State }) {
  const { nodes, links } = filterByNodeCount(state);
  // Render tree edges first (under nodes), cross-links second (still under nodes
  // but visually distinct via dashed stroke), nodes on top so any line stub
  // inside the node fill is covered.
  const treeLinks = links.filter((l) => !l.isCrossLink);
  const crossLinks = links.filter((l) => l.isCrossLink);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'flex-start', width: '100%' }}>
      <p
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--dir-detail)',
          margin: 0,
        }}
      >
        Concept map · Node-link classic · force-directed register
      </p>

      <svg
        viewBox={`0 0 ${FD_VIEWBOX.w} ${FD_VIEWBOX.h}`}
        width="100%"
        style={{ display: 'block', maxWidth: 720 }}
        role="img"
        aria-label="Concept map node-link classic variant"
      >
        {/* Tree edges. Root → tier-2 labels biased toward the tier-2 end so the
            label clears the root box corner. */}
        {treeLinks.map((link, i) => {
          const from = FD_POSITIONS[link.from];
          const to = FD_POSITIONS[link.to];
          if (!from || !to) return null;
          const labelT = link.from === 'root' ? 0.58 : 0.5;
          return (
            <StraightEdge
              key={`tree-${i}`}
              from={from}
              to={to}
              label={link.label}
              showLabel={state.connectionLabels === 'on'}
              dashed={false}
              labelT={labelT}
            />
          );
        })}
        {/* Cross-links — dashed; routed around root via quadratic bezier when
            the straight path would cut through the root box. */}
        {crossLinks.map((link, i) => {
          const from = FD_POSITIONS[link.from];
          const to = FD_POSITIONS[link.to];
          if (!from || !to) return null;
          const control = FD_CROSSLINK_CONTROL[`${link.from}|${link.to}`];
          if (control) {
            return (
              <CurvedDashedEdge
                key={`cross-${i}`}
                from={from}
                to={to}
                control={control}
                label={link.label}
                showLabel={state.connectionLabels === 'on'}
              />
            );
          }
          return (
            <StraightEdge
              key={`cross-${i}`}
              from={from}
              to={to}
              label={link.label}
              showLabel={state.connectionLabels === 'on'}
              dashed
            />
          );
        })}
        {/* Nodes on top */}
        {nodes.map((node) => {
          const pos = FD_POSITIONS[node.id];
          if (!pos) return null;
          return (
            <VariantNodeMark
              key={node.id}
              pos={pos}
              node={node}
              shape={state.nodeShape}
              highlightFocal={state.highlightFocal === 'on'}
            />
          );
        })}
      </svg>

      <p
        style={{
          fontFamily: IS,
          fontSize: 11,
          fontWeight: 300,
          lineHeight: 1.6,
          color: 'var(--dir-text-secondary)',
          margin: 0,
          maxWidth: 680,
        }}
      >
        Looser register — same hierarchy and same labeled relationships, but positioned organically rather than gridded. Cross-branch links read as crossings in the diagram, the way they would in a force-directed network graph.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant · Mind-map radial (Buzan concentric)
// ─────────────────────────────────────────────────────────────────────────────
//
// Concentric layout: root at center, tier-2 on inner ring, leaves on outer ring,
// branches drawn as outward-bulging quadratic curves. Cross-links render as
// straight dashed lines so they read distinct from the curved tree branches.

const MM_VIEWBOX = { w: 720, h: 580 };
const MM_CENTER: Pos = { x: 360, y: 290 };
const MM_R_TIER2 = 140;
const MM_R_LEAF = 260;

// Parent angles around the wheel (clock-face: 0° = top, clockwise).
// Y-shape: control at top, trust+speed pushed below the root so they don't
// crowd it horizontally.
const MM_TIER2_ANGLE: Record<string, number> = {
  control: 0, // 12 o'clock
  trust: 240, // 8 o'clock (lower-left)
  speed: 120, // 4 o'clock (lower-right)
};

// Each leaf gets its parent's angle plus a per-leaf offset (±32° fan).
const MM_LEAF_OFFSET: Record<string, number> = {
  'trust-partner': -32,
  'trust-valid': 0,
  'trust-pred': 32,
  'ctl-iter': -32,
  'ctl-scope': 0,
  'ctl-qa': 32,
  'spd-cycle': -32,
  'spd-async': 0,
  'spd-checks': 32,
};

function polarToPos(angleDeg: number, r: number): Pos {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: MM_CENTER.x + r * Math.sin(rad), y: MM_CENTER.y - r * Math.cos(rad) };
}

const MM_POSITIONS: Record<string, Pos> = (() => {
  const map: Record<string, Pos> = { root: MM_CENTER };
  for (const [id, angle] of Object.entries(MM_TIER2_ANGLE)) {
    map[id] = polarToPos(angle, MM_R_TIER2);
  }
  // Leaves — parent angle inferred from id prefix
  const leafParent: Record<string, string> = {
    'trust-pred': 'trust',
    'trust-valid': 'trust',
    'trust-partner': 'trust',
    'ctl-iter': 'control',
    'ctl-scope': 'control',
    'ctl-qa': 'control',
    'spd-cycle': 'speed',
    'spd-async': 'speed',
    'spd-checks': 'speed',
  };
  for (const [leafId, parentId] of Object.entries(leafParent)) {
    const parentAngle = MM_TIER2_ANGLE[parentId]!;
    const offset = MM_LEAF_OFFSET[leafId] ?? 0;
    map[leafId] = polarToPos(parentAngle + offset, MM_R_LEAF);
  }
  return map;
})();

function CurvedEdge({
  from,
  to,
  label,
  showLabel,
}: {
  from: Pos;
  to: Pos;
  label: string;
  showLabel: boolean;
}) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  // Perpendicular unit vector
  const nx = -dy / len;
  const ny = dx / len;
  // Push the control point away from the diagram center so the curve bulges outward.
  const towardCenterX = MM_CENTER.x - mx;
  const towardCenterY = MM_CENTER.y - my;
  const dot = nx * towardCenterX + ny * towardCenterY;
  const sign = dot > 0 ? -1 : 1;
  const offset = 16;
  const ctrlX = mx + nx * offset * sign;
  const ctrlY = my + ny * offset * sign;
  return (
    <>
      <path
        d={`M ${from.x} ${from.y} Q ${ctrlX} ${ctrlY} ${to.x} ${to.y}`}
        fill="none"
        stroke="var(--dir-text-primary)"
        strokeWidth={1}
      />
      {showLabel && <EdgeLabel x={ctrlX} y={ctrlY + 3} label={label} />}
    </>
  );
}

function VariantMindMapRadial({ state }: { state: B4State }) {
  const { nodes, links } = filterByNodeCount(state);
  const treeLinks = links.filter((l) => !l.isCrossLink);
  // Cross-links surface as a textual section (matches native treatment).
  // Visual cross-link strokes inside a radial diagram fight the wheel reading.
  const crossLinks = links.filter((l) => l.isCrossLink);
  const data = ION_CONCEPT_MAP;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'flex-start', width: '100%' }}>
      <p
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--dir-detail)',
          margin: 0,
        }}
      >
        Concept map · Mind-map radial · Buzan register
      </p>

      <svg
        viewBox={`0 0 ${MM_VIEWBOX.w} ${MM_VIEWBOX.h}`}
        width="100%"
        style={{ display: 'block', maxWidth: 720 }}
        role="img"
        aria-label="Concept map mind-map radial variant"
      >
        {/* Root → tier-2 edges are radial spokes from the center — render
            straight, since a perpendicular bulge through the center is degenerate. */}
        {treeLinks
          .filter((l) => l.from === 'root')
          .map((link, i) => {
            const from = MM_POSITIONS[link.from];
            const to = MM_POSITIONS[link.to];
            if (!from || !to) return null;
            return (
              <StraightEdge
                key={`spoke-${i}`}
                from={from}
                to={to}
                label={link.label}
                showLabel={state.connectionLabels === 'on'}
                dashed={false}
                labelT={0.55}
              />
            );
          })}
        {/* Curved tree branches — Buzan signature, only on tier-2 → leaf */}
        {treeLinks
          .filter((l) => l.from !== 'root')
          .map((link, i) => {
            const from = MM_POSITIONS[link.from];
            const to = MM_POSITIONS[link.to];
            if (!from || !to) return null;
            return (
              <CurvedEdge
                key={`branch-${i}`}
                from={from}
                to={to}
                label={link.label}
                showLabel={state.connectionLabels === 'on'}
              />
            );
          })}
        {/* Nodes on top */}
        {nodes.map((node) => {
          const pos = MM_POSITIONS[node.id];
          if (!pos) return null;
          return (
            <VariantNodeMark
              key={node.id}
              pos={pos}
              node={node}
              shape={state.nodeShape}
              highlightFocal={state.highlightFocal === 'on'}
            />
          );
        })}
      </svg>

      {crossLinks.length > 0 && (
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingTop: 16,
            borderTop: '1px dashed var(--dir-detail)',
          }}
        >
          <p
            style={{
              fontFamily: IS,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--dir-detail)',
              margin: 0,
            }}
          >
            Cross-links · Novak signature
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {crossLinks.map((link, i) => {
              const fromNode = data.nodes.find((n) => n.id === link.from);
              const toNode = data.nodes.find((n) => n.id === link.to);
              if (!fromNode || !toNode) return null;
              return (
                <li key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: IS, fontSize: 11, fontWeight: 500, color: 'var(--dir-text-primary)' }}>
                    {fromNode.label}
                  </span>
                  <span
                    style={{
                      fontFamily: IS,
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--dir-detail)',
                    }}
                  >
                    {link.label}
                  </span>
                  <span style={{ fontFamily: IS, fontSize: 11, fontWeight: 500, color: 'var(--dir-text-primary)' }}>
                    {toNode.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p
        style={{
          fontFamily: IS,
          fontSize: 11,
          fontWeight: 300,
          lineHeight: 1.6,
          color: 'var(--dir-text-secondary)',
          margin: 0,
          maxWidth: 680,
        }}
      >
        Buzan-style radial register — root at center, tier-2 themes radiate, leaves fan outward on curved branches. Cross-links surface separately so the wheel reading stays clean.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export function B4ConceptMap() {
  const { b4 } = useGateAIonArtifactPlayground();
  if (b4.variant === 'hierarchical-top-down') return <NativeHierarchical state={b4} />;
  if (b4.variant === 'node-link-classic') return <VariantNodeLinkClassic state={b4} />;
  return <VariantMindMapRadial state={b4} />;
}
