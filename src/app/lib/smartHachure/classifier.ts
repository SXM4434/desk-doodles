// Smart Hachure System — classifier.
//
// Takes Signals + override-store check → produces a Classification per region.
// v1 ships with ONE provider: the rule engine. v2/v3 add cached LLM + decision
// tree providers via the ClassifierProvider chain.
//
// Architecture: signals → classify → select treatment → render
// See `docs/labs/hero/cells/F3-smart-hachure-system/04-agent-research-classifier-architectures.md`
// for the hybrid pattern + why rules are the right v1 substrate.

import type {
  Signals,
  Classification,
  ClassificationContext,
  ClassifierProvider,
  OverrideStoreApi,
  TonalRole,
} from './types';

// ─── PUBLIC ENTRY POINT ───────────────────────────────────────────────────

/**
 * Classify one region.
 *
 * Resolution order:
 *   1. Override store wins (manual tag = full confidence)
 *   2. Walk provider chain in order (v1 = [ruleEngineProvider])
 *   3. First provider returning confidence ≥ threshold wins
 *   4. Fallback = paper (Agent 3 conservative policy)
 */
export function classify(
  signals: Signals,
  ctx: ClassificationContext,
  providers: ClassifierProvider[],
  overrideStore: OverrideStoreApi,
): Classification {
  // (1) override wins
  const override = overrideStore.get(ctx.svgHash, ctx.regionPath);
  if (override) {
    return {
      role: override.role,
      confidence: 1.0,
      firedRules: [`manual-override (${override.setBy})`],
      classifiedBy: 'manual-override',
      signalsSnapshot: signals,
    };
  }

  // (2)(3) walk provider chain
  for (const provider of providers) {
    const result = provider.classify(signals, ctx);
    if (result && result.confidence >= ctx.confidenceThreshold) {
      return result;
    }
  }

  // (4) conservative fallback — when in doubt, do less hachure
  return {
    role: 'paper',
    confidence: 0,
    firedRules: ['fallback:no-provider-confident'],
    classifiedBy: 'rules',
    signalsSnapshot: signals,
  };
}

// ─── RULE ENGINE PROVIDER ─────────────────────────────────────────────────

/**
 * Rule = a named heuristic that inspects Signals and emits a candidate role
 * with a confidence contribution.
 *
 * Each rule is INDEPENDENT — they don't know about each other. The engine
 * collects all firings, sums confidence per role, returns the highest-scoring
 * role. This avoids ordering bugs (rule A overriding rule B accidentally).
 */
type Rule = {
  id: string;
  description: string;
  evaluate: (s: Signals, ctx: ClassificationContext) => RuleFiring | null;
};

type RuleFiring = {
  role: TonalRole;
  confidence: number; // [0, 1] — contribution from THIS rule
};

// ─── THE RULES (Agent 3 catalog → executable form) ────────────────────────
// Grouped by cluster. Each cluster targets one structural pattern.

// Cluster A — TEXT (highest-priority, simplest)
// Text is never hachured. This fires hard and early.

const RULE_text_label: Rule = {
  id: 'text-label',
  description: '<text> elements are labels — never hachure them',
  evaluate: (s) => (s.tag === 'text' ? { role: 'label-text', confidence: 0.95 } : null),
};

// Cluster B — STRUCTURAL FRAMES
// Outer rectangles that enclose other content. Render as clean outlines.

const RULE_outer_frame_encloses_all: Rule = {
  id: 'outer-frame-encloses-all',
  description:
    'Z-index 0 element that encloses ≥3 siblings + has area > 80% of parent → structural frame',
  evaluate: (s) => {
    if (s.zIndex !== 0) return null;
    if (s.enclosesSiblingCount < 3) return null;
    if (s.areaFractionOfParent < 0.8) return null;
    return { role: 'structural-frame', confidence: 0.85 };
  },
};

const RULE_outer_frame_bordered_wash: Rule = {
  id: 'outer-frame-bordered-wash',
  description:
    'Element with light fill (darkness < 0.15) + stroke + encloses siblings → wash-filled frame',
  evaluate: (s) => {
    if (s.darknessL > 0.15) return null;
    if (s.stroke === null) return null;
    if (s.enclosesSiblingCount < 1) return null;
    return { role: 'structural-frame', confidence: 0.75 };
  },
};

