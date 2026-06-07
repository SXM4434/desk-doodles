import React, { useLayoutEffect } from 'react';
import { NavLink } from 'react-router';
import { IS, ISe } from './cards/tokens';
import { Page1120 } from './layouts/PageInset';
import { GlobalNav } from './GlobalNav';
import { FH_A } from './shells/FH_A';
import { FH_B } from './shells/FH_B';
import { FV_A } from './shells/FV_A';
import { SV_A } from './shells/SV_A';
import { SV_B } from './shells/SV_B';
import { SH_A_Row } from './shells/SH_A_Row';
import { IonFMid_1CTA } from './shells/IonFMid_1CTA';
import { IonF2 } from './shells/IonF2';
import { primaryProject, supportProjects } from '../data/projects';
import { withNarrow4Overrides } from './narrow4/narrow4ProjectOverrides';
import { Narrow4Eyebrow } from './narrow4/Narrow4Eyebrow';
import { useCta } from '../state/CtaContext';
import { useCardFrame } from '../state/CardFrameContext';
import { useDivider } from '../state/DividerContext';
import { useTitleRegister } from '../state/TitleRegisterContext';
import { useImageTreatment } from '../state/ImageTreatmentContext';
import { useCaptionRegister } from '../state/CaptionRegisterContext';
import { useShippedProof } from '../state/ShippedProofContext';
import { useProofPlacement } from '../state/ProofPlacementContext';
import { useDensity } from '../state/DensityContext';
import { usePreset } from '../state/PresetContext';
import { useTagStyle } from '../state/TagStyleContext';
import { useNarrow4StandardTagStyle } from '../state/Narrow4StandardTagStyleContext';
import { useNarrow4FeaturedAspectVariance } from '../state/Narrow4FeaturedAspectVarianceContext';
import { useNarrow4StandardAspectVariance } from '../state/Narrow4StandardAspectVarianceContext';
import { useNarrow4EyebrowPlacement } from '../state/Narrow4EyebrowPlacementContext';

// Narrow Pass 4 — family page. Renders the 8 locked Project Card System
// shells under the narrow-4 register hard-sets so each shell's native
// behavior is visible alongside the others. Distinct from /cards and /tiles
// in that the register is hard-set on mount instead of selectable via a
// Preset picker. FV-A renders via foot='2-col' and SV-A uses its narrow-4
// props (eyebrow override + proof opt-in + ctaHidden) so this page matches
// the candidate pages at /narrow-4/:family/:version in positioning.
//
// Hard-sets: T8-S4 preset cascade (cardFrame=off, divider=none baseline) +
// proofPlacement=stack-grid + shippedProof=native + density=compact + cta=hidden +
// aspectVariance=native + 4 identity registers to native. shippedProof is left
// to each shell's authored baseline so tag-led shells (FH-A, FV-A, SV-A) don't
// get proof forced on; proof-led shells (FH-B, SV-B, IonFMid_1CTA, IonF2)
// keep their native on. Pair-native margin/tags/media stay free; CTA is
// forced hidden because narrow-4 drops the CTA atom. Each shell receives the
// Option C eyebrow grammar via Narrow4Eyebrow + per-project segments from
// withNarrow4Overrides; proofSuppressed flows from the same wrapper so
// PLACEHOLDER proof payloads are guarded out.

