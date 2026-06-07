import React from 'react';
import { IS } from './tokens';

export function ProjectLabel({ label, meta }: { label: string; meta?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <p
        style={{
          fontFamily: IS,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--dir-text-primary)',
          margin: 0,
        }}
      >
        {label}
      </p>
      {meta && (
        <>
          <span
            style={{
              height: 1,
              width: 16,
              backgroundColor: 'var(--dir-border)',
              flexShrink: 0,
            }}
          />
          <p
            style={{
              fontFamily: IS,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--dir-text-secondary)',
              margin: 0,
            }}
          >
            {meta}
          </p>
        </>
      )}
    </div>
  );
}

export function TypeTag({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </p>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        fontFamily: IS,
        fontSize: 11,
        fontWeight: 500,
        color: 'var(--dir-text-secondary)',
        backgroundColor: 'var(--dir-chip-bg)',
        border: '1px solid var(--dir-chip-border)',
        borderRadius: 9999,
      }}
    >
      {children}
    </span>
  );
}

export function ProofStat({
  value,
  label,
  sub,
  compressed = false,
}: {
  value: string;
  label: string;
  sub?: string;
  compressed?: boolean;
}) {
  return (
    <div>
      <p
        style={{
          fontFamily: IS,
          fontSize: compressed ? 15 : 28,
          fontWeight: 500,
          lineHeight: 1,
          letterSpacing: compressed ? '-0.01em' : '-0.03em',
          color: 'var(--dir-text-primary)',
          fontVariantNumeric: 'tabular-nums',
          margin: 0,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontFamily: IS,
          fontSize: 11,
          fontWeight: 500,
          lineHeight: 1.4,
          color: 'var(--dir-text-secondary)',
          margin: 0,
          marginTop: 4,
        }}
      >
        {label}
      </p>
      {sub && (
        <p
          style={{
            fontFamily: IS,
            fontSize: 10,
            fontWeight: 500,
            color: 'var(--dir-detail)',
            margin: 0,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </p>
  );
}
