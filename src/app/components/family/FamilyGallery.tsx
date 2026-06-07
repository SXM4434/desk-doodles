import React from 'react';
import { IS, ISe } from '../cards/tokens';
import { Page1120 } from '../layouts/PageInset';
import { GlobalNav } from '../GlobalNav';
import { FH_A } from '../shells/FH_A';
import { FH_B } from '../shells/FH_B';
import { FV_A } from '../shells/FV_A';
import { SV_A } from '../shells/SV_A';
import { SV_B } from '../shells/SV_B';
import { SH_A_Row } from '../shells/SH_A_Row';
import { IonFMid_1CTA } from '../shells/IonFMid_1CTA';
import { IonF2 } from '../shells/IonF2';
import { primaryProject, supportProjects } from '../../data/projects';
import { SURFACE_ATTRS } from './surfaceAttributes';
import type { Family } from './types';
import { usePreset, type PresetId } from '../../state/PresetContext';
import { PresetApplier } from './PresetApplier';

// Family page shell gallery — renders the 8 Project Card System shells
// (FH-B, FH-A, FV-A, SV-A, SV-B, SH-A-Row, Ion FMid-1CTA, Ion F2) with the
// family identity applied through the 8 shared axis contexts. The 10 Cards /
// 3 Tiles combinations from SURFACE_ATTRS surface here as named presets —
// selecting a preset cascades its fixed/baseline values into the 8 contexts.
//
// Mirrors the organization of the locked Project Card System Lab
// FinalSystemPage: each shell rendered with a meta wrapper (id · placement ·
// scan · status · notes) above the live render. This is the research view,
// not a hiring surface.

type Props = {
  family: Family;
  title: string;
  subtitle: string;
};

