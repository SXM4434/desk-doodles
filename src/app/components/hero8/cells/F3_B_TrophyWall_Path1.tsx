import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { OrthographicCamera } from '@react-three/drei';
import { IS } from '../../cards/tokens';
import { useF3TiltRange, TILT_RANGE_DEGREES } from '../../../state/F3TiltRangeContext';
import { useF3EntranceStagger, STAGGER_MS } from '../../../state/F3EntranceStaggerContext';
import { useF3HoverTreatment, hoverHasScale, hoverHasLoosen, hoverHasGlow } from '../../../state/F3HoverTreatmentContext';
import { useF3Visibility } from '../../../state/F3VisibilityContext';
import { F3B_PINS, describeF3BAction, type F3BPin } from './f3bPinSlate';

// F3-B · Trophy Wall · Path 1 (R3F 3D) — Phase 1 scaffold.
// Pins read from shared `f3bPinSlate` (messy-scatter coords).
// Orthographic isometric camera per §C3.

function PinMesh({ pin, onHover, scaledTiltRadians, opacity, hoverTreatment }: { pin: F3BPin; onHover: (p: F3BPin | null) => void; scaledTiltRadians: number; opacity: number; hoverTreatment: import('../../../state/F3HoverTreatmentContext').F3HoverTreatment }) {
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
      position={[pin.x3D, pin.y3D, 0.05]}
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
        console.log(`[F3-B TrophyWall Path1] ${pin.id} → ${describeF3BAction(pin.action)}`);
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

function Wall() {
  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[6, 10]} />
      <meshStandardMaterial color="#F9F7F3" roughness={1} metalness={0} />
    </mesh>
  );
}

function Scene({ onHover, tiltDegMax, revealedSet, hoverTreatment, hiddenSet }: { onHover: (p: F3BPin | null) => void; tiltDegMax: number; revealedSet: Set<string>; hoverTreatment: import('../../../state/F3HoverTreatmentContext').F3HoverTreatment; hiddenSet: Set<string> }) {
  // Authored pin tilts are degrees (stored on each pin). Base mag ±8° for medium range.
  const baseDeg = 8;
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 4, 5]} intensity={0.5} />
      <Wall />
      {F3B_PINS.map((p) => {
        if (hiddenSet.has(p.id)) return null;
        const tiltFraction = p.tilt / baseDeg;
        const scaledRad = tiltFraction * (tiltDegMax * Math.PI / 180);
        const opacity = revealedSet.has(p.id) ? 1 : 0.001;
        return (
          <PinMesh
            key={p.id}
            pin={p}
            onHover={onHover}
            scaledTiltRadians={scaledRad}
            opacity={opacity}
            hoverTreatment={hoverTreatment}
          />
        );
      })}
    </>
  );
}

function HoveredCaption({ pin }: { pin: F3BPin | null }) {
  return (
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
        opacity: pin ? 1 : 0,
        transition: 'opacity 180ms ease-out',
      }}
    >
      {pin ? (
        <>
          <div style={{ fontWeight: 500 }}>{pin.label}</div>
          <div style={{ opacity: 0.75, fontSize: 10 }}>{pin.caption}</div>
        </>
      ) : (
        <>&nbsp;</>
      )}
    </div>
  );
}

export function F3_B_TrophyWall_Path1() {
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

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        height: 720,
        width: '100%',
        backgroundColor: 'var(--dir-raised)',
        border: '1px solid var(--dir-border)',
        overflow: 'hidden',
      }}
    >
      <Canvas
        dpr={[1, 2]}
        shadows={false}
        frameloop={inView ? 'always' : 'never'}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={45} near={0.1} far={100} />
        <Scene
          onHover={setHovered}
          tiltDegMax={TILT_RANGE_DEGREES[tiltRange]}
          revealedSet={revealedSet}
          hoverTreatment={hoverTreatment}
          hiddenSet={hiddenB}
        />
      </Canvas>
      <HoveredCaption pin={hovered} />
    </div>
  );
}
