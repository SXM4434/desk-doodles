// Resolver-correctness assertion script.
//
// Walks every (layout × surface) pair in the Combo Lab (37 × 37 = 1,369) and
// asserts the invariants each pair-native resolver promises:
//
//   resolvePairMargin  — output is one of the two inputs; when both are
//                        m-tokens, output is the wider; when both are
//                        'centered', output is 'centered'.
//   resolvePairCta     — output is never louder than either input, where
//                        loudness order is visible (auto) > quiet (text) > none
//                        (hidden). Concretely: any 'none' input → 'hidden';
//                        any 'quiet' input without 'none' → 'text'; else 'auto'.
//   resolvePairMedia   — 'real-asset' whenever either input is 'real-asset';
//                        'structural-placeholder' otherwise.
//   resolvePairTags    — always 'auto'.
//
// Run via: npx tsx scripts/verify-pair-native.ts
// Exits non-zero on any failure so CI can gate on it.

import { candidates } from '../src/app/components/layouts/candidates';
import { surfaceCandidates } from '../src/app/components/surfaces/candidates';
import {
  resolvePairMargin,
  resolvePairCta,
  resolvePairMedia,
  resolvePairTags,
} from '../src/app/components/combo/pairNative';
import { MARGIN_VALUES } from '../src/app/state/MarginContext';

type Failure = {
  pair: string;
  axis: 'margin' | 'cta' | 'media' | 'tags';
  message: string;
};

const failures: Failure[] = [];
let checks = 0;

for (const l of candidates) {
  for (const s of surfaceCandidates) {
    const pair = `${l.id} × ${s.id}`;

    // ── margin ────────────────────────────────────────────────────────────
    const m = resolvePairMargin(l, s);
    const L = l.nativeMargin;
    const S = s.nativeMargin;

    if (L === 'centered' && S === 'centered') {
      if (m !== 'centered') {
        failures.push({
          pair,
          axis: 'margin',
          message: `both centered but resolved ${m}`,
        });
      }
    } else if (L === 'centered') {
      if (m !== S) {
        failures.push({
          pair,
          axis: 'margin',
          message: `layout centered, surface ${S}, resolved ${m} (expected ${S})`,
        });
      }
    } else if (S === 'centered') {
      if (m !== L) {
        failures.push({
          pair,
          axis: 'margin',
          message: `surface centered, layout ${L}, resolved ${m} (expected ${L})`,
        });
      }
    } else {
      const wider = MARGIN_VALUES[L] >= MARGIN_VALUES[S] ? L : S;
      if (m !== wider) {
        failures.push({
          pair,
          axis: 'margin',
          message: `both m-tokens (${L}=${MARGIN_VALUES[L]}, ${S}=${MARGIN_VALUES[S]}); wider=${wider}, resolved ${m}`,
        });
      }
    }
    if (m !== L && m !== S) {
      failures.push({
        pair,
        axis: 'margin',
        message: `resolved ${m} is neither input (${L}, ${S})`,
      });
    }
    checks++;

    // ── cta ───────────────────────────────────────────────────────────────
    const cta = resolvePairCta(l, s);
    const anyNone = l.defaultCta === 'none' || s.defaultCta === 'none';
    const anyQuiet = l.defaultCta === 'quiet' || s.defaultCta === 'quiet';
    const expectedCta = anyNone ? 'hidden' : anyQuiet ? 'text' : 'auto';
    if (cta !== expectedCta) {
      failures.push({
        pair,
        axis: 'cta',
        message: `inputs (${l.defaultCta}, ${s.defaultCta}) → expected ${expectedCta}, resolved ${cta}`,
      });
    }
    checks++;

    // ── media ─────────────────────────────────────────────────────────────
    const media = resolvePairMedia(l, s);
    const anyReal =
      l.defaultMedia === 'real-asset' || s.defaultMedia === 'real-asset';
    const expectedMedia = anyReal ? 'real-asset' : 'structural-placeholder';
    if (media !== expectedMedia) {
      failures.push({
        pair,
        axis: 'media',
        message: `inputs (${l.defaultMedia}, ${s.defaultMedia}) → expected ${expectedMedia}, resolved ${media}`,
      });
    }
    checks++;

    // ── tags ──────────────────────────────────────────────────────────────
    const tags = resolvePairTags(l, s);
    if (tags !== 'auto') {
      failures.push({
        pair,
        axis: 'tags',
        message: `expected 'auto', resolved ${tags}`,
      });
    }
    checks++;
  }
}

const totalPairs = candidates.length * surfaceCandidates.length;
console.log(
  `Pair-native verification · ${candidates.length} layouts × ${surfaceCandidates.length} surfaces = ${totalPairs} pairs · ${checks} checks run`,
);

if (failures.length === 0) {
  console.log(`✓ All invariants hold across ${totalPairs} pairs.`);
  process.exit(0);
}

console.error(`✗ ${failures.length} failure(s):`);
for (const f of failures) {
  console.error(`  [${f.axis}] ${f.pair} — ${f.message}`);
}
process.exit(1);