export function FamilyGallery({ family, title, subtitle }: Props) {
  const members = SURFACE_ATTRS.filter((s) => s.family === family);

  return (
    <>
      <GlobalNav />
      <Page1120>
        <p style={eyebrow}>Homepage Surfaces v2 · {family === 'cards' ? 'Cards' : 'Tiles'} family</p>
        <h1 style={h1}>{title}</h1>
        <p style={lede}>{subtitle}</p>

        <PresetApplier family={family} />
        <PresetPicker family={family} members={members} />

        <WiringNote family={family} />

        {/* Featured · horizontal ─────────────────────────── */}
        <ShellGroup
          label="Featured · horizontal"
          note="Full-strength featured card. 52/48 split, 420 min-height."
        >
          <ShellCard
            id="FH-B"
            placement="Featured"
            scan="Proof-led — tags absent, proof row carries the scan anchor."
            status="Locked"
          >
            <FH_B project={primaryProject} />
          </ShellCard>
          <ShellCard
            id="FH-A"
            placement="Featured"
            scan="Tag-led — pill tags + framing carry scan; proof is supporting."
            status="Locked"
          >
            <FH_A project={primaryProject} />
          </ShellCard>
        </ShellGroup>

        {/* Featured · vertical ──────────────────────────── */}
        <ShellGroup
          label="Featured · vertical"
          note="Media-top Featured variant. Used when the hero slot holds aspect-forward artifact media."
        >
          <ShellCard
            id="FV-A"
            placement="Featured"
            scan="Media-forward vertical — artifact aspect drives the read."
            status="Locked"
          >
            <FV_A project={primaryProject} />
          </ShellCard>
        </ShellGroup>

        {/* Standard · vertical grid ─────────────────────── */}
        <ShellGroup
          label="Standard · vertical grid"
          note="Grid-placement Standards. Three-up or four-up below the Featured."
        >
          <ShellCard
            id="SV-A"
            placement="Standard · grid"
            scan="Tag-led browse — type tag + pill tags answer 'what kind of project.'"
            status="Locked"
            narrow
          >
            <SV_A project={supportProjects[0]} />
          </ShellCard>
          <ShellCard
            id="SV-B"
            placement="Standard · grid"
            scan="Editorial register — ISe italic title, quieter scan."
            status="Locked"
            narrow
          >
            <SV_B project={supportProjects[0]} />
          </ShellCard>
        </ShellGroup>

        {/* Standard · horizontal list ─────────────────── */}
        <ShellGroup
          label="Standard · horizontal list"
          note="List-placement Standard. Reduced 280px height — denser row rhythm."
        >
          <ShellCard
            id="SH-A-Row"
            placement="Standard · list"
            scan="Compact horizontal row — media left, content right at list density."
            status="Locked"
          >
            <SH_A_Row project={supportProjects[1] ?? supportProjects[0]} />
          </ShellCard>
        </ShellGroup>

        {/* Ion ─────────────────────────────────────────── */}
        <ShellGroup
          label="Ion · pressure tests"
          note="Ion-content pressure tests of the Featured register."
        >
          <ShellCard
            id="Ion FMid-1CTA"
            placement="Ion · Featured"
            scan="Middle-weight framing + selected tags + proof row. Primary CTA only."
            status="Locked"
          >
            <IonFMid_1CTA project={primaryProject} />
          </ShellCard>
          <ShellCard
            id="Ion F2"
            placement="Ion · Featured"
            scan="System-optimized Ion — tags dropped, proof sits directly under framing."
            status="Locked"
          >
            <IonF2 project={primaryProject} />
          </ShellCard>
        </ShellGroup>
      </Page1120>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Preset picker — row of pills: Custom · then each surface in the family.
// Also appears in LabShell's toolbar as a grouped dropdown; the pill row is
// kept here because family pages are the research view where it reads best.
// ─────────────────────────────────────────────────────────────────────────

function PresetPicker({
  family,
  members,
}: {
  family: Family;
  members: typeof SURFACE_ATTRS;
}) {
  const { preset, setPreset } = usePreset();

  return (
    <div style={presetRow}>
      <span style={presetEyebrow}>Preset</span>
      <PresetPill
        active={preset === 'custom'}
        onClick={() => setPreset('custom')}
        label="Custom"
        sub="reset to native"
      />
      {members.map((m) => (
        <PresetPill
          key={m.id}
          active={preset === m.id}
          onClick={() => setPreset(m.id as PresetId)}
          label={m.label}
          sub={m.workingName}
        />
      ))}
    </div>
  );
}

function PresetPill({
  active,
  onClick,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: IS,
        fontSize: 11,
        fontWeight: active ? 500 : 400,
        color: active ? 'var(--dir-text-primary)' : 'var(--dir-text-secondary)',
        backgroundColor: active ? 'var(--dir-muted)' : 'transparent',
        border: `1px solid ${active ? 'var(--dir-text-primary)' : 'var(--dir-border)'}`,
        padding: '6px 10px',
        cursor: 'pointer',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 1,
        textAlign: 'left',
      }}
    >
      <span style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
      {sub && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 300,
            color: active ? 'var(--dir-text-secondary)' : 'var(--dir-detail)',
            textTransform: 'none',
            letterSpacing: 0,
          }}
        >
          {sub}
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Wiring note — records which toggle axes are wired into shell render
// paths so the lab reads honestly. Density (the 9th identity axis) was
// added to resolve two prior collisions (t1-s1≡t6-s2 and t1-s4≡t2-s4);
// its visual wiring is staged with proof placement + aspect variance.
// ─────────────────────────────────────────────────────────────────────────

function WiringNote({ family: _family }: { family: Family }) {
  return (
    <div style={wiringBox}>
      <span style={wiringLabel}>Toggle wiring (this ship)</span>
      <span style={wiringBody}>
        <strong style={{ color: 'var(--dir-text-primary)' }}>All 9 identity axes wired:</strong> card frame ·
        divider · title register · caption register · image treatment · shipped proof (7 of 8 shells —
        SH-A-Row skipped by 280px row constraint) · proof placement (stack-grid / inline / bottom-strip) ·
        aspect variance (uniform / authored) · density (default / compact / content-forward — Featured
        split + padding, Standard padding). All 4 pair-native axes (margin, CTA, tags, media) also wired.
        Presets cascade into every context; identity-collision adjacencies now produce visible distinctions.
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Shell group + ShellCard wrappers — research layout mirroring the Project
// Card System Lab FinalSystemPage.
// ─────────────────────────────────────────────────────────────────────────

function ShellGroup({
  label,
  note,
  children,
}: {
  label: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 56 }}>
      <div style={groupHeader}>
        <span style={groupLabel}>{label}</span>
        <span style={groupNote}>{note}</span>
      </div>
      <div style={groupBody}>{children}</div>
    </section>
  );
}

function ShellCard({
  id,
  placement,
  scan,
  status,
  narrow,
  children,
}: {
  id: string;
  placement: string;
  scan: string;
  status: string;
  narrow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article style={shellCardOuter}>
      <div style={shellMetaRow}>
        <span style={shellId}>{id}</span>
        <span style={shellPlacement}>{placement}</span>
        <span style={shellStatus}>{status}</span>
      </div>
      <p style={shellScan}>{scan}</p>
      <div style={narrow ? shellRenderNarrow : shellRender}>{children}</div>
    </article>
  );
}

/* ─── styles ─────────────────────────────────────────────────────── */

const eyebrow: React.CSSProperties = {
  fontFamily: IS,
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--dir-text-secondary)',
  margin: 0,
  marginBottom: 12,
};

