import React, { useEffect, useRef, useState } from 'react';
import { IS } from '../cards/tokens';

// Pulled DIRECTLY from Navigation System Lab ProgressTrack.tsx (variants 'bar' + 'dot').
// Animation tokens preserved verbatim from nav-lab source:
//   - bar: 80ms linear width transition
//   - dot: 100ms linear left transition
// Additional variants composed for Gate A Ion cliché-mitigation research:
//   - 'top-bar' — Medium register, fixed at viewport top
//   - 'thick-rail' — heavier rail above TOC (3px)
//   - 'section-dots' — N dots representing sections, filled as passed
//   - 'numbered' — "3 / 10" scrollspy text indicator
//   - 'hakim-path' — Hakim El Hattab style SVG path drawing through TOC labels

export type IonProgressVariant =
  | 'bar'
  | 'dot'
  | 'top-bar'
  | 'thick-rail'
  | 'section-dots'
  | 'numbered'
  | 'hakim-path';

interface IonProgressTrackProps {
  contentRef: React.RefObject<HTMLElement | null>;
  variant: IonProgressVariant;
  sectionIds?: string[];
  currentSectionId?: string | null;
}

function useScrollProgress(contentRef: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const el = contentRef.current;
      if (!el) {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(docHeight > 0 ? Math.min(window.scrollY / docHeight, 1) : 0);
        return;
      }
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      setProgress(total > 0 ? Math.min(Math.max(scrolled / total, 0), 1) : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [contentRef]);
  return progress;
}

export function IonProgressTrack({
  contentRef,
  variant,
  sectionIds = [],
  currentSectionId = null,
}: IonProgressTrackProps) {
  const progress = useScrollProgress(contentRef);

  // ── Bar — nav-lab default variant (1px track + filled progress) ──
  if (variant === 'bar') {
    return (
      <div
        aria-hidden="true"
        style={{
          width: '100%',
          height: '1px',
          backgroundColor: 'var(--dir-border)',
          borderRadius: '1px',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            height: '100%',
            backgroundColor: 'var(--dir-text-secondary)',
            width: `${progress * 100}%`,
            borderRadius: '1px',
            transition: 'width 80ms linear',
          }}
        />
      </div>
    );
  }

  // ── Dot — nav-lab dot variant (2px track + sliding 8x8 dot) ──
  if (variant === 'dot') {
    return (
      <div
        aria-hidden="true"
        style={{
          width: '100%',
          height: '2px',
          backgroundColor: 'var(--dir-border)',
          borderRadius: '1px',
          position: 'relative',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-3px',
            left: `${progress * 100}%`,
            transform: 'translateX(-50%)',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--dir-text-secondary)',
            transition: 'left 100ms linear',
          }}
        />
      </div>
    );
  }

  // ── Top bar — Medium-register fixed bar at viewport top ──
  // Renders into a portal-like fixed position; LabShell chrome sits above it,
  // but at top: 0 it reads as a true viewport-top register.
  if (variant === 'top-bar') {
    return (
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 'var(--lab-shell-h, 40px)',
          left: 0,
          right: 0,
          height: '2px',
          backgroundColor: 'var(--dir-border)',
          zIndex: 60,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            height: '100%',
            backgroundColor: 'var(--dir-text-primary)',
            width: `${progress * 100}%`,
            transition: 'width 80ms linear',
          }}
        />
      </div>
    );
  }

  // ── Thick rail — 3px heavier presence ──
  if (variant === 'thick-rail') {
    return (
      <div
        aria-hidden="true"
        style={{
          width: '100%',
          height: '3px',
          backgroundColor: 'var(--dir-border)',
          borderRadius: '2px',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            height: '100%',
            backgroundColor: 'var(--dir-text-primary)',
            width: `${progress * 100}%`,
            borderRadius: '2px',
            transition: 'width 80ms linear',
          }}
        />
      </div>
    );
  }

  // ── Section dots — one dot per section, filled as scrolled past ──
  if (variant === 'section-dots') {
    const currentIndex = currentSectionId ? sectionIds.indexOf(currentSectionId) : -1;
    return (
      <div
        aria-hidden="true"
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        {sectionIds.map((id, idx) => {
          const isPast = currentIndex >= 0 && idx <= currentIndex;
          return (
            <div
              key={id}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: isPast ? 'var(--dir-text-primary)' : 'var(--dir-border)',
                transition: 'background-color 200ms ease',
              }}
            />
          );
        })}
      </div>
    );
  }

  // ── Numbered — scrollspy text register ("3 / 10") ──
  if (variant === 'numbered') {
    const currentIndex = currentSectionId ? sectionIds.indexOf(currentSectionId) : -1;
    const displayCurrent = currentIndex >= 0 ? currentIndex + 1 : 1;
    const total = sectionIds.length || 1;
    return (
      <div
        aria-hidden="true"
        style={{
          fontFamily: IS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--dir-text-secondary)',
          pointerEvents: 'none',
        }}
      >
        <span style={{ color: 'var(--dir-text-primary)' }}>
          {String(displayCurrent).padStart(2, '0')}
        </span>
        <span style={{ margin: '0 4px', color: 'var(--dir-detail)' }}>/</span>
        <span>{String(total).padStart(2, '0')}</span>
      </div>
    );
  }

  // ── Hakim path — SVG path drawing through stacked dot anchors ──
  // Hakim El Hattab Progress Nav register: vertical SVG path with N section anchors;
  // path stroke-dashoffset animates from full length → 0 as scroll progresses.
  // Each anchor = one section; path drawn as straight vertical line through them.
  if (variant === 'hakim-path') {
    return <HakimPath progress={progress} sectionIds={sectionIds} currentSectionId={currentSectionId} />;
  }

  return null;
}

