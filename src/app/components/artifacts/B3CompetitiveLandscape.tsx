import React from 'react';
import { IS } from '../cards/tokens';
import { ION_COMPETITIVE_LANDSCAPE, type LandscapeCluster } from './data/ion-competitive-landscape';
import { useGateAIonArtifactPlayground, type B3State } from '../../state/GateAIonArtifactPlaygroundContext';

// B3 · Competitive Landscape — native = cluster constellation (a16z register).
// Synthesized landscape with 3 categorized clusters + Ion as focal product.

const ITEMS_PER_CLUSTER_LIMIT = (count: 5 | 7 | 9): number => {
  // 9 = 3 per cluster, 7 ≈ 2-3, 5 ≈ 2 per cluster (approximate distribution)
  return Math.ceil(count / 3);
};

function ClusterColumn({ cluster, itemsLimit, annotationStyle }: {
  cluster: LandscapeCluster;
  itemsLimit: number;
  annotationStyle: B3State['annotationStyle'];
}) {
  const items = cluster.items.slice(0, itemsLimit);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)', margin: 0, paddingBottom: 8, borderBottom: '1px solid var(--dir-border)' }}>
        {cluster.name}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => {
          if (annotationStyle === 'dot') {
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span aria-hidden style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 3, backgroundColor: 'var(--dir-text-primary)', flexShrink: 0 }} />
                <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 300, color: 'var(--dir-text-primary)', margin: 0 }}>
                  {item.name}
                </p>
              </div>
            );
          }
          if (annotationStyle === 'icon') {
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span aria-hidden style={{ fontFamily: IS, fontSize: 11, fontWeight: 500, color: 'var(--dir-detail)' }}>▸</span>
                <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 300, color: 'var(--dir-text-primary)', margin: 0 }}>
                  {item.name}
                </p>
              </div>
            );
          }
          // labeled-card (native)
          return (
            <div
              key={i}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--dir-border)',
                backgroundColor: 'var(--dir-raised)',
              }}
            >
              <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 300, color: 'var(--dir-text-primary)', margin: 0 }}>
                {item.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NativeClusterConstellation({ state }: { state: B3State }) {
  const data = ION_COMPETITIVE_LANDSCAPE;
  const itemsPerCluster = ITEMS_PER_CLUSTER_LIMIT(state.competitorCount);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Focal Ion card prominently placed at top */}
      {state.focalHighlight === 'on' && (
        <div
          style={{
            padding: 16,
            backgroundColor: 'var(--dir-text-primary)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxWidth: 480,
            alignSelf: 'flex-start',
          }}
        >
          <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-bg)', margin: 0 }}>
            Focal · Ion
          </p>
          <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 300, lineHeight: 1.6, color: 'var(--dir-bg)', margin: 0 }}>
            {data.focalThesis}
          </p>
        </div>
      )}

      {/* Cluster columns */}
      {state.clusterGrouping === 'on' ? (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.clusters.length}, minmax(0, 1fr))`, gap: 24 }}>
          {data.clusters.map((cluster, i) => (
            <ClusterColumn key={i} cluster={cluster} itemsLimit={itemsPerCluster} annotationStyle={state.annotationStyle} />
          ))}
        </div>
      ) : (
        // Cluster grouping off — flat list of all items
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 24 }}>
          {data.clusters.flatMap((c) => c.items.slice(0, itemsPerCluster)).map((item, i) => (
            <div key={i} style={{ padding: '8px 12px', border: '1px solid var(--dir-border)', backgroundColor: 'var(--dir-raised)' }}>
              <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 300, color: 'var(--dir-text-primary)', margin: 0 }}>
                {item.name}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Legend (full = list categories with item counts; minimal = just an eyebrow note) */}
      {state.legendDensity === 'full' && (
        <div style={{ paddingTop: 12, borderTop: '1px solid var(--dir-border)', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {data.clusters.map((c, i) => (
            <p key={i} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
              {c.name} · {c.items.length}
            </p>
          ))}
        </div>
      )}

      {data.synthesized && (
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
          synthesized · cluster categories from Leyi/CoCreate Venn context, items illustrative
        </p>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: quadrant-style — 2x2 with category dimensions per quadrant
// ───────────────────────────────────────────────────────────────────────────

// Synthesized positions per item along Designer-first ↔ Engineer-first × Established ↔ Emerging
const QUADRANT_POSITIONS: Record<string, { x: number; y: number }> = {
  Figma: { x: 0.18, y: 0.85 },
  Sketch: { x: 0.22, y: 0.78 },
  Storybook: { x: 0.78, y: 0.78 },
  'Bolt.new': { x: 0.45, y: 0.25 },
  Lovable: { x: 0.4, y: 0.32 },
  'Vercel v0': { x: 0.78, y: 0.28 },
  ChatGPT: { x: 0.85, y: 0.65 },
  Claude: { x: 0.82, y: 0.58 },
  Cursor: { x: 0.78, y: 0.45 },
  Ion: { x: 0.5, y: 0.55 },
};

function VariantQuadrantStyle({ state }: { state: B3State }) {
  const data = ION_COMPETITIVE_LANDSCAPE;
  const allItems = [...data.clusters.flatMap((c) => c.items), data.focalItem];
  const VIEW_W = 720;
  const VIEW_H = 480;
  const PAD = 64;
  const W = VIEW_W - 2 * PAD;
  const H = VIEW_H - 2 * PAD;
  const px = (nx: number) => PAD + nx * W;
  const py = (ny: number) => VIEW_H - PAD - ny * H;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
        Competitive landscape · quadrant register
      </p>
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H + 32}`} style={{ width: '100%', maxWidth: 720, height: 'auto', display: 'block' }} role="img" aria-label="Competitive landscape quadrant register">
        {/* Quadrant cross */}
        <line x1={px(0.5)} y1={PAD} x2={px(0.5)} y2={VIEW_H - PAD} stroke="var(--dir-text-primary)" strokeWidth={1} />
        <line x1={PAD} y1={py(0.5)} x2={VIEW_W - PAD} y2={py(0.5)} stroke="var(--dir-text-primary)" strokeWidth={1} />
        {/* Quadrant archetype labels */}
        <text x={px(0.25)} y={py(0.95)} textAnchor="middle" style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-primary)' }}>
          Established · designer-first
        </text>
        <text x={px(0.75)} y={py(0.95)} textAnchor="middle" style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-primary)' }}>
          Established · engineer-first
        </text>
        <text x={px(0.25)} y={py(0.05)} textAnchor="middle" style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-primary)' }}>
          Emerging · designer-first
        </text>
        <text x={px(0.75)} y={py(0.05)} textAnchor="middle" style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-primary)' }}>
          Emerging · engineer-first
        </text>
        {/* Plot all items */}
        {allItems.map((item, i) => {
          const pos = QUADRANT_POSITIONS[item.name];
          if (!pos) return null;
          const x = px(pos.x);
          const y = py(pos.y);
          const isFocal = item.isFocal === true;
          const labelOffsetX = pos.x > 0.5 ? 8 : -8;
          const labelOffsetY = pos.y > 0.5 ? -8 : 16;
          const anchor: 'start' | 'end' = pos.x > 0.5 ? 'start' : 'end';
          return (
            <g key={i}>
              {isFocal ? (
                <rect x={x - 6} y={y - 6} width={12} height={12} fill="var(--dir-text-primary)" />
              ) : (
                <circle cx={x} cy={y} r={4} fill="var(--dir-text-primary)" />
              )}
              <text x={x + labelOffsetX} y={y + labelOffsetY} textAnchor={anchor} style={{ fontFamily: IS, fontSize: 11, fontWeight: isFocal ? 500 : 300, fill: 'var(--dir-text-primary)' }}>
                {item.name}
              </text>
            </g>
          );
        })}
      </svg>
      {data.synthesized && (
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
          synthesized · positions illustrative
        </p>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: bullseye — focal at center, alternatives at varying competitive distance
// ───────────────────────────────────────────────────────────────────────────

// Each item lives on a "ring" 1-3, where 1 = closest competitive threat to Ion.
const BULLSEYE_ITEMS: { name: string; ring: 1 | 2 | 3; angle: number }[] = [
  // Ring 1 (closest competitors — direct vibe-code overlap)
  { name: 'Vercel v0', ring: 1, angle: 30 },
  { name: 'Bolt.new', ring: 1, angle: 150 },
  { name: 'Lovable', ring: 1, angle: 270 },
  // Ring 2 (related — design or AI tools that overlap with parts of Ion)
  { name: 'Cursor', ring: 2, angle: 0 },
  { name: 'Figma', ring: 2, angle: 90 },
  { name: 'Claude', ring: 2, angle: 180 },
  { name: 'Storybook', ring: 2, angle: 235 },
  { name: 'Sketch', ring: 2, angle: 315 },
  // Ring 3 (distant — general-purpose tools)
  { name: 'ChatGPT', ring: 3, angle: 60 },
];

function VariantBullseye({ state }: { state: B3State }) {
  const data = ION_COMPETITIVE_LANDSCAPE;
  const VIEW = 480;
  const CX = VIEW / 2;
  const CY = VIEW / 2;
  const R1 = 80;
  const R2 = 144;
  const R3 = 208;
  const radiusFor = (ring: 1 | 2 | 3) => (ring === 1 ? R1 : ring === 2 ? R2 : R3);
  const polar = (angleDeg: number, r: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
        Competitive landscape · bullseye · ion at center
      </p>
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block' }} role="img" aria-label="Bullseye competitive landscape">
        {/* Concentric rings (faint) */}
        <circle cx={CX} cy={CY} r={R3} fill="none" stroke="var(--dir-border)" strokeWidth={1} strokeDasharray="4 4" />
        <circle cx={CX} cy={CY} r={R2} fill="none" stroke="var(--dir-border)" strokeWidth={1} strokeDasharray="4 4" />
        <circle cx={CX} cy={CY} r={R1} fill="none" stroke="var(--dir-border)" strokeWidth={1} strokeDasharray="4 4" />
        {/* Focal Ion at center */}
        <rect x={CX - 8} y={CY - 8} width={16} height={16} fill="var(--dir-text-primary)" />
        <text x={CX} y={CY + 32} textAnchor="middle" style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-primary)' }}>
          Ion
        </text>
        {/* Ring labels (right side) */}
        <text x={CX + R1} y={CY - 4} textAnchor="start" dx={8} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', fill: 'var(--dir-detail)' }}>
          Direct
        </text>
        <text x={CX + R2} y={CY - 4} textAnchor="start" dx={8} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', fill: 'var(--dir-detail)' }}>
          Related
        </text>
        <text x={CX + R3} y={CY - 4} textAnchor="start" dx={8} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', fill: 'var(--dir-detail)' }}>
          Distant
        </text>
        {/* Items at polar positions */}
        {BULLSEYE_ITEMS.map((item, i) => {
          const r = radiusFor(item.ring);
          const p = polar(item.angle, r);
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={4} fill="var(--dir-text-primary)" />
              <text
                x={p.x + (Math.cos((item.angle * Math.PI) / 180) > 0 ? 8 : -8)}
                y={p.y + (Math.sin((item.angle * Math.PI) / 180) > 0 ? 16 : -8)}
                textAnchor={Math.cos((item.angle * Math.PI) / 180) > 0 ? 'start' : 'end'}
                style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, fill: 'var(--dir-text-primary)' }}
              >
                {item.name}
              </text>
            </g>
          );
        })}
      </svg>
      <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.6, color: 'var(--dir-text-secondary)', margin: 0, maxWidth: 680 }}>
        Ion at the center. Closest ring = direct competitors (vibe-code tools). Middle ring = related (design + AI tools that overlap in part). Outer ring = distant (general-purpose tools).
      </p>
      {data.synthesized && (
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
          synthesized · ring assignments illustrative
        </p>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: logo-grid — row-per-category (CB Insights register)
// ───────────────────────────────────────────────────────────────────────────

function VariantLogoGrid({ state }: { state: B3State }) {
  const data = ION_COMPETITIVE_LANDSCAPE;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
        Competitive landscape · logo-grid · CB Insights register
      </p>
      {/* Focal Ion row */}
      {state.focalHighlight === 'on' && (
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 24, alignItems: 'center', padding: 16, backgroundColor: 'var(--dir-text-primary)' }}>
          <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-bg)', margin: 0 }}>
            Focal · Ion
          </p>
          <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 300, lineHeight: 1.6, color: 'var(--dir-bg)', margin: 0 }}>
            {data.focalThesis}
          </p>
        </div>
      )}
      {/* Category rows */}
      {data.clusters.map((cluster, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 24, alignItems: 'center', paddingTop: i === 0 ? 0 : 16, borderTop: i === 0 ? 'none' : '1px solid var(--dir-border)' }}>
          <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)', margin: 0 }}>
            {cluster.name}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {cluster.items.map((item, j) => (
              <div key={j} style={{ padding: '8px 12px', border: '1px solid var(--dir-border)', backgroundColor: 'var(--dir-raised)' }}>
                <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 300, color: 'var(--dir-text-primary)', margin: 0 }}>
                  {item.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: positioned-on-axes — items plotted on 2 dimensions, focal highlighted
// ───────────────────────────────────────────────────────────────────────────

// Speed × Craft control positions — same axes as B2 but with all 9 competitors + Ion plotted.
const AXES_POSITIONS: Record<string, { x: number; y: number }> = {
  Figma: { x: 0.4, y: 0.85 },
  Sketch: { x: 0.32, y: 0.78 },
  Storybook: { x: 0.55, y: 0.65 },
  'Bolt.new': { x: 0.82, y: 0.42 },
  Lovable: { x: 0.78, y: 0.45 },
  'Vercel v0': { x: 0.85, y: 0.45 },
  ChatGPT: { x: 0.7, y: 0.3 },
  Claude: { x: 0.72, y: 0.32 },
  Cursor: { x: 0.78, y: 0.5 },
  Ion: { x: 0.65, y: 0.65 },
};

function VariantPositionedOnAxes({ state }: { state: B3State }) {
  const data = ION_COMPETITIVE_LANDSCAPE;
  const allItems = [...data.clusters.flatMap((c) => c.items), data.focalItem];
  const VIEW_W = 720;
  const VIEW_H = 480;
  const PAD = 64;
  const W = VIEW_W - 2 * PAD;
  const H = VIEW_H - 2 * PAD;
  const px = (nx: number) => PAD + nx * W;
  const py = (ny: number) => VIEW_H - PAD - ny * H;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
        Competitive landscape · positioned on speed × craft control
      </p>
      <svg viewBox={`0 0 ${VIEW_W + 96} ${VIEW_H + 32}`} style={{ width: '100%', maxWidth: 720, height: 'auto', display: 'block' }} role="img" aria-label="Items positioned on Speed × Craft control axes">
        <defs>
          <marker id="b3-axis-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--dir-text-primary)" />
          </marker>
        </defs>
        {/* Faint midline grid */}
        <line x1={px(0.5)} y1={PAD} x2={px(0.5)} y2={VIEW_H - PAD} stroke="var(--dir-border)" strokeWidth={1} strokeDasharray="4 4" />
        <line x1={PAD} y1={py(0.5)} x2={VIEW_W - PAD} y2={py(0.5)} stroke="var(--dir-border)" strokeWidth={1} strokeDasharray="4 4" />
        {/* Axes */}
        <line x1={PAD} y1={VIEW_H - PAD} x2={VIEW_W - PAD + 24} y2={VIEW_H - PAD} stroke="var(--dir-text-primary)" strokeWidth={1} markerEnd="url(#b3-axis-arrow)" />
        <text x={VIEW_W - PAD + 32} y={VIEW_H - PAD + 4} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-primary)' }}>
          Speed
        </text>
        <line x1={PAD} y1={VIEW_H - PAD} x2={PAD} y2={PAD - 24} stroke="var(--dir-text-primary)" strokeWidth={1} markerEnd="url(#b3-axis-arrow)" />
        <text x={PAD - 8} y={PAD - 32} textAnchor="start" style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-primary)' }}>
          Craft control
        </text>
        {/* Items */}
        {allItems.map((item, i) => {
          const pos = AXES_POSITIONS[item.name];
          if (!pos) return null;
          const x = px(pos.x);
          const y = py(pos.y);
          const isFocal = item.isFocal === true;
          const labelOffsetX = pos.x > 0.5 ? 8 : -8;
          const labelOffsetY = pos.y > 0.5 ? -8 : 16;
          const anchor: 'start' | 'end' = pos.x > 0.5 ? 'start' : 'end';
          return (
            <g key={i}>
              {isFocal ? (
                <rect x={x - 6} y={y - 6} width={12} height={12} fill="var(--dir-text-primary)" />
              ) : (
                <circle cx={x} cy={y} r={4} fill="var(--dir-text-primary)" />
              )}
              <text x={x + labelOffsetX} y={y + labelOffsetY} textAnchor={anchor} style={{ fontFamily: IS, fontSize: 11, fontWeight: isFocal ? 500 : 300, fill: 'var(--dir-text-primary)' }}>
                {item.name}
              </text>
            </g>
          );
        })}
      </svg>
      {data.synthesized && (
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
          synthesized · positions illustrative
        </p>
      )}
    </div>
  );
}

export function B3CompetitiveLandscape() {
  const { b3 } = useGateAIonArtifactPlayground();
  if (b3.variant === 'cluster-constellation') return <NativeClusterConstellation state={b3} />;
  if (b3.variant === 'quadrant-style') return <VariantQuadrantStyle state={b3} />;
  if (b3.variant === 'bullseye') return <VariantBullseye state={b3} />;
  if (b3.variant === 'logo-grid') return <VariantLogoGrid state={b3} />;
  return <VariantPositionedOnAxes state={b3} />;
}
