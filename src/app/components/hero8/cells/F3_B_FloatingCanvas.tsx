import { useEffect, useRef, useState } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { IS } from '../../cards/tokens';
import { useF3BPath } from '../../../state/F3BPathContext';
import { useF3TiltRange, TILT_RANGE_DEGREES, scaleTilt } from '../../../state/F3TiltRangeContext';
import { useF3EntranceStagger, STAGGER_MS } from '../../../state/F3EntranceStaggerContext';
import { useF3HoverTreatment, hoverHasScale, hoverHasLoosen, hoverHasGlow } from '../../../state/F3HoverTreatmentContext';
import { useF3Visibility } from '../../../state/F3VisibilityContext';
import {
  F3B_PINS,
  describeF3BAction,
  type F3BPin,
} from './f3bPinSlate';
import {
  F3_TROPHY_WALL_SUBJECTS,
  F3_TROPHY_WALL_HEIGHT,
  describeF3SubjectAction,
  findTrophyWallForm,
  type F3TrophyWallForm,
  type F3TrophyWallSubjectDef,
} from './f3CoreIdentitySet';
import { useF3SubjectForms } from '../../../state/F3SubjectFormsContext';
import { PinShape } from './F3_B_TrophyWall_Path2';
import { SvgStyleTransform } from './SvgStyleTransform';

// F3-B · Floating Canvas — user-added concept 2026-05-29 (F3-B.md §C3 row 7).
// NO surface (no wall plane / no card). Items float against the page background.
//
// Path 2 (SVG) — CIS-driven 2026-06-01. Reuses the Trophy Wall PinShape catalog
// + per-subject form picks (same `trophyWall` state slot). Visual differentiation
// from Trophy Wall: stronger drop-shadow / brighter glow so items read as floating
// in space rather than pinned on an implied surface. Drag-to-place affordance
// is a future pass per F3-B.md §C3 row 7 user-direction.
//
// Path 1 (3D) — still uses legacy F3B_PINS slate; migrates when Trophy Wall
// Path 1 also migrates (paired workstream).

// ─── PATH 2 — SVG FLOATING (CIS-driven) ───────────────────────────────────
function FloatingPin2D({
  subject,
  form,
  index,
  scaledTilt,
  staggerMs,
  hoverTreatment,
}: {
  subject: F3TrophyWallSubjectDef;
  form: F3TrophyWallForm;
  index: number;
  scaledTilt: number;
  staggerMs: number;
  hoverTreatment: import('../../../state/F3HoverTreatmentContext').F3HoverTreatment;
}) {
  const [hovered, setHovered] = useState(false);
  const showScale = hovered && hoverHasScale(hoverTreatment);
  const showLoosen = hovered && hoverHasLoosen(hoverTreatment);
  const showGlow = hovered && hoverHasGlow(hoverTreatment);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        // eslint-disable-next-line no-console
        console.log(`[F3-B FloatingCanvas Path2] ${subject.id}/${form.shape} → ${describeF3SubjectAction(form.action)}`);
      }}
      style={{
        position: 'absolute',
        top: subject.top,
        left: `${subject.leftPct}%`,
        cursor: 'pointer',
        opacity: staggerMs === 0 ? 1 : 0,
        transform: `translateY(${staggerMs === 0 ? 0 : 8}px) rotate(${scaledTilt}deg)`,
        animation: staggerMs === 0 ? undefined : `f3b-float-reveal 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${index * staggerMs}ms forwards`,
        zIndex: hovered ? 10 : 1,
      }}
    >
      <div
        style={{
          transform: `rotate(${showLoosen ? -scaledTilt * 0.5 : 0}deg) scale(${showScale ? 1.06 : 1})`,
          transformOrigin: 'center',
          // Differentiation from Trophy Wall: stronger shadows so items
          // read as floating in space rather than pinned to a surface.
          transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1), filter 200ms ease',
          filter: showGlow
            ? 'drop-shadow(0 10px 20px rgba(0,0,0,0.14)) brightness(1.05)'
            : 'drop-shadow(0 4px 8px rgba(0,0,0,0.08))',
        }}
      >
        <SvgStyleTransform>
          <PinShape shape={form.shape} />
        </SvgStyleTransform>
      </div>
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 4,
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.04em',
          color: 'var(--dir-text-primary)',
          backgroundColor: 'var(--dir-bg)',
          border: '1px solid var(--dir-border)',
          padding: '4px 8px',
          borderRadius: 3,
          whiteSpace: 'nowrap',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(-4px)',
          transition: 'opacity 200ms ease, transform 200ms ease',
          pointerEvents: 'none',
          zIndex: 11,
        }}
      >
        <span style={{ fontWeight: 500 }}>{form.label}</span>
        <span style={{ marginLeft: 8, color: 'var(--dir-text-secondary)', fontWeight: 400 }}>{form.caption}</span>
      </div>
    </div>
  );
}

function FloatingCanvas_Path2() {
  const { state: tiltRange } = useF3TiltRange();
  const { state: staggerMode } = useF3EntranceStagger();
  const { state: hoverTreatment } = useF3HoverTreatment();
  const { trophyWall: formChoices } = useF3SubjectForms();
  const staggerMs = STAGGER_MS[staggerMode];

  const visibleSubjects = F3_TROPHY_WALL_SUBJECTS
    .map((subject) => {
      const choice = formChoices[subject.id];
      if (choice === 'off') return null;
      const form = findTrophyWallForm(subject.id, choice);
      if (!form) return null;
      return { subject, form };
    })
    .filter((x): x is { subject: F3TrophyWallSubjectDef; form: F3TrophyWallForm } => x !== null);

  return (
    <div style={{ position: 'relative', width: '100%', height: F3_TROPHY_WALL_HEIGHT }}>
      <style>{`
        @keyframes f3b-float-reveal {
          to { opacity: 1; transform: translateY(0) rotate(var(--pin-tilt, 0deg)); }
        }
      `}</style>
      {visibleSubjects.map(({ subject, form }, i) => (
        <FloatingPin2D
          key={subject.id}
          subject={subject}
          form={form}
          index={i}
          scaledTilt={scaleTilt(subject.tilt, tiltRange)}
          staggerMs={staggerMs}
          hoverTreatment={hoverTreatment}
        />
      ))}
    </div>
  );
}

