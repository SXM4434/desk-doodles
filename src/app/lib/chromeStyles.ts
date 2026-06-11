import type { CSSProperties } from 'react';
import { IS } from './typography';

// Shared chrome style constants — single source for every page's interactive
// chrome. The /playground page is the visual reference; all pages import
// these rather than declaring their own copies. All interactive controls are
// fully rounded (pill); larger non-interactive surfaces use soft radii
// (popover 16, cards 6-16) and are not governed by PILL.

export const PILL: CSSProperties = {
  borderRadius: 999,
  fontFamily: IS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  border: '1px solid var(--dir-border)',
  background: 'transparent',
  color: 'var(--dir-text-body)',
  padding: '6px 14px',
  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
};

export const CTA: CSSProperties = {
  ...PILL,
  background: 'var(--dir-cta-bg)',
  color: 'var(--dir-cta-text)',
  borderColor: 'var(--dir-cta-border)',
};

export const SECTION_LABEL: CSSProperties = {
  fontFamily: IS,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--dir-text-secondary)',
  margin: 0,
};