function HakimPath({
  progress,
  sectionIds,
  currentSectionId,
}: {
  progress: number;
  sectionIds: string[];
  currentSectionId: string | null;
}) {
  const ref = useRef<SVGPathElement | null>(null);
  const [pathLength, setPathLength] = useState(0);
  useEffect(() => {
    if (ref.current) setPathLength(ref.current.getTotalLength());
  }, [sectionIds.length]);
  const count = sectionIds.length || 1;
  const STEP = 28;
  const HEIGHT = (count - 1) * STEP + 16;
  const X = 8;
  const Y0 = 8;
  const points = sectionIds.map((_, i) => ({ x: X, y: Y0 + i * STEP }));
  const d = points.length ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') : '';
  const dashOffset = pathLength * (1 - progress);
  const currentIndex = currentSectionId ? sectionIds.indexOf(currentSectionId) : -1;

  return (
    <svg
      aria-hidden="true"
      width={16}
      height={HEIGHT}
      viewBox={`0 0 16 ${HEIGHT}`}
      style={{ display: 'block', pointerEvents: 'none' }}
    >
      <path
        d={d}
        stroke="var(--dir-border)"
        strokeWidth={1}
        fill="none"
      />
      <path
        ref={ref}
        d={d}
        stroke="var(--dir-text-primary)"
        strokeWidth={1.5}
        fill="none"
        strokeDasharray={pathLength}
        strokeDashoffset={dashOffset}
        style={{ transition: 'stroke-dashoffset 80ms linear' }}
      />
      {points.map((p, i) => {
        const isPast = currentIndex >= 0 && i <= currentIndex;
        return (
          <circle
            key={sectionIds[i]}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={isPast ? 'var(--dir-text-primary)' : 'var(--dir-bg)'}
            stroke={isPast ? 'var(--dir-text-primary)' : 'var(--dir-border)'}
            strokeWidth={1}
            style={{ transition: 'fill 200ms ease, stroke 200ms ease' }}
          />
        );
      })}
    </svg>
  );
}
