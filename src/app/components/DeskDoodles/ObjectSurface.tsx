import { useEffect, useState, type CSSProperties } from 'react';
import { IS } from '../../lib/typography';
import { PILL, CTA, SECTION_LABEL } from '../../lib/chromeStyles';
import { ObjectCard } from './ObjectCard';

// ─── ObjectSurface — the one morphing object panel (modes, never nested) ──────
// Per docs/design/object-model-and-desk-architecture.md §"The one object
// surface": ONE component, mode driven by context. Create lives in DrawPanel;
// this is the INSPECT side — click your own object → Edit; click someone
// else's → Sandbox. DeskPage holds a single activeSurface slot so this and
// DrawPanel can never both be open (nesting is structurally impossible).
//
// This first cut is the inspect surface: the collectible ObjectCard + the
// mode-appropriate actions. Sandbox's live control-play (re-render through
// viewer config) + Edit's metadata-save layer on next (they need per-object
// control scope + a publish update fn) — the shell + state model land now.

export type ObjectSurfaceMode = 'edit' | 'sandbox';

export type ObjectSurfaceData = {
  svgMarkup: string;
  name?: string | null;
  why?: string | null;
  owner?: string | null;
  createdAt?: string | null;
};

export function ObjectSurface({
  mode,
  object,
  onClose,
  onDelete,
  onRemix,
}: {
  mode: ObjectSurfaceMode;
  object: ObjectSurfaceData;
  onClose: () => void;
  /** Edit mode only — delete this (your own) object. */
  onDelete?: () => void;
  /** Sandbox mode only — fork someone else's into a new owned object (stub). */
  onRemix?: () => void;
}) {
  const isSandbox = mode === 'sandbox';
  // Local editable copy of name/why for Edit mode (save layer is a follow-up;
  // for now the card is editable so the shape is right, persistence next).
  const [name, setName] = useState(object.name ?? '');
  const [why, setWhy] = useState(object.why ?? '');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const scrim: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 300,
    background: 'color-mix(in srgb, var(--dir-text-primary) 28%, transparent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  };

  const panel: CSSProperties = {
    background: 'var(--dir-raised)',
    border: '1px solid var(--dir-border)',
    // Sandbox gets a distinct dashed edge so it never reads as "your editable
    // object" (read-only-vs-ephemeral signposting).
    borderStyle: isSandbox ? 'dashed' : 'solid',
    borderRadius: 16,
    boxShadow:
      '0 12px 36px color-mix(in srgb, var(--dir-text-primary) 10%, transparent), 0 2px 8px color-mix(in srgb, var(--dir-text-primary) 6%, transparent)',
    padding: 20,
    width: 'min(360px, calc(100vw - 64px))',
    maxHeight: 'calc(100vh - 64px)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    fontFamily: IS,
  };

  return (
    <div onClick={onClose} style={scrim}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isSandbox ? 'Explore doodle' : 'Edit doodle'}
        onClick={(e) => e.stopPropagation()}
        style={panel}
      >
        {/* Sandbox banner — the why of the unsaved scope, persistent. */}
        {isSandbox && (
          <div
            style={{
              ...SECTION_LABEL,
              color: 'var(--dir-text-body-soft)',
              textTransform: 'none',
              letterSpacing: 0,
              fontSize: 11,
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            Sandbox — play with someone else’s doodle. Nothing here saves.
          </div>
        )}

        {/* embedded — the modal panel IS the card; no card-inside-a-card. */}
        <ObjectCard
          svgMarkup={object.svgMarkup}
          name={isSandbox ? object.name : name}
          why={isSandbox ? object.why : why}
          owner={object.owner}
          createdAt={object.createdAt}
          embedded
          editable={!isSandbox}
          onNameChange={setName}
          onWhyChange={setWhy}
        />

        <footer style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          {isSandbox ? (
            <>
              <button onClick={onClose} style={PILL}>Close</button>
              <button
                onClick={onRemix}
                disabled={!onRemix}
                title={onRemix ? 'Make your own version' : 'Remix lands soon'}
                style={{ ...CTA, opacity: onRemix ? 1 : 0.5, cursor: onRemix ? 'pointer' : 'not-allowed' }}
              >
                Remix as mine
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onDelete}
                disabled={!onDelete}
                title="Remove this doodle from the desk"
                style={{ ...PILL, borderColor: 'var(--dir-border)', color: 'var(--dir-text-body-soft)' }}
              >
                Delete
              </button>
              <button onClick={onClose} style={CTA}>Done</button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