// ─── PATH 1 — 3D FLOATING (no wall plane) ─────────────────────────────────
function FloatingPinMesh({ pin, onHover, scaledTiltRadians, opacity, hoverTreatment }: { pin: F3BPin; onHover: (p: F3BPin | null) => void; scaledTiltRadians: number; opacity: number; hoverTreatment: import('../../../state/F3HoverTreatmentContext').F3HoverTreatment }) {
  const [hovered, setHovered] = useState(false);
  const scale = hovered && hoverHasScale(hoverTreatment) ? 1.07 : 1.0;
  const loosenZ = hovered && hoverHasLoosen(hoverTreatment) ? 0.05 : 0;
  const glow = hovered && hoverHasGlow(hoverTreatment);
  const rotation: [number, number, number] =
    pin.shape3D === 'cylinder'
      ? [Math.PI / 2, 0, scaledTiltRadians + loosenZ]
      : [0, 0, scaledTiltRadians + loosenZ];
  return (
    <mesh
      position={[pin.x3D, pin.y3D, 0]}
      rotation={rotation}
      scale={scale * opacity}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
        onHover(pin);
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
        console.log(`[F3-B FloatingCanvas Path1] ${pin.id} → ${describeF3BAction(pin.action)}`);
      }}
    >
      {(pin.shape3D === 'box' || pin.shape3D === 'thin-box') && (
        <boxGeometry args={pin.size3D as [number, number, number]} />
      )}
      {pin.shape3D === 'cylinder' && (
        <cylinderGeometry args={[pin.size3D[0], pin.size3D[1], pin.size3D[2], 24]} />
      )}
      <meshStandardMaterial
        color={glow ? '#E8E2D2' : (hovered ? '#A39C8B' : '#D4CDBC')}
        roughness={0.65}
        metalness={0.05}
        emissive={glow ? '#3a3530' : '#000000'}
        emissiveIntensity={glow ? 0.15 : 0}
      />
    </mesh>
  );
}

function FloatingCanvas_Path1() {
  const [hovered, setHovered] = useState<F3BPin | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(true);
  const { state: tiltRange } = useF3TiltRange();
  const { state: staggerMode } = useF3EntranceStagger();
  const { state: hoverTreatment } = useF3HoverTreatment();
  const { hiddenB } = useF3Visibility();
  const staggerMs = STAGGER_MS[staggerMode];
  const [revealedSet, setRevealedSet] = useState<Set<string>>(() =>
    staggerMs === 0 ? new Set(F3B_PINS.map((p) => p.id)) : new Set(),
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => setInView(e.isIntersecting)),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (staggerMs === 0) {
      setRevealedSet(new Set(F3B_PINS.map((p) => p.id)));
      return;
    }
    setRevealedSet(new Set());
    const timers: number[] = [];
    F3B_PINS.forEach((p, i) => {
      const t = window.setTimeout(() => {
        setRevealedSet((prev) => {
          const next = new Set(prev);
          next.add(p.id);
          return next;
        });
      }, i * staggerMs);
      timers.push(t);
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [staggerMs]);

  const baseDeg = 8;
  const tiltDegMax = TILT_RANGE_DEGREES[tiltRange];

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        height: 720,
        width: '100%',
      }}
    >
      <Canvas
        dpr={[1, 2]}
        shadows={false}
        frameloop={inView ? 'always' : 'never'}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={45} near={0.1} far={100} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 4, 5]} intensity={0.3} />
        {/* No <Wall /> — this is the Floating Canvas */}
        {F3B_PINS.map((p) => {
          if (hiddenB.has(p.id)) return null;
          const tiltFraction = p.tilt / baseDeg;
          const scaledRad = tiltFraction * (tiltDegMax * Math.PI / 180);
          const opacity = revealedSet.has(p.id) ? 1 : 0.001;
          return (
            <FloatingPinMesh
              key={p.id}
              pin={p}
              onHover={setHovered}
              scaledTiltRadians={scaledRad}
              opacity={opacity}
              hoverTreatment={hoverTreatment}
            />
          );
        })}
      </Canvas>
      <div
        style={{
          position: 'absolute',
          left: 12,
          bottom: 12,
          backgroundColor: 'var(--dir-text-primary)',
          color: 'var(--dir-bg)',
          padding: '6px 10px',
          borderRadius: 4,
          fontFamily: IS,
          fontSize: 12,
          lineHeight: 1.3,
          pointerEvents: 'none',
          maxWidth: 240,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 180ms ease-out',
        }}
      >
        {hovered ? (
          <>
            <div style={{ fontWeight: 500 }}>{hovered.label}</div>
            <div style={{ opacity: 0.75, fontSize: 10 }}>{hovered.caption}</div>
          </>
        ) : (
          <>&nbsp;</>
        )}
      </div>
    </div>
  );
}

export function F3_B_FloatingCanvas() {
  const { state: path } = useF3BPath();
  return path === 'path-1-3d' ? <FloatingCanvas_Path1 /> : <FloatingCanvas_Path2 />;
}
