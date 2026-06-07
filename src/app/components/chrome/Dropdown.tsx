import React, { useEffect, useRef, useState } from 'react';
import { IS } from '../../lib/typography';

// Custom dropdown popover — replaces native <select> so the open menu
// honors the locked design rules (W1 tokens, IS typography, container
// border + raised surface). Modeled on the Color Lab DirectionSwitcher
// pattern: rich rows (label + name + thesis excerpt), optional section
// headers, current-value marker. Inline popover (not modal) since this
// is a toolbar control, not a ⌘K palette.

export type DropdownOption = {
  value: string;
  label: string;
  meta?: string; // right-aligned tag (e.g. "T1-L1")
  detail?: string; // sub-line (thesis / descriptor)
};

export type DropdownSection = {
  heading: string;
  subheading?: string;
  options: DropdownOption[];
};

type Props = {
  label: string;
  value: string;
  placeholder?: string;
  sections: DropdownSection[];
  onChange: (v: string) => void;
  width?: number;
  popoverWidth?: number;
  popoverAlign?: 'left' | 'right';
  renderTrigger?: (active: DropdownOption | undefined) => string;
};

const CHEVRON_SVG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' fill='none' stroke='%235F5B54' stroke-width='1.25' stroke-linecap='round' stroke-linejoin='round'/></svg>\")";

export function Dropdown({
  label,
  value,
  placeholder,
  sections,
  onChange,
  width,
  popoverWidth = 480,
  popoverAlign = 'left',
  renderTrigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const allOptions = sections.flatMap((s) => s.options);
  const active = allOptions.find((o) => o.value === value);
  const triggerText = renderTrigger
    ? renderTrigger(active)
    : active
      ? active.label
      : (placeholder ?? '—');

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontFamily: IS,
        fontSize: 11,
        width: width ?? '100%',
      }}
    >
      <span
        style={{
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--dir-text-secondary)',
          fontWeight: 600,
          fontSize: 10,
        }}
      >
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          fontFamily: IS,
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--dir-text-primary)',
          backgroundColor: 'var(--dir-bg)',
          backgroundImage: CHEVRON_SVG,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          border: '1px solid var(--dir-border)',
          borderRadius: 9999,
          padding: '10px 36px 10px 16px',
          cursor: 'pointer',
          appearance: 'none',
          outline: 'none',
          lineHeight: 1.4,
          textAlign: 'left',
          width: '100%',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          transition: 'border-color 0.15s, background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--dir-text-secondary)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--dir-border)')}
      >
        {triggerText}
      </button>
      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [popoverAlign]: 0,
            zIndex: 200,
            width: popoverWidth,
            maxHeight: '70vh',
            overflowY: 'auto',
            backgroundColor: 'var(--dir-bg)',
            border: '1px solid var(--dir-border)',
            borderRadius: 16,
            boxShadow: '0 12px 36px rgba(18, 17, 16, 0.10), 0 2px 8px rgba(18, 17, 16, 0.06)',
            fontFamily: IS,
            padding: 6,
          }}
        >
          {sections.map((section, si) => (
            <section key={section.heading + si} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(section.heading || section.subheading) && (
                <div
                  style={{
                    padding: '10px 14px 6px',
                    fontFamily: IS,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--dir-text-secondary)',
                    marginTop: si === 0 ? 0 : 6,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 8,
                  }}
                >
                  <span>{section.heading}</span>
                  {section.subheading && (
                    <span
                      style={{
                        fontWeight: 400,
                        letterSpacing: '0.04em',
                        color: 'var(--dir-text-body-soft)',
                        textTransform: 'none',
                      }}
                    >
                      {section.subheading}
                    </span>
                  )}
                </div>
              )}
              {section.options.map((opt) => {
                const isActive = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                          'var(--dir-raised)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        isActive ? 'var(--dir-recessed)' : 'transparent';
                    }}
                    style={{
                      width: '100%',
                      display: 'grid',
                      gridTemplateColumns: opt.meta ? '56px 1fr auto' : '1fr auto',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      border: 'none',
                      background: isActive ? 'var(--dir-recessed)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: IS,
                      color: 'var(--dir-text-primary)',
                      borderRadius: 10,
                      transition: 'background 0.1s',
                    }}
                  >
                    {opt.meta && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'var(--dir-text-secondary)',
                          alignSelf: 'start',
                          marginTop: 2,
                        }}
                      >
                        {opt.meta}
                      </span>
                    )}
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: isActive ? 600 : 500,
                          lineHeight: 1.3,
                          letterSpacing: '-0.005em',
                          color: 'var(--dir-text-primary)',
                        }}
                      >
                        {opt.label}
                      </span>
                      {opt.detail && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 400,
                            lineHeight: 1.45,
                            color: 'var(--dir-text-body-soft)',
                          }}
                        >
                          {opt.detail}
                        </span>
                      )}
                    </span>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: isActive ? 'var(--dir-accent)' : 'transparent',
                        flexShrink: 0,
                        alignSelf: 'center',
                      }}
                    />
                  </button>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
