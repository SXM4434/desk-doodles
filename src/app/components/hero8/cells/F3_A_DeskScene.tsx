import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { IS, ISe, CD } from '../../cards/tokens';
import { useF3TiltRange, TILT_RANGE_DEGREES } from '../../../state/F3TiltRangeContext';
import { useF3EntranceStagger, STAGGER_MS } from '../../../state/F3EntranceStaggerContext';
import { useF3HoverTreatment, hoverHasScale, hoverHasLoosen, hoverHasGlow } from '../../../state/F3HoverTreatmentContext';
import { useF3TitleCopy, getF3ATitleText } from '../../../state/F3TitleCopyContext';
import {
  useF3TextTreatment,
  F3_A_PROFILE_TEXT,
  F3_A_APPROACH_TEXT,
  F3_A_LEAD_TEXT,
} from '../../../state/F3TextTreatmentContext';
import { useF3TitleRegister, getTitleRegisterMeta } from '../../../state/F3TitleRegisterContext';
import { useF3StackOrdering } from '../../../state/F3StackOrderingContext';
import { useF3SubjectForms } from '../../../state/F3SubjectFormsContext';
import {
  F3_A_DESK_SUBJECTS,
  getDesk3DShape,
  findDeskForm,
  describeF3SubjectAction,
  type F3DeskSubjectDef,
  type F3DeskForm,
} from './f3CoreIdentitySet';

// F3-A · Desk family · Layout Family A hero zone.
//
// Renders INSIDE Family A's hero band slot — replaces HeroBandPlaceholder.
// Phase 1 scaffold: 9 primitive stand-ins (cube/cylinder/cone/sphere) at
// hardcoded scatter coords with -8°/+8° tilt, click hotspots logging
// intended destination, DOM cursor-following tooltip.

// CIS-driven 2026-06-01. Subjects iterate F3_A_DESK_SUBJECTS; each subject's
// form choice comes from F3SubjectFormsContext.f3aDesk; shape ID resolves to
// a 3D primitive via getDesk3DShape(). Low-fi placeholders — proper 3D models
// land in the 3D asset pipeline phase.

const TILT_8 = (8 * Math.PI) / 180;

type RenderableDeskItem = {
  subject: F3DeskSubjectDef;
  form: F3DeskForm;
};

function DeskObjectMesh({ item, onHover, scaledRotationY, opacity, hoverTreatment }: { item: RenderableDeskItem; onHover: (item: RenderableDeskItem | null) => void; scaledRotationY: number; opacity: number; hoverTreatment: import('../../../state/F3HoverTreatmentContext').F3HoverTreatment }) {
  const [hovered, setHovered] = useState(false);
  const scale = hovered && hoverHasScale(hoverTreatment) ? 1.08 : 1.0;
  const loosenJitter = hovered && hoverHasLoosen(hoverTreatment) ? 0.08 : 0;
  const glow = hovered && hoverHasGlow(hoverTreatment);
  const prim = getDesk3DShape(item.form.shape);
  return (
    <mesh
      position={item.subject.position3D}
      rotation={[0, scaledRotationY + loosenJitter, 0]}
      scale={scale * opacity}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
        onHover(item);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(false);
        onHover(null);
        document.body.style.cursor = '';
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        // eslint-disable-next-line no-console
        console.log(`[F3-A] ${item.subject.id}/${item.form.shape} → ${describeF3SubjectAction(item.form.action)}`);
      }}
    >
      {prim.geometry === 'box' && (
        <boxGeometry args={[prim.size[0], prim.size[1], prim.size[2]]} />
      )}
      {prim.geometry === 'cylinder' && (
        <cylinderGeometry args={[prim.size[0], prim.size[1], prim.size[2], 24]} />
      )}
      {prim.geometry === 'cone' && (
        <coneGeometry args={[prim.size[0], prim.size[1], Math.round(prim.size[3] ?? 16)]} />
      )}
      {prim.geometry === 'sphere' && (
        <sphereGeometry args={[prim.size[0], Math.round(prim.size[1] ?? 16), Math.round(prim.size[2] ?? 16)]} />
      )}
      <meshStandardMaterial color={glow ? '#E8E2D2' : (hovered ? '#878075' : '#D4CDBC')} roughness={0.7} metalness={0.05} emissive={glow ? '#3a3530' : '#000000'} emissiveIntensity={glow ? 0.15 : 0} />
    </mesh>
  );
}