export function NarrowPass4FamilyPage() {
  const { setMode: setCta } = useCta();
  const { setState: setCardFrame } = useCardFrame();
  const { setState: setDivider } = useDivider();
  const { setState: setTitleRegister } = useTitleRegister();
  const { setState: setImageTreatment } = useImageTreatment();
  const { setState: setCaptionRegister } = useCaptionRegister();
  const { setState: setShippedProof } = useShippedProof();
  const { setState: setProofPlacement } = useProofPlacement();
  const { setState: setDensity } = useDensity();
  const { setPreset } = usePreset();
  const { setMode: setTagStyle } = useTagStyle();
  const { state: stdTagStyle } = useNarrow4StandardTagStyle();
  const { state: featuredAspect } = useNarrow4FeaturedAspectVariance();
  const { state: standardAspect } = useNarrow4StandardAspectVariance();
  const { state: eyebrowPlacement } = useNarrow4EyebrowPlacement();

  useLayoutEffect(() => {
    setPreset('t8-s4');
    setCardFrame('off');
    setDivider('none');
    setShippedProof('native');
    setProofPlacement('stack-grid');
    setTagStyle('auto');
    setTitleRegister('native');
    setCaptionRegister('native');
    setImageTreatment('native');
    setDensity('compact');
    setCta('hidden');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <GlobalNav />
      <Page1120>
        <p style={eyebrow}>Homepage Surfaces v2 · Narrow Pass 4 · family</p>
        <h1 style={h1}>8 shells under narrow-4 register</h1>
        <p style={lede}>
          The 8 locked Project Card System shells rendered under the Narrow
          Pass 4 register: T8-S4 preset cascade (no card frame, dividers off,
          stack-grid proof placement), compact density, CTA atom dropped.
          shippedProof and tagStyle resolve to each shell&apos;s native
          authoring — tag-led shells (FH-A, FV-A, SV-A) render without proof
          per their authored register, proof-led + label-led shells (FH-B,
          SV-B, IonFMid-1CTA, IonF2) carry proof natively. Eyebrows enrich
          with Option C grammar (`LABEL · META · STATUS YEAR`) via per-shell
          ProjectLabel rendering. The candidate pages at{' '}
          <NavLink
            to="/narrow-4"
            style={{ color: 'var(--dir-text-primary)', fontWeight: 500 }}
          >
            /narrow-4/:family/:version
          </NavLink>{' '}
          replace the FH-A + SV-A renders with the custom Narrow4 cards.
        </p>

        <RegisterLocks />

        {/* Featured · horizontal ─────────────────────────── */}
        <ShellGroup
          label="Featured · horizontal"
          note="Full-strength featured card. 52/48 split; min-height pin under compact density."
        >
          <ShellCard
            id="FH-B"
            placement="Featured"
            scan="Proof-led — tags absent, proof row carries the scan anchor."
          >
            {(() => {
              const { project, narrow4 } = withNarrow4Overrides(primaryProject);
              return (
                <FH_B
                  project={project}
                  eyebrow={
                    <Narrow4Eyebrow
                      segments={narrow4.eyebrowSegments}
                      register="featured"
                    />
                  }
                  proofSuppressed={narrow4.proofSuppressed}
                />
              );
            })()}
          </ShellCard>
          <ShellCard
            id="FH-A"
            placement="Featured"
            scan="Tag-led — pill tags + framing carry scan; native authoring drops proof."
          >
            {(() => {
              const { project, narrow4 } = withNarrow4Overrides(primaryProject);
              return (
                <FH_A
                  project={project}
                  eyebrow={
                    <Narrow4Eyebrow
                      segments={narrow4.eyebrowSegments}
                      register="featured"
                    />
                  }
                  proofSuppressed={narrow4.proofSuppressed}
                />
              );
            })()}
          </ShellCard>
        </ShellGroup>

        {/* Featured · vertical ──────────────────────────── */}
        <ShellGroup
          label="Featured · vertical"
          note="Media-top Featured variant. Used when the hero slot holds aspect-forward artifact media."
        >
          <ShellCard
            id="FV-A · foot=2-col"
            placement="Featured"
            scan="Media-banner top (21:9) + asymmetric 2/3 + 1/3 foot. Title + framingCompressed LEFT; compact tags + bottom-anchored compressed proof RIGHT. The candidate-page register, rendered through the locked shell."
          >
            {(() => {
              const { project, narrow4 } = withNarrow4Overrides(primaryProject);
              return (
                <FV_A
                  project={project}
                  foot="2-col"
                  eyebrow={
                    <Narrow4Eyebrow
                      segments={narrow4.eyebrowSegments}
                      register="featured"
                    />
                  }
                  proofSuppressed={narrow4.proofSuppressed}
                  eyebrowInRightCol={eyebrowPlacement === 'option-b'}
                  aspectVarianceOverride={featuredAspect}
                />
              );
            })()}
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
            scan="Narrow-4 register — eyebrow (Option C grammar) + h3 + framingEditorial + pill-outline tags + compressed proof. CTA hidden."
            narrow
          >
            {(() => {
              const { project, narrow4 } = withNarrow4Overrides(supportProjects[0]);
              return (
                <SV_A
                  project={project}
                  eyebrow={
                    <Narrow4Eyebrow
                      segments={narrow4.eyebrowSegments}
                      register="standard"
                    />
                  }
                  proofOptIn
                  proofSuppressed={narrow4.proofSuppressed}
                  ctaHidden
                  tagStyle={stdTagStyle === 'native' ? undefined : stdTagStyle}
                  eyebrowPlacement={eyebrowPlacement}
                  aspectVarianceOverride={standardAspect}
                />
              );
            })()}
          </ShellCard>
          <ShellCard
            id="SV-B"
            placement="Standard · grid"
            scan="Editorial register — ISe italic title, quieter scan."
            narrow
          >
            {(() => {
              const { project, narrow4 } = withNarrow4Overrides(supportProjects[0]);
              return (
                <SV_B
                  project={project}
                  eyebrow={
                    <Narrow4Eyebrow
                      segments={narrow4.eyebrowSegments}
                      register="standard"
                    />
                  }
                  proofSuppressed={narrow4.proofSuppressed}
                />
              );
            })()}
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
          >
            {(() => {
              const { project, narrow4 } = withNarrow4Overrides(
                supportProjects[1] ?? supportProjects[0],
              );
              return (
                <SH_A_Row
                  project={project}
                  eyebrow={
                    <Narrow4Eyebrow
                      segments={narrow4.eyebrowSegments}
                      register="standard"
                    />
                  }
                />
              );
            })()}
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
            scan="Middle-weight framing + selected tags + proof row. CTA forced hidden under narrow-4."
          >
            {(() => {
              const { project, narrow4 } = withNarrow4Overrides(primaryProject);
              return (
                <IonFMid_1CTA
                  project={project}
                  eyebrow={
                    <Narrow4Eyebrow
                      segments={narrow4.eyebrowSegments}
                      register="featured"
                    />
                  }
                  proofSuppressed={narrow4.proofSuppressed}
                />
              );
            })()}
          </ShellCard>
          <ShellCard
            id="Ion F2"
            placement="Ion · Featured"
            scan="System-optimized Ion — tags dropped, proof sits directly under framing."
          >
            {(() => {
              const { project, narrow4 } = withNarrow4Overrides(primaryProject);
              return (
                <IonF2
                  project={project}
                  eyebrow={
                    <Narrow4Eyebrow
                      segments={narrow4.eyebrowSegments}
                      register="featured"
                    />
                  }
                  proofSuppressed={narrow4.proofSuppressed}
                />
              );
            })()}
          </ShellCard>
        </ShellGroup>
      </Page1120>
    </>
  );
}

function RegisterLocks() {
  return (
    <div style={locksBox}>
      <span style={locksLabel}>Register locks</span>
      <span style={locksBody}>
        <strong style={{ color: 'var(--dir-text-primary)' }}>
          Hard-set on mount:
        </strong>{' '}
        preset = T8-S4 · cardFrame = off · divider = none · proofPlacement =
        stack-grid · density = compact · cta = hidden.{' '}
        <strong style={{ color: 'var(--dir-text-primary)' }}>
          Native (per-shell authored):
        </strong>{' '}
        shippedProof · tagStyle · titleRegister · captionRegister ·
        imageTreatment · aspect variance.{' '}
        <strong style={{ color: 'var(--dir-text-primary)' }}>Free:</strong>{' '}
        margin · media.
      </span>
    </div>
  );
}

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
  narrow,
  children,
}: {
  id: string;
  placement: string;
  scan: string;
  narrow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article style={shellCardOuter}>
      <div style={shellMetaRow}>
        <span style={shellId}>{id}</span>
        <span style={shellPlacement}>{placement}</span>
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
  maxWidth: 720,
  margin: 0,
  marginBottom: 32,
};

const locksBox: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '12px 16px',
  border: '1px solid var(--dir-border)',
  backgroundColor: 'var(--dir-raised)',
  marginBottom: 40,
};

const locksLabel: React.CSSProperties = {
  fontFamily: IS,
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--dir-text-secondary)',
};

const locksBody: React.CSSProperties = {
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
