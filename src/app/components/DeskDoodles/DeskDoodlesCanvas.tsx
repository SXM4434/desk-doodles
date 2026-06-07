import { useState } from 'react';
import { NavLink } from 'react-router';
import { IS, ISe } from '../../lib/typography';

type CanvasMode = 'svg' | '3d';
type InputMode = 'draw' | 'upload-svg' | 'upload-image';

export function DeskDoodlesCanvas() {
  const [mode, setMode] = useState<CanvasMode>('svg');
  const [input, setInput] = useState<InputMode>('draw');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--dir-bg)',
        color: 'var(--dir-text-primary)',
        fontFamily: IS,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top chrome — brand left, mode toggle center, publish right */}
      <header
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--dir-border)',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 24,
          background: 'var(--dir-bg)',
        }}
      >
        <NavLink
          to="/"
          style={{
            fontFamily: ISe,
            fontSize: 18,
            letterSpacing: '-0.01em',
            color: 'var(--dir-text-primary)',
            textDecoration: 'none',
          }}
        >
          Desk Doodles
        </NavLink>

        <div
          role="tablist"
          aria-label="Canvas mode"
          style={{
            display: 'inline-flex',
            border: '1px solid var(--dir-border)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          {(['svg', '3d'] as CanvasMode[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              style={{
                fontFamily: IS,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                padding: '8px 16px',
                background: mode === m ? 'var(--dir-accent)' : 'transparent',
                color: mode === m ? 'var(--dir-bg)' : 'var(--dir-text-body)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {m === 'svg' ? '2D' : '3D'}
            </button>
          ))}
        </div>

        <div style={{ justifySelf: 'end' }}>
          <button
            disabled
            title="Publish wiring lands Day 9"
            style={{
              fontFamily: IS,
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 16px',
              background: 'var(--dir-cta-bg)',
              color: 'var(--dir-cta-text)',
              border: '1px solid var(--dir-cta-border)',
              borderRadius: 4,
              cursor: 'not-allowed',
              opacity: 0.5,
            }}
          >
            Publish
          </button>
        </div>
      </header>

      {/* Body — left dock + main canvas */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 0 }}>
        {/* Left dock */}
        <aside
          style={{
            borderRight: '1px solid var(--dir-border)',
            background: 'var(--dir-raised)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Input section */}
          <section style={{ padding: 24, borderBottom: '1px solid var(--dir-border)' }}>
            <h2
              style={{
                fontFamily: IS,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--dir-text-secondary)',
                margin: '0 0 16px 0',
              }}
            >
              Input
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(
                [
                  ['draw', 'Draw'],
                  ['upload-svg', 'Upload SVG'],
                  ['upload-image', 'Upload image'],
                ] as [InputMode, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setInput(key)}
                  style={{
                    fontFamily: IS,
                    fontSize: 13,
                    padding: '10px 14px',
                    textAlign: 'left',
                    background: input === key ? 'var(--dir-bg)' : 'transparent',
                    color: 'var(--dir-text-primary)',
                    border: `1px solid ${input === key ? 'var(--dir-accent)' : 'var(--dir-border)'}`,
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Settings section */}
          <section style={{ padding: 24, flex: 1 }}>
            <h2
              style={{
                fontFamily: IS,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--dir-text-secondary)',
                margin: '0 0 16px 0',
              }}
            >
              Settings
            </h2>
            <p
              style={{
                fontFamily: IS,
                fontSize: 13,
                color: 'var(--dir-text-body-soft)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Style picker + Smart Hachure controls wire in Day 7. Engine is already in repo
              (lib/smartHachure/, lib/f3HandFeel.ts).
            </p>
          </section>
        </aside>

        {/* Main canvas area */}
        <main
          style={{
            padding: 48,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'var(--dir-bg)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 720,
              aspectRatio: '4 / 3',
              border: '1px dashed var(--dir-border)',
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 12,
              color: 'var(--dir-text-body-soft)',
              fontFamily: IS,
              fontSize: 13,
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Canvas placeholder · mode = {mode === 'svg' ? '2D' : '3D'} · input = {input}
            </div>
            <div style={{ fontSize: 11, color: 'var(--dir-text-secondary)' }}>
              Day 7: perfect-freehand draw capture + svgson upload + Smart Hachure render
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