function DeskScene({ items, onHover, tiltDegMax, revealedSet, hoverTreatment }: { items: RenderableDeskItem[]; onHover: (item: RenderableDeskItem | null) => void; tiltDegMax: number; revealedSet: Set<string>; hoverTreatment: import('../../../state/F3HoverTreatmentContext').F3HoverTreatment }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 2]} intensity={0.8} />
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#F9F7F3" roughness={1} metalness={0} />
      </mesh>
      {items.map((item) => {
        // tilt is degrees, scale by TILT_8 baseline → range; convert to radians.
        const tiltFraction = item.subject.tilt / 8;
        const scaledRotationY = tiltFraction * (tiltDegMax * Math.PI / 180);
        const opacity = revealedSet.has(item.subject.id) ? 1 : 0.001;
        return (
          <DeskObjectMesh
            key={item.subject.id}
            item={item}
            onHover={onHover}
            scaledRotationY={scaledRotationY}
            opacity={opacity}
            hoverTreatment={hoverTreatment}
          />
        );
      })}
    </>
  );
}

function CursorTooltip({ obj }: { obj: RenderableDeskItem | null }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const cur = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };
    window.addEventListener('mousemove', onMove);
    const tick = () => {
      cur.current.x += (target.current.x - cur.current.x) * 0.18;
      cur.current.y += (target.current.y - cur.current.y) * 0.18;
      if (ref.current) {
        ref.current.style.transform = `translate3d(${cur.current.x + 14}px, ${cur.current.y + 14}px, 0)`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: obj ? 1 : 0,
        transition: 'opacity 180ms ease-out',
        fontFamily: IS,
        fontSize: 13,
        lineHeight: 1.4,
        color: 'var(--dir-bg)',
        backgroundColor: 'var(--dir-text-primary)',
        padding: '6px 10px',
        borderRadius: 4,
        whiteSpace: 'nowrap',
        maxWidth: 280,
      }}
    >
      {obj ? (
        <>
          <span style={{ fontWeight: 500 }}>{obj.form.label}</span>
          <span style={{ opacity: 0.75 }}> · {obj.form.caption}</span>
        </>
      ) : null}
    </div>
  );
}

// F3-A identity stack — renders eyebrow/title/body/profile/approach/lead
// based on the active text treatment per `hero-text-treatments.md`.
function F3ATextStack({ treatment, titleText, typeMeta }: { treatment: import('../../../state/F3TextTreatmentContext').F3TextTreatment; titleText: string; typeMeta: import('../../../state/F3TitleRegisterContext').F3TitleRegisterMeta }) {
  const eyebrow = (
    <p
      style={{
        fontFamily: IS,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--dir-text-secondary)',
        margin: 0,
      }}
    >
      F3-A · DESK · HERO BAND
    </p>
  );

  const title = (
    <h1
      style={{
        // Locked face × size pair comes from the active Register (typeMeta).
        // No clamp() — each register has ONE locked size per typography-system.md.
        fontFamily: typeMeta.fontFamily,
        fontSize: typeMeta.fontSize,
        fontWeight: typeMeta.fontWeight,
        lineHeight: typeMeta.lineHeight,
        letterSpacing: typeMeta.letterSpacing,
        color: 'var(--dir-text-primary)',
        margin: 0,
        maxWidth: '24ch',
      }}
    >
      {titleText}
    </h1>
  );

  // Locked Type Cycle 11 — Body IS 15/400 lh 1.5; eyebrow CAPS 10/500/0.12em UC.
  // CAPS-body pairing: CAPS 10 = any (pairs with Body 15 cleanly).
  const profile = (
    <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, lineHeight: 1.5, color: 'var(--dir-text-body)', margin: 0, maxWidth: '54ch' }}>
      <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)', marginRight: 8 }}>
        PROFILE
      </span>
      {F3_A_PROFILE_TEXT}
    </p>
  );

  const approach = (
    <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, lineHeight: 1.5, color: 'var(--dir-text-body)', margin: 0, maxWidth: '54ch' }}>
      <span style={{ fontFamily: IS, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dir-text-secondary)', marginRight: 8 }}>
        APPROACH
      </span>
      {F3_A_APPROACH_TEXT}
    </p>
  );

  // Lead = Body register (IS 15/400/lh 1.5) — locked.
  const lead = (
    <p style={{ fontFamily: IS, fontSize: 15, fontWeight: 400, lineHeight: 1.5, color: 'var(--dir-text-body)', margin: 0, maxWidth: '52ch' }}>
      {F3_A_LEAD_TEXT}
    </p>
  );

  let content;
  switch (treatment) {
    case 'title-only':
      content = <>{title}</>;
      break;
    case 'multi-body':
      content = (
        <>
          {eyebrow}
          {title}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 32, marginTop: 4 }}>
            {profile}
            {approach}
          </div>
        </>
      );
      break;
    case 'title-lead':
      content = (
        <>
          {title}
          {lead}
        </>
      );
      break;
    case 'caption':
      content = (
        <>
          {eyebrow}
          {title}
        </>
      );
      break;
    case 'standard':
    default:
      content = (
        <>
          {eyebrow}
          {title}
        </>
      );
      break;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: treatment === 'multi-body' ? 12 : 8, padding: '8px 0' }}>
      {content}
    </div>
  );
}

