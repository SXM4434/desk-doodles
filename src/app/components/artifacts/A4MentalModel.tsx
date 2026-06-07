import React from 'react';
import { IS } from '../cards/tokens';
import { ION_MENTAL_MODEL, type MentalModelTower } from './data/ion-mental-model';
import { useGateAIonArtifactPlayground, type A4State } from '../../state/GateAIonArtifactPlaygroundContext';

// A4 · Mental Model — native only at IC quality.
// Native = Indi Young towers register: behaviors stacked vertically as towers above an
// alignment line, product capabilities aligned beneath. Synthesized from Demo Day 3
// Insights + Leyi affinity-map themes + Demo Day capability set.
//
// SYSTEM ADHERENCE:
// - Typography: locked ladder — IS 10/500/0.12em uppercase (eyebrow + tower headers +
//   capability labels), IS 11/300 (atomic-task text), IS 13/300 (population label),
//   IS 18/600 not used here.
// - Spacing: locked tokens — gap 24/16/12/8, padding 16, alignment-line height 1.
// - Color: W1 only — towers --dir-text-primary text on transparent; alignment line
//   --dir-text-primary 1px; capabilities below in --dir-raised cards with --dir-border.

function TowerColumn({ tower, density, showAttr, isFirst, banded }: {
  tower: MentalModelTower;
  density: number;
  showAttr: boolean;
  isFirst: boolean;
  banded: boolean;
}) {
  const tasks = tower.atomicTasks.slice(0, density);
  return (
    <div
      style={{
        padding: banded ? '8px 16px' : '0 16px',
        backgroundColor: banded ? 'var(--dir-raised)' : 'transparent',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 0,
        borderLeft: isFirst ? 'none' : '1px solid var(--dir-border)',
      }}
    >
      <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)', margin: 0, paddingBottom: 8, borderBottom: '1px solid var(--dir-border)' }}>
        {tower.name}
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tasks.map((task, i) => (
          <li key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.45, color: 'var(--dir-text-primary)', margin: 0 }}>
              {task.text}
            </p>
            {showAttr && task.author && (
              <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
                {task.author}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NativeIndiYoungTowers({ state }: { state: A4State }) {
  const data = ION_MENTAL_MODEL;
  const towers = data.towers.slice(0, state.towerCount);
  const cols = `repeat(${towers.length}, minmax(0, 1fr))`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Towers row — atomic tasks stacked per behavior */}
      <div style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'start' }}>
        {towers.map((tower, i) => (
          <TowerColumn
            key={i}
            tower={tower}
            density={state.taskDensity}
            showAttr={state.sourceAttribution === 'show'}
            isFirst={i === 0}
            banded={state.colorBanding === 'by-class' && i % 2 === 1}
          />
        ))}
      </div>

      {/* Alignment line — Indi Young's signature horizontal divider */}
      {state.alignmentMarkers === 'on' && (
        <div style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, backgroundColor: 'var(--dir-text-primary)' }} />
          <span style={{ position: 'relative', backgroundColor: 'var(--dir-bg)', padding: '0 12px', fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', marginLeft: 16 }}>
            Alignment line · Ion product capabilities below
          </span>
        </div>
      )}

      {/* Capabilities row — each capability sits beneath the tower(s) it supports.
          For native, render as cards in their own row aligned to grid columns where possible.
          Each capability marks which tower indices it supports. */}
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 16 }}>
        {towers.map((_, towerIdx) => {
          const supporting = data.capabilities.filter((c) => c.supportsTowers.includes(towerIdx));
          return (
            <div key={towerIdx} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {supporting.map((cap, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--dir-border)',
                    backgroundColor: 'var(--dir-raised)',
                    fontFamily: IS,
                    fontSize: 11,
                    fontWeight: 300,
                    color: 'var(--dir-text-primary)',
                  }}
                >
                  {cap.name}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: concept-lattice — hierarchical tree of behaviors → sub-tasks
// ───────────────────────────────────────────────────────────────────────────

function VariantConceptLattice({ state }: { state: A4State }) {
  const data = ION_MENTAL_MODEL;
  const towers = data.towers.slice(0, state.towerCount);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Root node */}
      <div style={{ padding: '12px 16px', border: '1px solid var(--dir-text-primary)', backgroundColor: 'var(--dir-raised)', alignSelf: 'flex-start' }}>
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)', margin: 0 }}>
          {data.populationLabel}
        </p>
      </div>
      {/* Children — towers as branches */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingLeft: 24, borderLeft: '1px solid var(--dir-border)' }}>
        {towers.map((tower, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: state.colorBanding === 'by-class' && i % 2 === 1 ? 8 : 0,
              backgroundColor: state.colorBanding === 'by-class' && i % 2 === 1 ? 'var(--dir-raised)' : 'transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span aria-hidden style={{ width: 16, height: 1, backgroundColor: 'var(--dir-border)', flexShrink: 0 }} />
              <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 300, lineHeight: 1.45, color: 'var(--dir-text-primary)', margin: 0 }}>
                {tower.name}
              </p>
            </div>
            {/* Grandchildren — atomic tasks under each tower */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 24, borderLeft: '1px solid var(--dir-border)', marginLeft: 24 }}>
              {tower.atomicTasks.slice(0, state.taskDensity).map((task, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span aria-hidden style={{ width: 16, height: 1, backgroundColor: 'var(--dir-border)', flexShrink: 0, alignSelf: 'center' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.45, color: 'var(--dir-text-primary)', margin: 0 }}>
                      {task.text}
                    </p>
                    {state.sourceAttribution === 'show' && task.author && (
                      <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
                        {task.author}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Variant: behavior-feature-grid — tabular alignment matrix
// ───────────────────────────────────────────────────────────────────────────

function VariantBehaviorFeatureGrid({ state }: { state: A4State }) {
  const data = ION_MENTAL_MODEL;
  const towers = data.towers.slice(0, state.towerCount);
  const capabilities = data.capabilities;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: IS, fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid var(--dir-text-primary)', verticalAlign: 'bottom' }}>
              <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)' }}>
                Behavior tower
              </span>
            </th>
            {capabilities.map((cap, i) => (
              <th
                key={i}
                style={{
                  padding: 12,
                  textAlign: 'center',
                  borderBottom: '1px solid var(--dir-text-primary)',
                  borderLeft: '1px solid var(--dir-border)',
                  verticalAlign: 'bottom',
                  minWidth: 80,
                }}
              >
                <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-primary)', writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', display: 'inline-block' }}>
                  {cap.name}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {towers.map((tower, towerIdx) => {
            const banded = state.colorBanding === 'by-class' && towerIdx % 2 === 1;
            const cellBg = banded ? 'var(--dir-raised)' : 'transparent';
            return (
            <tr key={towerIdx}>
              <td style={{ padding: 12, borderBottom: '1px solid var(--dir-border)', backgroundColor: cellBg }}>
                <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 300, lineHeight: 1.45, color: 'var(--dir-text-primary)', margin: 0 }}>
                  {tower.name}
                </p>
              </td>
              {capabilities.map((cap, capIdx) => {
                const supports = cap.supportsTowers.includes(towerIdx);
                return (
                  <td
                    key={capIdx}
                    style={{
                      padding: 12,
                      textAlign: 'center',
                      borderBottom: '1px solid var(--dir-border)',
                      borderLeft: '1px solid var(--dir-border)',
                      backgroundColor: cellBg,
                    }}
                  >
                    {supports ? (
                      <span aria-label="supports" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, backgroundColor: 'var(--dir-text-primary)' }} />
                    ) : (
                      <span aria-label="not supported" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, backgroundColor: 'transparent', border: '1px solid var(--dir-border)' }} />
                    )}
                  </td>
                );
              })}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function VariantStub({ name, why }: { name: string; why: string }) {
  return (
    <div
      style={{
        padding: 32,
        border: '1px dashed var(--dir-border)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 300, color: 'var(--dir-text-primary)', margin: 0 }}>
        {name} variant — pending native approval
      </p>
      <p style={{ fontFamily: IS, fontSize: 11, fontWeight: 300, lineHeight: 1.4, color: 'var(--dir-text-secondary)', margin: 0, maxWidth: 480, alignSelf: 'center' }}>
        {why}
      </p>
    </div>
  );
}

export function A4MentalModel() {
  const { a4 } = useGateAIonArtifactPlayground();
  const data = ION_MENTAL_MODEL;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
        Mental model · Indi Young towers
      </p>
      <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 300, lineHeight: 1.6, color: 'var(--dir-text-secondary)', margin: 0, maxWidth: 680 }}>
        How {data.populationLabel.toLowerCase()} think about the work — towers represent recurring research themes; product capabilities sit beneath the alignment line, mapped to the towers they support.
      </p>

      {a4.variant === 'indi-young-towers' && <NativeIndiYoungTowers state={a4} />}
      {a4.variant === 'concept-lattice' && <VariantConceptLattice state={a4} />}
      {a4.variant === 'behavior-feature-grid' && <VariantBehaviorFeatureGrid state={a4} />}

      {data.synthesized && (
        <p style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-detail)', margin: 0 }}>
          synthesized · Indi Young towers structure interpreted from Demo Day 3 Insights + affinity themes + Demo Day capability set
        </p>
      )}
    </div>
  );
}
