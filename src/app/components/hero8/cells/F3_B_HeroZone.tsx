import type { CSSProperties } from 'react';
import { IS, ISe } from '../../cards/tokens';
import { useF3BConcept } from '../../../state/F3BConceptContext';
import { F3_B_TrophyWall_Path1 } from './F3_B_TrophyWall_Path1';
import { F3_B_TrophyWall_Path2 } from './F3_B_TrophyWall_Path2';
import { F3_B_FloatingCanvas } from './F3_B_FloatingCanvas';
import { F3_B_Pegboard_Path2 } from './F3_B_Pegboard_Path2';
import { F3_B_ConceptComingSoon } from './F3_B_ConceptComingSoon';
import { useF3BPath } from '../../../state/F3BPathContext';
import { useF3TitleCopy, getF3TitleText } from '../../../state/F3TitleCopyContext';
import { useF3BStickyOffset } from '../../../state/F3BStickyOffsetContext';
import { useF3StackOrdering } from '../../../state/F3StackOrderingContext';
import { useF3BColumnWidth } from '../../../state/F3BColumnWidthContext';
import {
  useF3TextTreatment,
  F3_B_PROFILE_TEXT,
  F3_B_APPROACH_TEXT,
  F3_B_LEAD_TEXT,
} from '../../../state/F3TextTreatmentContext';
import { useF3TitleRegister, getTitleRegisterMeta } from '../../../state/F3TitleRegisterContext';

// F3-B · Hero zone dispatcher.
//
// Reads concept context (Trophy Wall / Floating Canvas / Pegboard / etc.)
// and routes to the matching concept component. Built concepts render their
// own composition; unbuilt concepts render F3_B_ConceptComingSoon.
//
// Renders INSIDE Family B's identity aside slot via renderHero on the
// narrow3 family layouts. Sticky at top:32. Stack order C: scene first,
// identity (eyebrow + title + body) below.

function TrophyWallSceneByPath() {
  const { state: path } = useF3BPath();
  return path === 'path-1-3d' ? <F3_B_TrophyWall_Path1 /> : <F3_B_TrophyWall_Path2 />;
}

