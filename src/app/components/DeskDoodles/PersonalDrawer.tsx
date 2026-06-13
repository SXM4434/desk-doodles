// PersonalDrawer — the per-person drawer panel (personal-space MVP).
//
// "Each person's own saved doodles, separate from the public desk" + a switcher
// for their private desks. Designed as the CONTENT of a left CollapsiblePanel —
// the host (DeskPage) owns the CollapsiblePanel shell + the chrome PanelToggle
// (toggles always in chrome, per feedback_toggles_always_in_chrome). This file
// is just the inner panel so the DeskPage integration is one mount + one toggle.
//
// Two sections:
//   • MY DESKS  — the visitor's private desks (+ "New desk"); clicking one views
//                 it (the host navigates / loads it).
//   • MY DRAWER — saved doodles not on any desk; each shows as an ObjectCard
//                 mini with a "Place here" action that drops it onto the current
//                 desk (placeFromDrawer).
//
// FLAGGED: mounted by DeskPage only when isPersonalSpaceEnabled(). All data
// calls degrade gracefully (empty) on a pre-migration DB, so even if mounted
// early it renders an honest empty state instead of crashing.

import { useCallback, useEffect, useState } from 'react';
import { IS, ISe } from '../../lib/typography';
import { PILL, CTA, SECTION_LABEL } from '../../lib/chromeStyles';
import { sanitizeSvgMarkup } from '../../lib/svgUpload';
import type { DeskRow, DoodleRow } from '../../lib/publish';
import {
  listMyDesks,
  listMyDrawer,
  createPrivateDesk,
  placeFromDrawer,
  getEffectiveHandle,
} from '../../lib/personalSpace';
import { displayHandle } from '../../lib/handle';
import { ObjectCard } from './ObjectCard';

export interface PersonalDrawerProps {
  /** The desk currently in view — "Place here" drops a drawer item onto it. */
  currentDeskId: string | null;
  /** View one of my private desks (host loads/navigates). */
  onViewDesk: (desk: DeskRow) => void;
  /** A drawer item was placed onto the current desk — host can refresh the desk. */
  onPlaced?: (doodle: DoodleRow) => void;
  /** Open the onboarding / handle editor (the handle chip is the entry point). */
  onEditHandle?: () => void;
}

export function PersonalDrawer({
  currentDeskId,
  onViewDesk,
  onPlaced,
  onEditHandle,
}: PersonalDrawerProps) {
  const [handle, setHandle] = useState<string>('');
  const [desks, setDesks] = useState<DeskRow[]>([]);
  const [drawer, setDrawer] = useState<DoodleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [placingId, setPlacingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [h, d, dr] = await Promise.all([
      getEffectiveHandle().catch(() => ''),
      listMyDesks().catch(() => [] as DeskRow[]),
      listMyDrawer().catch(() => [] as DoodleRow[]),
    ]);
    setHandle(h);
    setDesks(d);
    setDrawer(dr);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const newDesk = useCallback(async () => {
    const desk = await createPrivateDesk('My Desk').catch(() => null);
    if (desk) {
      setDesks((prev) => [desk, ...prev]);
      onViewDesk(desk);
    }
  }, [onViewDesk]);

  const place = useCallback(
    async (item: DoodleRow) => {
      if (!currentDeskId) return;
      setPlacingId(item.id);
      // Slight scatter so placed items don't stack exactly.
      const x = 240 + Math.round((Math.random() - 0.5) * 160);
      const y = 200 + Math.round((Math.random() - 0.5) * 120);
      const ok = await placeFromDrawer(item.id, currentDeskId, x, y, 0).catch(() => false);
      setPlacingId(null);
      if (ok) {
        setDrawer((prev) => prev.filter((d) => d.id !== item.id));
        onPlaced?.({ ...item, desk_id: currentDeskId, x, y });
      }
    },
    [currentDeskId, onPlaced],
  );

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        fontFamily: IS,
        background: 'var(--dir-bg)',
        borderRight: '1px solid var(--dir-border)',
      }}
    >
      {/* Identity chip — your handle; click to edit (re-open onboarding). */}
      <button
        onClick={onEditHandle}
        title="Edit your handle"
        style={{
          ...PILL,
          alignSelf: 'flex-start',
          textTransform: 'none',
          letterSpacing: '-0.005em',
          fontSize: 13,
        }}
      >
        {handle ? displayHandle(handle) : 'Your space'}
      </button>

      {/* ── MY DESKS ─────────────────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={SECTION_LABEL}>My desks</h3>
          <button onClick={newDesk} style={{ ...PILL, padding: '4px 10px', fontSize: 10 }}>
            + New
          </button>
        </div>
        {!loading && desks.length === 0 && (
          <p style={{ ...SECTION_LABEL, textTransform: 'none', color: 'var(--dir-text-body-soft)' }}>
            No private desks yet — make one to keep work just for you.
          </p>
        )}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {desks.map((d) => (
            <li key={d.id}>
              <button
                onClick={() => onViewDesk(d)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'var(--dir-raised)',
                  border: '1px solid var(--dir-border)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontFamily: ISe,
                  fontSize: 14,
                  color: 'var(--dir-text-primary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.name}
                </span>
                <span style={{ ...SECTION_LABEL, fontSize: 9, flexShrink: 0 }}>
                  {d.object_count}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* ── MY DRAWER ────────────────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={SECTION_LABEL}>My drawer</h3>
        {!loading && drawer.length === 0 && (
          <p style={{ ...SECTION_LABEL, textTransform: 'none', color: 'var(--dir-text-body-soft)' }}>
            Empty. Stash a doodle here to save it without putting it on a desk.
          </p>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}
        >
          {drawer.map((item) => (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ObjectCard
                svgMarkup={sanitizeSvgMarkup(item.svg)}
                name={item.name}
                owner="you"
                mini
              />
              <button
                onClick={() => place(item)}
                disabled={!currentDeskId || placingId === item.id}
                title={currentDeskId ? 'Place on the desk in view' : 'Open a desk to place it'}
                style={{
                  ...CTA,
                  padding: '5px 10px',
                  fontSize: 10,
                  opacity: !currentDeskId || placingId === item.id ? 0.5 : 1,
                }}
              >
                {placingId === item.id ? 'Placing…' : 'Place here'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