// Cluster C — CONTENT REGIONS (the actual tonal areas)
// Things INSIDE a frame, painted on top, that carry real darkness.

const RULE_inner_band_dark: Rule = {
  id: 'inner-band-dark',
  description:
    'Element contained in another + aspect ratio > 3 + dark fill → solid-content (tonal band)',
  evaluate: (s) => {
    if (s.containedInZIndex === null) return null;
    if (s.aspectRatio < 3 && s.aspectRatio > 1 / 3) return null; // not band-shaped
    if (s.darknessL < 0.5) return null;
    return { role: 'solid-content', confidence: 0.85 };
  },
};

const RULE_inner_content_mid_tonal: Rule = {
  id: 'inner-content-mid-tonal',
  description: 'Contained element with mid darkness (0.3–0.55) → mid-tonal',
  evaluate: (s) => {
    if (s.containedInZIndex === null) return null;
    if (s.darknessL < 0.3 || s.darknessL > 0.55) return null;
    return { role: 'mid-tonal', confidence: 0.7 };
  },
};

const RULE_inner_content_dense_tonal: Rule = {
  id: 'inner-content-dense-tonal',
  description: 'Contained element with darkness 0.55–0.85 → dense-tonal',
  evaluate: (s) => {
    if (s.containedInZIndex === null) return null;
    if (s.darknessL < 0.55 || s.darknessL > 0.85) return null;
    return { role: 'dense-tonal', confidence: 0.75 };
  },
};

const RULE_inner_content_solid: Rule = {
  id: 'inner-content-solid',
  description: 'Contained element with very high darkness (>0.85) → solid-content',
  evaluate: (s) => {
    if (s.containedInZIndex === null) return null;
    if (s.darknessL < 0.85) return null;
    return { role: 'solid-content', confidence: 0.8 };
  },
};

const RULE_inner_content_sparse_tonal: Rule = {
  id: 'inner-content-sparse-tonal',
  description: 'Contained element with light fill (0.05–0.3) → sparse-tonal',
  evaluate: (s) => {
    if (s.containedInZIndex === null) return null;
    if (s.darknessL < 0.05 || s.darknessL > 0.3) return null;
    return { role: 'sparse-tonal', confidence: 0.7 };
  },
};

// Cluster D — LINE DECORATIONS
// Paths/lines with stroke only, no fill = decorative not tonal.

const RULE_stroke_only_path: Rule = {
  id: 'stroke-only-path',
  description: 'Element with stroke but no fill → line-decoration',
  evaluate: (s) => {
    if (s.fill !== null && s.fill !== 'none' && s.fill !== 'transparent') return null;
    if (s.stroke === null) return null;
    if (s.tag === 'text') return null;
    return { role: 'line-decoration', confidence: 0.85 };
  },
};

const RULE_stripe_cluster_member: Rule = {
  id: 'stripe-cluster-member',
  description: 'Member of a sibling stripe cluster (e.g. ruling lines) → line-decoration',
  evaluate: (s) => {
    if (!s.isPartOfStripeCluster) return null;
    return { role: 'line-decoration', confidence: 0.9 };
  },
};

const RULE_dashed_annotation: Rule = {
  id: 'dashed-annotation',
  description: 'Element with stroke-dasharray → decorative-accent (annotation / stitch)',
  evaluate: (s) => {
    if (!s.hasDasharray) return null;
    return { role: 'decorative-accent', confidence: 0.85 };
  },
};

// Cluster E — ACCENTS (small, decorative)
// Tiny elements not contained in larger ones = standalone accents.

const RULE_tiny_decorative: Rule = {
  id: 'tiny-decorative',
  description: 'Very small element (areaFractionOfParent < 0.02) → decorative-accent',
  evaluate: (s) => {
    if (s.areaFractionOfParent > 0.02 && s.areaFractionOfParent !== 0) return null;
    if (s.area === 0) return null;
    // Only fire on standalone tiny things, not stripe members (stripes fire separately)
    if (s.isPartOfStripeCluster) return null;
    return { role: 'decorative-accent', confidence: 0.65 };
  },
};

// Cluster F — TOP-LEVEL TONAL (when nothing else fires)
// Elements at the root that carry darkness but aren't enclosing siblings.

