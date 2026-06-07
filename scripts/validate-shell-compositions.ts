// Shell composition validator.
//
// Static checks on SHELL_CONTRACTS + enumerates identity AND pair-native combo
// spaces per shell + emits a manual-test checklist of high-risk combos to
// eyeball on the dev server.
//
// The user's directive: "ALL TOGGLES REMMBER THIS FOR ALL THINGS THAT CAN BE
// CHNAGED". The validator treats every axis the lab exposes (identity,
// pair-native, structural) as part of the combo space it must reason about —
// not just the 9 identity axes.
//
// Run: npx tsx scripts/validate-shell-compositions.ts
//
// Exits non-zero on invariant failure; pipes cleanly into CI later if needed.

import {
  SHELL_CONTRACTS,
  LAYOUT_IDS,
  identityComboCount,
  pairNativeComboCount,
  structuralComboCount,
  layoutComboCount,
  totalAxisSpacePerShell,
  totalLabComboCount,
  type ShellContract,
} from '../src/app/components/shells/shellContracts';
import { NATIVE_SHELL_FOR_LAYOUT } from '../src/app/components/family/nativeShellForLayout';

type Severity = 'error' | 'warning';
type Issue = { shellId: string; rule: string; message: string; severity: Severity };

const invariants: Array<(s: ShellContract) => Issue[]> = [
  // Orientation ↔ mediaEdge agreement.
  (s) => {
    const horizontalOk = s.orientation === 'horizontal' && (s.mediaEdge === 'left' || s.mediaEdge === 'right');
    const verticalOk = s.orientation === 'vertical' && (s.mediaEdge === 'top' || s.mediaEdge === 'bottom');
    if (!horizontalOk && !verticalOk) {
      return [{
        shellId: s.id,
        rule: 'orientation-media-edge',
        message: `orientation='${s.orientation}' but mediaEdge='${s.mediaEdge}'`,
        severity: 'error',
      }];
    }
    return [];
  },

  // Horizontal shells must pin minHeight; verticals must not.
  (s) => {
    if (s.orientation === 'horizontal' && !s.minHeight) {
      return [{
        shellId: s.id,
        rule: 'horizontal-min-height',
        message: 'horizontal shell missing minHeight contract',
        severity: 'error',
      }];
    }
    if (s.orientation === 'vertical' && s.minHeight) {
      return [{
        shellId: s.id,
        rule: 'vertical-min-height',
        message: 'vertical shell should not pin minHeight (flows naturally)',
        severity: 'warning',
      }];
    }
    return [];
  },

  // suppressProofAlways shells must also author nativeAxes.shippedProof='off'.
  (s) => {
    if (s.exceptions.suppressProofAlways && s.nativeAxes.shippedProof !== 'off') {
      return [{
        shellId: s.id,
        rule: 'suppress-proof-consistency',
        message: `suppressProofAlways=true but nativeAxes.shippedProof='${s.nativeAxes.shippedProof}' — expected 'off'`,
        severity: 'error',
      }];
    }
    return [];
  },

  // Compact-reduced minHeight must be ≥ 200px (avoid collapse to nothing).
  (s) => {
    if (s.minHeight && s.minHeight.reduced < 200) {
      return [{
        shellId: s.id,
        rule: 'reduced-min-height-floor',
        message: `minHeight.reduced=${s.minHeight.reduced} below 200px floor`,
        severity: 'error',
      }];
    }
    return [];
  },

  // scanAnchor agreement with authored baselines.
  // A proof-led shell must author shippedProof='on'; otherwise the authored
  // baseline renders without its scan anchor.
  (s) => {
    if (s.scanAnchor === 'proof-led' && s.nativeAxes.shippedProof !== 'on') {
      return [{
        shellId: s.id,
        rule: 'scan-anchor-proof-consistency',
        message: `scanAnchor='proof-led' but nativeAxes.shippedProof='${s.nativeAxes.shippedProof}' — authored baseline has no scan anchor`,
        severity: 'error',
      }];
    }
    return [];
  },
];

// --- Layout × shell invariants ----------------------------------------------
// Every layout declares native shell placements via NATIVE_SHELL_FOR_LAYOUT.
// Those placements must honor each shell's declared `placement` contract.
// Specifically:
//   • FV-A (min-container-width 2/3) — only legal in reserve slots at ≥ 2/3
//     container width. Never as a grid's `standard` slot.
//   • SV-B (whole-grid-only) — only legal as `standard` (whole-grid), never as
//     `reserve` (which mixes it with another standard shell).
//   • SH-A Row (list-only) — only legal in layouts authored as list registers;
//     hard to enforce statically, but we flag uses outside list-mode layouts.
//
// Plus: every LAYOUT_ID must have an entry in NATIVE_SHELL_FOR_LAYOUT.