const h1: React.CSSProperties = {
  fontFamily: ISe,
  fontSize: 52,
  fontWeight: 400,
  lineHeight: 1.05,
  letterSpacing: '-0.02em',
  color: 'var(--dir-text-primary)',
  margin: 0,
  marginBottom: 20,
};

const lede: React.CSSProperties = {
  fontFamily: IS,
  fontSize: 15,
  fontWeight: 300,
  lineHeight: 1.6,
  color: 'var(--dir-text-secondary)',
  maxWidth: 680,
  margin: 0,
  marginBottom: 32,
};

const presetRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 8,
  padding: '16px 20px',
  border: '1px solid var(--dir-border)',
  backgroundColor: 'var(--dir-raised)',
  marginBottom: 12,
};

const presetEyebrow: React.CSSProperties = {
  fontFamily: IS,
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--dir-text-secondary)',
  marginRight: 8,
};

const wiringBox: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '10px 16px',
  border: '1px dashed var(--dir-border)',
  backgroundColor: 'var(--dir-recessed)',
  marginBottom: 40,
};

const wiringLabel: React.CSSProperties = {
  fontFamily: IS,
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--dir-text-secondary)',
};

const wiringBody: React.CSSProperties = {
  fontFamily: IS,
  fontSize: 11,
  fontWeight: 300,
  lineHeight: 1.55,
  color: 'var(--dir-text-secondary)',
};

const groupHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 16,
  paddingBottom: 8,
  borderBottom: '1px solid var(--dir-border)',
  marginBottom: 16,
};

const groupLabel: React.CSSProperties = {
  fontFamily: IS,
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--dir-text-primary)',
};

const groupNote: React.CSSProperties = {
  fontFamily: IS,
  fontSize: 11,
  fontWeight: 300,
  color: 'var(--dir-detail)',
};

const groupBody: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const shellCardOuter: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const shellMetaRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
};

const shellId: React.CSSProperties = {
  fontFamily: IS,
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--dir-text-primary)',
  padding: '2px 6px',
  border: '1px solid var(--dir-border)',
  backgroundColor: 'var(--dir-muted)',
};

const shellPlacement: React.CSSProperties = {
  fontFamily: IS,
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--dir-text-secondary)',
};

const shellStatus: React.CSSProperties = {
  fontFamily: IS,
  fontSize: 10,
  fontWeight: 400,
  color: 'var(--dir-detail)',
  marginLeft: 'auto',
};

const shellScan: React.CSSProperties = {
  fontFamily: IS,
  fontSize: 11,
  fontWeight: 300,
  lineHeight: 1.55,
  color: 'var(--dir-text-secondary)',
  margin: 0,
  maxWidth: 720,
};

const shellRender: React.CSSProperties = {
  display: 'block',
  marginTop: 4,
};

const shellRenderNarrow: React.CSSProperties = {
  display: 'block',
  marginTop: 4,
  maxWidth: 420,
};