const RULE_root_tonal_sparse: Rule = {
  id: 'root-tonal-sparse',
  description: 'Root-level element with light darkness (0.05–0.3) → sparse-tonal',
  evaluate: (s) => {
    if (s.containedInZIndex !== null) return null; // not root
    if (s.enclosesSiblingCount > 0) return null; // not a frame
    if (s.darknessL < 0.05 || s.darknessL > 0.3) return null;
    return { role: 'sparse-tonal', confidence: 0.55 };
  },
};

const RULE_root_tonal_mid: Rule = {
  id: 'root-tonal-mid',
  description: 'Root-level element with mid darkness (0.3–0.55) → mid-tonal',
  evaluate: (s) => {
    if (s.containedInZIndex !== null) return null;
    if (s.enclosesSiblingCount > 0) return null;
    if (s.darknessL < 0.3 || s.darknessL > 0.55) return null;
    return { role: 'mid-tonal', confidence: 0.55 };
  },
};

const RULE_root_tonal_dense: Rule = {
  id: 'root-tonal-dense',
  description: 'Root-level element with darkness > 0.55 → dense-tonal',
  evaluate: (s) => {
    if (s.containedInZIndex !== null) return null;
    if (s.enclosesSiblingCount > 0) return null;
    if (s.darknessL < 0.55) return null;
    return { role: 'dense-tonal', confidence: 0.55 };
  },
};

// Cluster G — PAPER FALLBACKS
// Things that should explicitly stay paper-white.

const RULE_paper_near_zero: Rule = {
  id: 'paper-near-zero',
  description: 'Darkness ≈ 0 (BG / transparent / paper) → paper',
  evaluate: (s) => {
    if (s.darknessL > 0.03) return null;
    if (s.fill === null) return null; // covered by stroke-only rule instead
    return { role: 'paper', confidence: 0.9 };
  },
};

// ─── ALL RULES (ordered for clarity, not for precedence) ──────────────────

const ALL_RULES: Rule[] = [
  // A. text
  RULE_text_label,
  // B. frames
  RULE_outer_frame_encloses_all,
  RULE_outer_frame_bordered_wash,
  // C. content
  RULE_inner_band_dark,
  RULE_inner_content_mid_tonal,
  RULE_inner_content_dense_tonal,
  RULE_inner_content_solid,
  RULE_inner_content_sparse_tonal,
  // D. lines
  RULE_stroke_only_path,
  RULE_stripe_cluster_member,
  RULE_dashed_annotation,
  // E. accents
  RULE_tiny_decorative,
  // F. root tonal
  RULE_root_tonal_sparse,
  RULE_root_tonal_mid,
  RULE_root_tonal_dense,
  // G. paper fallback
  RULE_paper_near_zero,
];

// ─── PROVIDER IMPLEMENTATION ──────────────────────────────────────────────

/**
 * Evaluation strategy: ALL rules fire independently → confidence per role
 * accumulates → highest-scoring role wins (with the firings as provenance).
 *
 * This avoids "rule ordering matters" failure modes that hand-coded rule
 * engines drift into.
 */
export const ruleEngineProvider: ClassifierProvider = {
  name: 'rule-engine',
  classify(signals, _ctx) {
    const scores: Partial<Record<TonalRole, number>> = {};
    const firings: string[] = [];

    for (const rule of ALL_RULES) {
      const firing = rule.evaluate(signals, _ctx);
      if (firing === null) continue;
      firings.push(rule.id);
      scores[firing.role] = (scores[firing.role] ?? 0) + firing.confidence;
    }

    // Pick winning role
    let bestRole: TonalRole = 'paper';
    let bestScore = 0;
    for (const [role, score] of Object.entries(scores) as [TonalRole, number][]) {
      if (score > bestScore) {
        bestRole = role;
        bestScore = score;
      }
    }

    if (firings.length === 0) return null; // no opinion — delegate to next provider

    // Cap confidence at 1.0 — sums can exceed if multiple rules agree
    const confidence = Math.min(1, bestScore);

    return {
      role: bestRole,
      confidence,
      firedRules: firings,
      classifiedBy: 'rules',
      signalsSnapshot: signals,
    };
  },
};

// Convenience export — the rule list, in case other modules want to inspect.
export const RULE_REGISTRY = ALL_RULES;