function layoutInvariantIssues(): Issue[] {
  const issues: Issue[] = [];

  // Coverage — every declared layout must have a native shell mapping.
  for (const layoutId of LAYOUT_IDS) {
    if (!NATIVE_SHELL_FOR_LAYOUT[layoutId]) {
      issues.push({
        shellId: '—',
        rule: 'layout-coverage',
        message: `LAYOUT_IDS has '${layoutId}' but NATIVE_SHELL_FOR_LAYOUT does not map it`,
        severity: 'error',
      });
    }
  }

  // Reverse coverage — every NATIVE_SHELL_FOR_LAYOUT entry must be a known layout.
  for (const layoutId of Object.keys(NATIVE_SHELL_FOR_LAYOUT)) {
    if (!(LAYOUT_IDS as readonly string[]).includes(layoutId)) {
      issues.push({
        shellId: '—',
        rule: 'layout-coverage',
        message: `NATIVE_SHELL_FOR_LAYOUT has '${layoutId}' but LAYOUT_IDS does not include it`,
        severity: 'error',
      });
    }
  }

  // Placement rules — walk every layout's slots and check shell constraints.
  // Layouts authored as list-mode by id prefix convention (T1-L2 is the only
  // canonical list layout today; T5a-L8/L9 also use SH-A-Row in shelf mode).
  const LIST_MODE_LAYOUTS = new Set(['t1-l2', 't5a-l8', 't5a-l9']);

  for (const [layoutId, mapping] of Object.entries(NATIVE_SHELL_FOR_LAYOUT)) {
    const slotChecks: Array<{ slot: string; shellId: string }> = [];
    if (mapping.featured) slotChecks.push({ slot: 'featured', shellId: mapping.featured });
    slotChecks.push({ slot: 'standard', shellId: mapping.standard });
    if (mapping.reserve) slotChecks.push({ slot: `reserve[${mapping.reserve.slotIdx}]`, shellId: mapping.reserve.shell });

    for (const { slot, shellId } of slotChecks) {
      // SHELL_CONTRACTS keys use lowercase-dash; NATIVE_SHELL_FOR_LAYOUT uses UI labels ('FH-B', 'SV-A' etc.).
      const contractKey = shellId.toLowerCase();
      const contract = SHELL_CONTRACTS[contractKey as keyof typeof SHELL_CONTRACTS];
      if (!contract) {
        issues.push({
          shellId,
          rule: 'layout-shell-unknown',
          message: `layout '${layoutId}' slot '${slot}' references shell '${shellId}' but no contract exists`,
          severity: 'error',
        });
        continue;
      }

      // FV-A in standard slot = violates min-container-width (grid slot is narrow).
      if (contract.placement.kind === 'min-container-width' && slot === 'standard') {
        issues.push({
          shellId: contract.id,
          rule: 'placement-min-container-width',
          message: `layout '${layoutId}' places ${shellId} in standard slot — violates min-container-width 2/3 (${contract.placement.notLegalIn})`,
          severity: 'error',
        });
      }

      // SV-B as reserve slot = violates whole-grid-only (reserve mixes with other shells).
      if (contract.placement.kind === 'whole-grid-only' && slot.startsWith('reserve')) {
        issues.push({
          shellId: contract.id,
          rule: 'placement-whole-grid-only',
          message: `layout '${layoutId}' places ${shellId} in ${slot} — violates whole-grid-only (${contract.placement.notLegalIn})`,
          severity: 'error',
        });
      }

      // SH-A-Row outside a list-mode layout = placement violation.
      if (contract.placement.kind === 'list-only' && !LIST_MODE_LAYOUTS.has(layoutId)) {
        issues.push({
          shellId: contract.id,
          rule: 'placement-list-only',
          message: `layout '${layoutId}' uses ${shellId} but '${layoutId}' is not in the list-mode set — verify list register intent`,
          severity: 'warning',
        });
      }
    }
  }

  return issues;
}

