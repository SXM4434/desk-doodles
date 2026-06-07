import React from 'react';
import { IS } from '../cards/tokens';
import { ION_2X2_MATRIX, type MatrixItem } from './data/ion-2x2-matrix';
import { useGateAIonArtifactPlayground, type B2State } from '../../state/GateAIonArtifactPlaygroundContext';

// B2 · 2x2 Matrix — native = Speed × Craft control register.
// Synthesized positions per playground research doc.
//
// SYSTEM ADHERENCE:
// - Typography: locked ladder — IS 10/500/0.12em uppercase (axis labels + eyebrow), IS
//   11/300 (item labels). No off-ladder.
// - Spacing: locked tokens — viewBox 480×480 (standard sizing), padding 48 (Section).
// - Color: W1 only — axes/items --dir-text-primary, focal item rect fill --dir-text-primary
//   on --dir-bg ground, gridlines --dir-border (faint default).

const VIEW = 480;
const PAD = 48;
const PLOT_W = VIEW - 2 * PAD;
const PLOT_H = VIEW - 2 * PAD;

function plotX(nx: number): number {
  return PAD + nx * PLOT_W;
}
function plotY(ny: number): number {
  // Flip y so high values are at the top (ny=1 → low y in SVG)
  return VIEW - PAD - ny * PLOT_H;
}

function ItemMarker({ item, sizeMode, focal }: { item: MatrixItem; sizeMode: B2State['itemSize']; focal: boolean }) {
  const x = plotX(item.x);
  const y = plotY(item.y);
  const r = sizeMode === 'weighted' && item.weight ? 4 * item.weight : 4;
  // Position labels offset based on quadrant — labels point AWAY from the item center
  // toward the nearest edge of the plot. Avoids overlap with axis lines.
  const labelOffsetX = item.x > 0.5 ? 8 : -8;
  const labelOffsetY = item.y > 0.5 ? -8 : 16;
  const anchor: 'start' | 'end' = item.x > 0.5 ? 'start' : 'end';
  return (
    <g>
      {focal ? (
        <rect
          x={x - r}
          y={y - r}
          width={r * 2}
          height={r * 2}
          fill="var(--dir-text-primary)"
        />
      ) : (
        <circle cx={x} cy={y} r={r} fill="var(--dir-text-primary)" />
      )}
      <text
        x={x + labelOffsetX}
        y={y + labelOffsetY}
        textAnchor={anchor}
        style={{
          fontFamily: IS,
          fontSize: 11,
          fontWeight: focal ? 500 : 300,
          fill: 'var(--dir-text-primary)',
        }}
      >
        {item.label}
      </text>
    </g>
  );
}

