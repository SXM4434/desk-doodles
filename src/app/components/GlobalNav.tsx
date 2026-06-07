import React, { useState } from 'react';
import { NavLink } from 'react-router';
import { StaggeredLink } from './StaggeredLink';
import { useMargin, CENTERED_MAX_WIDTH } from '../state/MarginContext';

const IS = "'Instrument Sans', sans-serif";

// Locked GlobalNav — Model B soft-locked, stagger hover, sticky, IS 500.
// Adapted from Navigation System Lab: ProofControls dependency stripped;
// Model B + stagger + no-Playground defaults baked in per locked nav system.
// Routes are stubs for Step 5a (About/Resume do not resolve to real pages yet).

// Lab offset: the LabShell toolbar is sticky at top:0. GlobalNav sticks flush
// below it by reading --lab-shell-h (published live by LabShell via a
// ResizeObserver, so the offset tracks collapse/expand + wrap behavior).
const LAB_SHELL_OFFSET = 'var(--lab-shell-h, 56px)';

function IdentityMarker({ isActive }: { isActive: boolean }) {
  const [hovered, setHovered] = useState(false);
  const defaultColor = 'var(--dir-text-secondary)';
  const activeColor = 'var(--dir-text-primary)';
  const hoverColor = 'var(--dir-text-primary)';
  const color = isActive ? activeColor : hovered ? hoverColor : defaultColor;

  return (
    <StaggeredLink
      text="Sebastian"
      subtle
      style={{
        fontFamily: IS,
        fontSize: 13,
        fontWeight: 500,
        lineHeight: 1.4,
        letterSpacing: 0,
        color,
        transition: 'color 150ms ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    />
  );
}

function RouteItem({ label, isActive }: { label: string; isActive: boolean }) {
  const [hovered, setHovered] = useState(false);
  const defaultColor = 'var(--dir-text-secondary)';
  const activeColor = 'var(--dir-text-primary)';
  const hoverColor = 'var(--dir-text-primary)';
  const color = isActive ? activeColor : hovered ? hoverColor : defaultColor;

  return (
    <StaggeredLink
      text={label}
      style={{
        fontFamily: IS,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1.4,
        letterSpacing: 0,
        color,
        transition: 'color 150ms ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    />
  );
}

export function GlobalNav() {
  const { value: margin, mode } = useMargin();
  const routes = [
    { label: 'Work', to: '/' },
    { label: 'About', to: '/about' },
    { label: 'Resume', to: '/resume' },
  ];

  const inner = (
    <>
      <NavLink to="/" style={{ textDecoration: 'none' }} end>
        {({ isActive }) => <IdentityMarker isActive={isActive} />}
      </NavLink>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {routes.map(({ label, to }) => (
          <NavLink
            key={`${to}-${label}`}
            to={to}
            end={to === '/'}
            style={{ textDecoration: 'none' }}
          >
            {({ isActive }) => <RouteItem label={label} isActive={isActive} />}
          </NavLink>
        ))}
      </nav>
    </>
  );

  const frame: React.CSSProperties = {
    position: 'sticky',
    top: LAB_SHELL_OFFSET,
    zIndex: 50,
    width: '100%',
    backgroundColor: 'var(--dir-bg)',
    borderBottom: '1px solid var(--dir-border)',
    paddingTop: 16,
    paddingBottom: 16,
  };

  if (mode === 'centered') {
    return (
      <header style={frame}>
        <div
          style={{
            maxWidth: CENTERED_MAX_WIDTH,
            margin: '0 auto',
            paddingLeft: margin,
            paddingRight: margin,
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {inner}
        </div>
      </header>
    );
  }

  return (
    <header
      style={{
        ...frame,
        paddingLeft: margin,
        paddingRight: margin,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {inner}
    </header>
  );
}