export function F3_A_DeskScene() {
  const [hovered, setHovered] = useState<RenderableDeskItem | null>(null);
  const { state: tiltRange } = useF3TiltRange();
  const { state: staggerMode } = useF3EntranceStagger();
  const { state: hoverTreatment } = useF3HoverTreatment();
  const { state: titleId } = useF3TitleCopy();
  const titleText = getF3ATitleText(titleId);
  const { stateA: textTreatment } = useF3TextTreatment();
  const { stateA: typeId } = useF3TitleRegister();
  const typeMeta = getTitleRegisterMeta(typeId);
  const { stateA: stackOrder } = useF3StackOrdering();
  const { f3aDesk: formChoices } = useF3SubjectForms();
  const staggerMs = STAGGER_MS[staggerMode];

  // Resolve CIS subjects → renderable items based on per-subject form choices.
  // 'off' subjects skip. Unknown shapes also skip (defensive).
  const items: RenderableDeskItem[] = F3_A_DESK_SUBJECTS
    .map((subject): RenderableDeskItem | null => {
      const choice = formChoices[subject.id];
      if (choice === 'off') return null;
      const form = findDeskForm(subject.id, choice);
      if (!form) return null;
      return { subject, form };
    })
    .filter((x): x is RenderableDeskItem => x !== null);

  const [revealedSet, setRevealedSet] = useState<Set<string>>(() =>
    staggerMs === 0 ? new Set(items.map((it) => it.subject.id)) : new Set(),
  );

  useEffect(() => {
    if (staggerMs === 0) {
      setRevealedSet(new Set(items.map((it) => it.subject.id)));
      return;
    }
    setRevealedSet(new Set());
    const timers: number[] = [];
    items.forEach((it, i) => {
      const t = window.setTimeout(() => {
        setRevealedSet((prev) => {
          const next = new Set(prev);
          next.add(it.subject.id);
          return next;
        });
      }, i * staggerMs);
      timers.push(t);
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
    // items recomputes each render; depend on staggerMs + a stable join of ids
    // to avoid re-triggering reveals on every render while ensuring updates
    // when the subject set actually changes (form choices flip on/off).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staggerMs, items.map((it) => it.subject.id).join(',')]);

  const textStack = (
    <F3ATextStack treatment={textTreatment} titleText={titleText} typeMeta={typeMeta} />
  );

  const canvas = (
    <div
      style={{
        position: 'relative',
        height: 'clamp(360px, 44vh, 520px)',
      }}
    >
      <Canvas
        camera={{ position: [0, 1.6, 4.4], fov: 38 }}
        dpr={[1, 2]}
        shadows={false}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <DeskScene
          items={items}
          onHover={setHovered}
          tiltDegMax={TILT_RANGE_DEGREES[tiltRange]}
          revealedSet={revealedSet}
          hoverTreatment={hoverTreatment}
        />
      </Canvas>
      <CursorTooltip obj={hovered} />
    </div>
  );

  // F3-A stack ordering — per-cell interpretation of A/B/C/D ids.
  // A = text above scene (default scaffold) · B = scene above text ·
  // C = text overlaid on the canvas (cinematic) · D = side-by-side band.
  let composition;
  switch (stackOrder) {
    case 'b':
      composition = (
        <>
          {canvas}
          {textStack}
        </>
      );
      break;
    case 'c':
      composition = (
        <div style={{ position: 'relative' }}>
          {canvas}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: 24,
              pointerEvents: 'none',
            }}
          >
            <div style={{ pointerEvents: 'auto' }}>{textStack}</div>
          </div>
        </div>
      );
      break;
    case 'd':
      composition = (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)',
            gap: 32,
            alignItems: 'center',
          }}
        >
          {textStack}
          {canvas}
        </div>
      );
      break;
    case 'a':
    default:
      composition = (
        <>
          {textStack}
          {canvas}
        </>
      );
      break;
  }

  return (
    <header
      aria-label="Hero band — F3-A desk"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        marginBottom: 8,
      }}
    >
      {composition}
    </header>
  );
}