// High-risk combos — the manual-test checklist. The space is vast (millions of
// combos per shell); we surface the combos most likely to reveal composition
// regressions, based on past incidents + categorical reasoning about axis
// interaction.
//
// Categories covered:
//   • IDENTITY pressure — axes modifying shell internals (padding, rhythm, proof)
//   • PAIR-NATIVE pressure — axes gating atoms or starving layout width
//   • CROSS-AXIS pressure — identity × pair-native interactions
function highRiskCombos(s: ShellContract): string[] {
  const combos: string[] = [];

  // --- Identity pressure -------------------------------------------------
  // cardFrame=off × divider=none: external-padding + internal-gap check.
  // Regression source for the media→content gap bug (pre-mediaEdge fix).
  combos.push('[identity] cardFrame=off × divider=none');

  // Proof-heavy density-compact: proof-CTA breathing under pressure
  // (the original Ship A proof-on-CTA collapse bug).
  if (!s.exceptions.suppressProofAlways) {
    combos.push('[identity] density=compact × shippedProof=on × proofPlacement=stack-grid');
    combos.push('[identity] proofPlacement=bottom-strip × density=compact');
  }

  // Content-forward split on featured horizontals: narrow media column +
  // decorated treatments.
  if (s.orientation === 'horizontal' && s.register === 'featured') {
    combos.push('[identity] density=content-forward × imageTreatment=double-frame');
  }

  // Mat treatment: recessed ground + padding may clash with cardFrame=on border.
  combos.push('[identity] cardFrame=on × imageTreatment=mat');

  // --- Pair-native pressure ----------------------------------------------
  // CTA='hidden' removes the foot-of-card anchor from EVERY shell. Proof
  // placement (bottom-strip in particular) and marginTop:auto rely on the
  // CTA row absorbing leftover vertical space — without it, the bottom edge
  // recomposes.
  combos.push('[pair-native] cta=hidden — foot-of-card anchor removed');

  // Register-collapse combos — when a pair-native toggle suppresses the atom
  // carrying the shell's scan anchor, the authored visual hierarchy collapses.
  if (s.scanAnchor === 'tag-led') {
    combos.push('[pair-native] tags=hidden — REGISTER COLLAPSE (tag-led shell losing scan anchor)');
  }
  if (s.scanAnchor === 'proof-led') {
    combos.push('[pair-native] shippedProof=off (via identity axis) — REGISTER COLLAPSE (proof-led shell losing scan anchor)');
  }

  // Atom injection — forcing tags onto shells whose native baseline hides
  // tags introduces atoms the shell wasn't designed to accommodate.
  if (s.id === 'fh-b' || s.id === 'sv-b') {
    combos.push('[pair-native] tags=pill-outline — ATOM INJECTION (shell authored tags=hidden)');
  }

  // Margin extremes: smallest (m1=16px) starves layout width; largest (m15=
  // 640px) gives cards room to bloom but the outer page geometry goes empty.
  // Shell rhythm stays constant but flexing width changes what's legible.
  combos.push('[pair-native] margin=m1 (16px) — narrowest layout width');
  combos.push('[pair-native] margin=m15 (640px) — widest margin, narrowest column');

  // Alternate CTA styles — every shell foot is authored for the PillCTA
  // baseline; rect/caps/underline change foot weight without shell code
  // changing.
  combos.push('[pair-native] cta=rect — boxed CTA alternate');
  combos.push('[pair-native] cta=caps — weight-forward CTA alternate');

  // Media structural-placeholder — doesn't affect composition per se but is
  // an explicit pair-native axis value the validator tracks.
  combos.push('[pair-native] media=structural-placeholder — no real asset');

  // --- Cross-axis pressure -----------------------------------------------
  // cardFrame=off × margin=m1 — frame strip + narrowest width doubles the
  // pressure on the content column.
  combos.push('[cross] cardFrame=off × margin=m1 — unframed + narrow width');

  // density=compact × cta=hidden — compact already tightens rhythm; without
  // a CTA the foot of the card has nothing pulling marginTop:auto.
  combos.push('[cross] density=compact × cta=hidden — compact rhythm + missing foot anchor');

  return combos;
}

const issues: Issue[] = [];
const shells = Object.values(SHELL_CONTRACTS);

for (const shell of shells) {
  for (const invariant of invariants) {
    issues.push(...invariant(shell));
  }
}

issues.push(...layoutInvariantIssues());

const errors = issues.filter(i => i.severity === 'error');
const warnings = issues.filter(i => i.severity === 'warning');

console.log('# Shell Composition Validator Report');
console.log('');
console.log(`Shells: ${shells.length}`);
console.log(`Layouts: ${layoutComboCount()}`);
console.log(`Identity combo space per shell: ${identityComboCount().toLocaleString()}`);
console.log(`Pair-native combo space: ${pairNativeComboCount().toLocaleString()}`);
console.log(`Structural combo space: ${structuralComboCount().toLocaleString()}`);
console.log(`Total axis space per shell (identity × pair-native): ${totalAxisSpacePerShell().toLocaleString()}`);
console.log(`Total lab combo space (layouts × identity × pair-native × shells): ${totalLabComboCount().toLocaleString()}`);
console.log('');