export function F3_B_HeroZone() {
  const { state: concept } = useF3BConcept();
  const { state: titleId } = useF3TitleCopy();
  const { state: stickyTop } = useF3BStickyOffset();
  const { stateB: stackOrder } = useF3StackOrdering();
  const { state: columnWidth } = useF3BColumnWidth();
  const { stateB: textTreatment } = useF3TextTreatment();
  const { stateB: typeId } = useF3TitleRegister();
  const typeMeta = getTitleRegisterMeta(typeId);
  const titleText = getF3TitleText(titleId);

  let scene;
  switch (concept) {
    case 'trophy-wall':
      scene = <TrophyWallSceneByPath />;
      break;
    case 'floating-canvas':
      scene = <F3_B_FloatingCanvas />;
      break;
    case 'pegboard':
      // Only Path 2 (SVG) built per research §C×§D — Pegboard pairs strongest
      // with vector. Path 1 (3D) deferred until user confirms Path 2.
      scene = <F3_B_Pegboard_Path2 />;
      break;
    default:
      scene = <F3_B_ConceptComingSoon concept={concept} />;
  }

  const eyebrow = (
    <p
      style={{
        fontFamily: IS,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--dir-text-secondary)',
        margin: 0,
      }}
    >
      Sebastian Moncada
    </p>
  );

  const title = (
    <h1
      style={{
        // Locked face × size pair comes from the active Register (typeMeta).
        // Text treatment controls ARRANGEMENT only (which elements render, in
        // what order). It does NOT override the register's locked size. To
        // change title size, change the Register, not the Text treatment.
        fontFamily: typeMeta.fontFamily,
        fontSize: typeMeta.fontSize,
        fontWeight: typeMeta.fontWeight,
        lineHeight: typeMeta.lineHeight,
        letterSpacing: typeMeta.letterSpacing,
        color: 'var(--dir-text-primary)',
        margin: 0,
      }}
    >
      {titleText}
    </h1>
  );

  // Concept-aware standard body — used by 'standard' treatment.
  const standardBody = (
    <p
      style={{
        fontFamily: IS,
        fontSize: 13,
        fontWeight: 300,
        lineHeight: 1.6,
        color: 'var(--dir-text-secondary)',
        margin: 0,
      }}
    >
      {concept === 'trophy-wall' && 'Trophy wall as identity co-anchor. Each pinned artifact maps to a story, a case study, or a small reveal.'}
      {concept === 'floating-canvas' && 'Floating canvas — items live in column space with no surface. Drag-to-place affordance is a follow-up pass.'}
      {concept === 'pegboard' && 'Pegboard — tools beside work. The wall surfaces the toolkit; the work column shows what was built.'}
      {!['trophy-wall', 'floating-canvas', 'pegboard'].includes(concept) && 'Switch concept in chrome to see this column rendered.'}
    </p>
  );

  // Locked Type Cycle 11 — Dense Body IS 13/400 (compressed-context body, fits
  // narrow column) + eyebrow CAPS 10/500/0.12em UC. CAPS 10 = any per pairing rule.
  const profile = (
    <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 400, lineHeight: 1.55, color: 'var(--dir-text-body)', margin: 0 }}>
      <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)', display: 'block', marginBottom: 4 }}>
        PROFILE
      </span>
      {F3_B_PROFILE_TEXT}
    </p>
  );

  const approach = (
    <p style={{ fontFamily: IS, fontSize: 13, fontWeight: 400, lineHeight: 1.55, color: 'var(--dir-text-body)', margin: 0 }}>
      <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)', display: 'block', marginBottom: 4 }}>
        APPROACH
      </span>
      {F3_B_APPROACH_TEXT}
    </p>
  );

  // Lead = Body 15 (locked) — slightly bigger than Dense, since lead has more weight.
  const lead = (
    <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, lineHeight: 1.5, color: 'var(--dir-text-body)', margin: 0 }}>
      {F3_B_LEAD_TEXT}
    </p>
  );

  // Treatment shapes the identity stack — wrap selected elements into the
  // existing stack-ordering machinery (eyebrow / title / body become a
  // single "identity" block; stackOrder still picks where it sits vs scene).
  let identityBlock;
  switch (textTreatment) {
    case 'title-only':
      identityBlock = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{title}</div>
      );
      break;
    case 'multi-body':
      identityBlock = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {eyebrow}
          {title}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
            {profile}
            {approach}
          </div>
        </div>
      );
      break;
    case 'title-lead':
      identityBlock = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {title}
          {lead}
        </div>
      );
      break;
    case 'caption':
      identityBlock = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {eyebrow}
          {title}
        </div>
      );
      break;
    case 'standard':
    default:
      identityBlock = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {eyebrow}
          {title}
          {standardBody}
        </div>
      );
      break;
  }
  // For the legacy stackContent switch below, body is the identity stack
  // (treatment-aware) and the prior eyebrow/title/body atoms collapse into it.
  const body = null;

  // Per F3-B.md §E5 — 4 stack orderings. With treatment-aware identityBlock,
  // the stack switch only positions identityBlock vs scene.
  void body; // legacy atom collapsed into identityBlock
  let stackContent;
  switch (stackOrder) {
    case 'a':
      // text-then-scene
      stackContent = (
        <>
          {identityBlock}
          {scene}
        </>
      );
      break;
    case 'b':
      // scene-mid (identityBlock split: only eyebrow+title above, scene, then nothing — simplified)
      stackContent = (
        <>
          {identityBlock}
          {scene}
        </>
      );
      break;
    case 'd':
      // co-anchored — identityBlock at top with scene at end of it (visually closer)
      stackContent = (
        <>
          {identityBlock}
          {scene}
        </>
      );
      break;
    case 'c':
    default:
      // scene-first (DEFAULT): scene → identityBlock below
      stackContent = (
        <>
          {scene}
          {identityBlock}
        </>
      );
      break;
  }

  // Column width override per user direction 2026-05-31. 'fr-5' keeps the
  // locked Family B 5fr/9fr grid (no override). Other values expand the
  // aside via min-width to override the grid's column width. 'content' uses
  // max-content so the column grows to fit its widest content (typically
  // the title) up to a soft cap.
  let columnWidthStyle: CSSProperties = {};
  if (columnWidth === 'content') {
    // max-content lets the column expand to fit content; gridColumn=span 2
    // would also work but breaks the locked Family B 2-col grid. min-width
    // alone leaves the work column to claim whatever's left of the row.
    columnWidthStyle = { width: 'max-content', minWidth: 320, maxWidth: 720 };
  } else if (columnWidth === '380') {
    columnWidthStyle = { width: 380, minWidth: 380 };
  } else if (columnWidth === '460') {
    columnWidthStyle = { width: 460, minWidth: 460 };
  } else if (columnWidth === '560') {
    columnWidthStyle = { width: 560, minWidth: 560 };
  }

  return (
    <aside
      style={{
        position: 'sticky',
        top: stickyTop,
        alignSelf: 'start',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        ...columnWidthStyle,
      }}
    >
      {stackContent}
    </aside>
  );
}