function NativeClassic2x2({ state }: { state: B2State }) {
  const data = ION_2X2_MATRIX;
  const items = data.items.slice(0, state.itemCount);
  const showGrid = state.gridLines !== 'off';
  const gridStroke = state.gridLines === 'mid' ? 'var(--dir-detail)' : 'var(--dir-border)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
        {data.defaultAxisX} × {data.defaultAxisY} positioning
      </p>
      <svg viewBox={`0 0 ${VIEW + 96} ${VIEW + 32}`} style={{ width: '100%', maxWidth: 680, height: 'auto', display: 'block' }} role="img" aria-label="2x2 matrix — Speed vs Craft control">
        <defs>
          <marker id="b2-axis-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--dir-text-primary)" />
          </marker>
        </defs>

        {/* Faint grid (4 quadrants delineated by midline cross) */}
        {showGrid && (
          <>
            <line x1={plotX(0.5)} y1={PAD} x2={plotX(0.5)} y2={VIEW - PAD} stroke={gridStroke} strokeWidth={1} strokeDasharray="4 4" />
            <line x1={PAD} y1={plotY(0.5)} x2={VIEW - PAD} y2={plotY(0.5)} stroke={gridStroke} strokeWidth={1} strokeDasharray="4 4" />
          </>
        )}

        {/* Quadrant labels (off by default — let positions speak) */}
        {state.quadrantLabels === 'on' && (
          <>
            <text x={plotX(0.25)} y={PAD + 16} textAnchor="middle" style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-detail)' }}>
              Slow · craft
            </text>
            <text x={plotX(0.75)} y={PAD + 16} textAnchor="middle" style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-detail)' }}>
              Fast · craft
            </text>
            <text x={plotX(0.25)} y={VIEW - PAD - 8} textAnchor="middle" style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-detail)' }}>
              Slow · vibe
            </text>
            <text x={plotX(0.75)} y={VIEW - PAD - 8} textAnchor="middle" style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-detail)' }}>
              Fast · vibe
            </text>
          </>
        )}

        {/* X axis (horizontal, bottom) */}
        <line x1={PAD} y1={VIEW - PAD} x2={VIEW - PAD + 24} y2={VIEW - PAD} stroke="var(--dir-text-primary)" strokeWidth={1} markerEnd="url(#b2-axis-arrow)" />
        <text x={VIEW - PAD + 32} y={VIEW - PAD + 4} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-primary)' }}>
          {data.defaultAxisX}
        </text>

        {/* Y axis (vertical, left). Label anchored start at x=PAD so it doesn't clip
            past the left edge of the viewBox. */}
        <line x1={PAD} y1={VIEW - PAD} x2={PAD} y2={PAD - 24} stroke="var(--dir-text-primary)" strokeWidth={1} markerEnd="url(#b2-axis-arrow)" />
        <text x={PAD - 8} y={PAD - 32} textAnchor="start" style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-primary)' }}>
          {data.defaultAxisY}
        </text>

        {/* Trajectory overlay — opt-in via toggle on non-trajectory variants */}
        {state.trajectoryArrows === 'show' && <TrajectoryArrows items={items} markerId="b2-traj-arrow-classic" />}

        {/* Items */}
        {items.map((item, i) => (
          <ItemMarker key={i} item={item} sizeMode={state.itemSize} focal={item.isFocal === true} />
        ))}
      </svg>
      <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.6, color: 'var(--dir-text-secondary)', margin: 0, maxWidth: 680 }}>
        Ion sits in the upper-right interior — meaningful craft control AND meaningful speed, distinct from Figma (high craft, lower speed) and Vercel v0 (high speed, lower craft).
      </p>
      {data.synthesized && (
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
          synthesized · positions are illustrative, derived from Ion personas + competitive context
        </p>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: labeled-quadrant — each quadrant carries an archetype label (BCG-style)
// ───────────────────────────────────────────────────────────────────────────

const QUADRANT_ARCHETYPES = [
  // (col, row) → label. col 0/1 = left/right; row 0/1 = top/bottom (high/low Y)
  { x: 0.25, y: 0.75, name: 'Studio craft', detail: 'Slow + high craft' },
  { x: 0.75, y: 0.75, name: 'Premium product', detail: 'Fast + high craft' },
  { x: 0.25, y: 0.25, name: 'Generic', detail: 'Slow + low craft' },
  { x: 0.75, y: 0.25, name: 'Vibe code', detail: 'Fast + low craft' },
];

function VariantLabeledQuadrant({ state }: { state: B2State }) {
  const data = ION_2X2_MATRIX;
  const items = data.items.slice(0, state.itemCount);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
        {data.defaultAxisX} × {data.defaultAxisY} · BCG-style archetypes
      </p>
      <svg viewBox={`0 0 ${VIEW + 96} ${VIEW + 32}`} style={{ width: '100%', maxWidth: 680, height: 'auto', display: 'block' }} role="img" aria-label="2x2 matrix with quadrant archetypes">
        <defs>
          <marker id="b2-axis-arrow-2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--dir-text-primary)" />
          </marker>
        </defs>

        {/* Solid axis cross dividing the 4 quadrants */}
        <line x1={plotX(0.5)} y1={PAD} x2={plotX(0.5)} y2={VIEW - PAD} stroke="var(--dir-text-primary)" strokeWidth={1} />
        <line x1={PAD} y1={plotY(0.5)} x2={VIEW - PAD} y2={plotY(0.5)} stroke="var(--dir-text-primary)" strokeWidth={1} />

        {/* Archetype labels per quadrant (caps name + sentence detail) */}
        {QUADRANT_ARCHETYPES.map((arch, i) => (
          <g key={i}>
            <text x={plotX(arch.x)} y={plotY(arch.y) - 4} textAnchor="middle" style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-primary)' }}>
              {arch.name}
            </text>
            <text x={plotX(arch.x)} y={plotY(arch.y) + 12} textAnchor="middle" style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, fill: 'var(--dir-detail)' }}>
              {arch.detail}
            </text>
          </g>
        ))}

        {/* X axis */}
        <line x1={PAD} y1={VIEW - PAD} x2={VIEW - PAD + 24} y2={VIEW - PAD} stroke="var(--dir-text-primary)" strokeWidth={1} markerEnd="url(#b2-axis-arrow-2)" />
        <text x={VIEW - PAD + 32} y={VIEW - PAD + 4} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-primary)' }}>
          {data.defaultAxisX}
        </text>
        {/* Y axis */}
        <line x1={PAD} y1={VIEW - PAD} x2={PAD} y2={PAD - 24} stroke="var(--dir-text-primary)" strokeWidth={1} markerEnd="url(#b2-axis-arrow-2)" />
        <text x={PAD - 8} y={PAD - 32} textAnchor="start" style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-primary)' }}>
          {data.defaultAxisY}
        </text>

        {/* Trajectory overlay — opt-in via toggle on non-trajectory variants */}
        {state.trajectoryArrows === 'show' && <TrajectoryArrows items={items} markerId="b2-traj-arrow-labeled" />}

        {/* Items */}
        {items.map((item, i) => (
          <ItemMarker key={i} item={item} sizeMode={state.itemSize} focal={item.isFocal === true} />
        ))}
      </svg>
      {data.synthesized && (
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
          synthesized · archetype labels are illustrative
        </p>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: heat-density — quadrants tinted by item count (W1 step tokens)
// ───────────────────────────────────────────────────────────────────────────

function VariantHeatDensity({ state }: { state: B2State }) {
  const data = ION_2X2_MATRIX;
  const items = data.items.slice(0, state.itemCount);
  // Count items per quadrant (col 0/1 × row 0/1 — col 1 = high X, row 1 = high Y)
  const counts: Record<string, number> = { '0-0': 0, '1-0': 0, '0-1': 0, '1-1': 0 };
  items.forEach((it) => {
    const col = it.x >= 0.5 ? 1 : 0;
    const row = it.y >= 0.5 ? 1 : 0;
    counts[`${col}-${row}`] = (counts[`${col}-${row}`] ?? 0) + 1;
  });
  const max = Math.max(1, ...Object.values(counts));
  const bgFor = (count: number): string => {
    const ratio = count / max;
    if (ratio === 0) return 'var(--dir-bg)';
    if (ratio <= 0.34) return 'var(--dir-raised)';
    if (ratio <= 0.67) return 'var(--dir-recessed)';
    return 'var(--dir-muted)';
  };
  // Quadrant rectangles: cover plot area in 4 cells
  const halfW = (VIEW - 2 * PAD) / 2;
  const halfH = (VIEW - 2 * PAD) / 2;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
        {data.defaultAxisX} × {data.defaultAxisY} · heat-density (W1 steps)
      </p>
      <svg viewBox={`0 0 ${VIEW + 96} ${VIEW + 32}`} style={{ width: '100%', maxWidth: 680, height: 'auto', display: 'block' }} role="img" aria-label="2x2 heat-density matrix">
        <defs>
          <marker id="b2-axis-arrow-h" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--dir-text-primary)" />
          </marker>
        </defs>

        {/* 4 quadrant tints */}
        <rect x={PAD} y={PAD} width={halfW} height={halfH} fill={bgFor(counts['0-1'] ?? 0)} />
        <rect x={PAD + halfW} y={PAD} width={halfW} height={halfH} fill={bgFor(counts['1-1'] ?? 0)} />
        <rect x={PAD} y={PAD + halfH} width={halfW} height={halfH} fill={bgFor(counts['0-0'] ?? 0)} />
        <rect x={PAD + halfW} y={PAD + halfH} width={halfW} height={halfH} fill={bgFor(counts['1-0'] ?? 0)} />

        {/* Plot border */}
        <rect x={PAD} y={PAD} width={2 * halfW} height={2 * halfH} fill="none" stroke="var(--dir-text-primary)" strokeWidth={1} />
        {/* Midline cross */}
        <line x1={plotX(0.5)} y1={PAD} x2={plotX(0.5)} y2={VIEW - PAD} stroke="var(--dir-text-primary)" strokeWidth={1} strokeDasharray="4 4" />
        <line x1={PAD} y1={plotY(0.5)} x2={VIEW - PAD} y2={plotY(0.5)} stroke="var(--dir-text-primary)" strokeWidth={1} strokeDasharray="4 4" />

        {/* Quadrant count labels */}
        {(['0-1', '1-1', '0-0', '1-0'] as const).map((key, i) => {
          const [col, row] = key.split('-').map(Number);
          const cx = PAD + (col === 0 ? halfW / 2 : halfW + halfW / 2);
          const cy = PAD + (row === 1 ? halfH / 2 : halfH + halfH / 2);
          return (
            <text key={i} x={cx} y={cy + 4} textAnchor="middle" style={{ fontFamily: IS, fontSize: 18, fontWeight: 600, fill: 'var(--dir-text-primary)' }}>
              {counts[key] ?? 0}
            </text>
          );
        })}

        {/* X axis */}
        <line x1={PAD} y1={VIEW - PAD} x2={VIEW - PAD + 24} y2={VIEW - PAD} stroke="var(--dir-text-primary)" strokeWidth={1} markerEnd="url(#b2-axis-arrow-h)" />
        <text x={VIEW - PAD + 32} y={VIEW - PAD + 4} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-primary)' }}>
          {data.defaultAxisX}
        </text>
        {/* Y axis */}
        <line x1={PAD} y1={VIEW - PAD} x2={PAD} y2={PAD - 24} stroke="var(--dir-text-primary)" strokeWidth={1} markerEnd="url(#b2-axis-arrow-h)" />
        <text x={PAD - 8} y={PAD - 32} textAnchor="start" style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-primary)' }}>
          {data.defaultAxisY}
        </text>

        {/* Trajectory overlay — opt-in via toggle on non-trajectory variants */}
        {state.trajectoryArrows === 'show' && <TrajectoryArrows items={items} markerId="b2-traj-arrow-heat" />}

        {/* Items */}
        {items.map((item, i) => (
          <ItemMarker key={i} item={item} sizeMode={state.itemSize} focal={item.isFocal === true} />
        ))}
      </svg>
      <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.6, color: 'var(--dir-text-secondary)', margin: 0, maxWidth: 680 }}>
        Quadrant background tints by item-count quartile using W1 step tokens (--dir-bg → raised → recessed → muted). Big numerals show the count per quadrant.
      </p>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: trajectory — strategic-movement arrows