console.log('## Invariant check');
console.log('');
if (errors.length === 0 && warnings.length === 0) {
  console.log('All invariants passed.');
} else {
  for (const issue of issues) {
    console.log(`- [${issue.severity.toUpperCase()}] ${issue.shellId} — ${issue.rule}: ${issue.message}`);
  }
}
console.log('');

console.log('## Per-shell contract summary');
console.log('');
for (const shell of shells) {
  const ex = shell.exceptions.suppressProofAlways ? ' · proof permanently suppressed' : '';
  console.log(`- **${shell.id}** — ${shell.register} ${shell.orientation}, mediaEdge=${shell.mediaEdge}, scanAnchor=${shell.scanAnchor}, native aspect ${shell.nativeAspect}${ex}`);
}
console.log('');

console.log('## High-risk manual-test checklist');
console.log('');
console.log('Eyeball each of these on the dev server (typically :5180). The combo space');
console.log('is too vast to exhaustively test; these are the combos most likely to reveal');
console.log('composition regressions based on past incidents + categorical reasoning.');
console.log('');
console.log('Legend: [identity] = axis modifies shell internals · [pair-native] = axis');
console.log('gates atoms or starves page width · [cross] = identity × pair-native interaction.');
console.log('');
for (const shell of shells) {
  console.log(`### ${shell.id} (${shell.scanAnchor})`);
  for (const combo of highRiskCombos(shell)) {
    console.log(`- [ ] ${combo}`);
  }
  console.log('');
}

console.log('## Layout × shell high-risk checklist');
console.log('');
console.log('Layouts ARE a toggle for the cards — each layout determines which shells');
console.log('render and at what widths. The combos below are the layouts most likely to');
console.log('stress shell placement rules, narrow-width pressure, or hero-slot register.');
console.log('');

function layoutHighRiskCombos(layoutId: string): string[] {
  const combos: string[] = [];
  const mapping = NATIVE_SHELL_FOR_LAYOUT[layoutId];
  if (!mapping) return combos;

  const shellList: string[] = [];
  if (mapping.featured) shellList.push(`Featured=${mapping.featured}`);
  shellList.push(`Standard=${mapping.standard}`);
  if (mapping.reserve) shellList.push(`Reserve[${mapping.reserve.slotIdx}]=${mapping.reserve.shell}`);
  combos.push(`[context] shells used: ${shellList.join(' · ')}`);

  // FV-A reserve slot — test the ≥ 2/3 width contract holds under margin extremes.
  if (mapping.reserve?.shell === 'FV-A') {
    combos.push(`[layout] FV-A reserve slot × margin=m1 — narrow layout width may push reserve below 2/3 threshold`);
  }
  // SV-B whole-grid layouts — verify no accidental SV-A mixing.
  if (mapping.standard === 'SV-B') {
    combos.push(`[layout] SV-B whole-grid × cardFrame=off × divider=none — proof-led register + stripped frame`);
  }
  // SH-A-Row list layouts — test under compact density (list rhythm already tight).
  if (mapping.standard === 'SH-A-Row' || mapping.featured === null && mapping.standard === 'SH-A-Row') {
    combos.push(`[layout] SH-A-Row × density=compact — 280px min-height floor under tightened padding`);
  }
  // Anchor-free layouts — verify foot anchor without a Featured card above.
  if (mapping.featured === null) {
    combos.push(`[layout] anchor-free × cta=hidden — no Featured anchor + no CTA foot anchor`);
  }
  // FH-A layouts with content-forward density × featured horizontal constraints.
  if (mapping.featured === 'FH-A') {
    combos.push(`[layout] FH-A anchor × density=content-forward × imageTreatment=double-frame — narrow media + authored border pressure on featured shell`);
  }
  return combos;
}

for (const layoutId of LAYOUT_IDS) {
  console.log(`### ${layoutId}`);
  for (const combo of layoutHighRiskCombos(layoutId)) {
    console.log(`- [ ] ${combo}`);
  }
  console.log('');
}

if (errors.length > 0) {
  console.error(`\n${errors.length} error(s) — validation failed.`);
  process.exit(1);
}
if (warnings.length > 0) {
  console.log(`\n${warnings.length} warning(s) — review recommended.`);
}