// ───────────────────────────────────────────────────────────────────────────

// Each item has a target position showing where it's moving. Synthesized for Ion as a
// move from "current" (lower-right interior) to "target" (upper-right craft+speed corner).
const TRAJECTORIES: Record<string, { tx: number; ty: number }> = {
  Ion: { tx: 0.78, ty: 0.78 }, // moving toward upper-right (high speed + high craft)
  'Vercel v0': { tx: 0.92, ty: 0.55 }, // pushing harder on speed
  Figma: { tx: 0.5, ty: 0.85 }, // expanding speed slightly
  // Personas don't move — they're target users, not products. Omit trajectories.
};

// Trajectory marker + lines that can overlay any 2x2 variant. The trajectoryArrows
// toggle ('off'|'show') triggers this; the trajectory variant always renders them.
function TrajectoryArrows({ items, markerId }: { items: MatrixItem[]; markerId: string }) {
  return (
    <>
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--dir-detail)" />
        </marker>
      </defs>
      {items.map((item, i) => {
        const traj = TRAJECTORIES[item.label];
        if (!traj) return null;
        return (
          <line
            key={`traj-${i}`}
            x1={plotX(item.x)}
            y1={plotY(item.y)}
            x2={plotX(traj.tx)}
            y2={plotY(traj.ty)}
            stroke="var(--dir-detail)"
            strokeWidth={1}
            strokeDasharray="4 4"
            markerEnd={`url(#${markerId})`}
          />
        );
      })}
    </>
  );
}

function VariantTrajectory({ state }: { state: B2State }) {
  const data = ION_2X2_MATRIX;
  const items = data.items.slice(0, state.itemCount);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
        {data.defaultAxisX} × {data.defaultAxisY} · trajectory
      </p>
      <svg viewBox={`0 0 ${VIEW + 96} ${VIEW + 32}`} style={{ width: '100%', maxWidth: 680, height: 'auto', display: 'block' }} role="img" aria-label="2x2 matrix with trajectory arrows">
        <defs>
          <marker id="b2-axis-arrow-t" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--dir-text-primary)" />
          </marker>
          <marker id="b2-traj-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--dir-detail)" />
          </marker>
        </defs>

        {/* Faint midline */}
        <line x1={plotX(0.5)} y1={PAD} x2={plotX(0.5)} y2={VIEW - PAD} stroke="var(--dir-border)" strokeWidth={1} strokeDasharray="4 4" />
        <line x1={PAD} y1={plotY(0.5)} x2={VIEW - PAD} y2={plotY(0.5)} stroke="var(--dir-border)" strokeWidth={1} strokeDasharray="4 4" />

        {/* Trajectory arrows BEFORE items so dots render on top */}
        {items.map((item, i) => {
          const traj = TRAJECTORIES[item.label];
          if (!traj) return null;
          const x1 = plotX(item.x);
          const y1 = plotY(item.y);
          const x2 = plotX(traj.tx);
          const y2 = plotY(traj.ty);
          return (
            <line
              key={`traj-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--dir-detail)"
              strokeWidth={1}
              strokeDasharray="4 4"
              markerEnd="url(#b2-traj-arrow)"
            />
          );
        })}

        {/* X axis */}
        <line x1={PAD} y1={VIEW - PAD} x2={VIEW - PAD + 24} y2={VIEW - PAD} stroke="var(--dir-text-primary)" strokeWidth={1} markerEnd="url(#b2-axis-arrow-t)" />
        <text x={VIEW - PAD + 32} y={VIEW - PAD + 4} style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-primary)' }}>
          {data.defaultAxisX}
        </text>
        {/* Y axis */}
        <line x1={PAD} y1={VIEW - PAD} x2={PAD} y2={PAD - 24} stroke="var(--dir-text-primary)" strokeWidth={1} markerEnd="url(#b2-axis-arrow-t)" />
        <text x={PAD - 8} y={PAD - 32} textAnchor="start" style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', fill: 'var(--dir-text-primary)' }}>
          {data.defaultAxisY}
        </text>

        {/* Items */}
        {items.map((item, i) => (
          <ItemMarker key={i} item={item} sizeMode={state.itemSize} focal={item.isFocal === true} />
        ))}
      </svg>
      <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.6, color: 'var(--dir-text-secondary)', margin: 0, maxWidth: 680 }}>
        Dashed trajectory arrows show where competing products are moving. Ion's vector points toward the upper-right corner — claiming both high speed AND high craft control. Personas have no trajectory (target users, not products).
      </p>
      <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
        synthesized · trajectory directions are illustrative
      </p>
    </div>
  );
}

export function B22x2Matrix() {
  const { b2 } = useGateAIonArtifactPlayground();
  if (b2.variant === 'classic-2x2') return <NativeClassic2x2 state={b2} />;
  if (b2.variant === 'labeled-quadrant') return <VariantLabeledQuadrant state={b2} />;
  if (b2.variant === 'heat-density') return <VariantHeatDensity state={b2} />;
  return <VariantTrajectory state={b2} />;
}
