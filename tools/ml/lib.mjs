// tools/ml/lib.mjs — shared ML primitives for the Desk Doodles smart-layer.
//
// THE NO-FAKE-ML CONTRACT (feedback_actual_ml_not_fake):
//   - Real labeled dataset (datasets/smart-layer.dataset.jsonl, golden role labels).
//   - Real, from-scratch training (softmax logistic regression fit by minibatch SGD —
//     actual weight matrix learned by gradient descent, NOT an if-statement, NOT an
//     LLM call). Zero external ML deps so the script stays re-runnable as data grows.
//   - Real leakage-safe TRAIN/TEST split: regions are grouped BY svgHash (shape) and
//     whole shapes go to either train or test, never split across — so the same shape's
//     regions can't straddle the boundary and leak.
//   - Honest metrics computed ONLY on the held-out test shapes.
//
// This file is pure functions; the entry point is train-region-classifier.mjs.
// Offline tooling — node ESM, run manually. NOT part of the app bundle.

import fs from 'node:fs';
import readline from 'node:readline';

// ───────────────────────────── dataset I/O ──────────────────────────────────

/** Read the JSONL dataset → array of example objects. */
export async function loadDataset(path) {
  const rl = readline.createInterface({
    input: fs.createReadStream(path, 'utf8'),
    crlfDelay: Infinity,
  });
  const rows = [];
  for await (const line of rl) {
    const t = line.trim();
    if (!t) continue;
    rows.push(JSON.parse(t));
  }
  return rows;
}

// ─────────────────────────── feature encoding ───────────────────────────────
//
// The dataset carries exactly three region features per example:
//   features.darknessL  (0..1, continuous — perceptual ink darkness)
//   features.area       (px², continuous, heavy-tailed — log1p compressed)
//   features.fillStyle  ('none' | 'solid' | 'hachure' — categorical, one-hot)
//
// HONESTY NOTE: these are only 3 of the ~10 Signals the rule engine reads
// (it also uses zIndex, containment, enclosesSiblingCount, aspectRatio, tag, …
// which are NOT in this dataset). So a model trained here is answering the
// narrower question "how far do darkness+area+fillStyle alone predict the role?"
// — not "can it reproduce the full rule engine." The comparison baselines below
// are computed on the SAME 3 features so the lift number is apples-to-apples.

export const FILL_STYLES = ['none', 'solid', 'hachure'];

/** Raw (unstandardized) numeric feature vector for one example. */
export function rawFeatures(ex) {
  const f = ex.features || {};
  const darkness = clamp01(num(f.darknessL));
  const logArea = Math.log1p(Math.max(0, num(f.area)));
  const fillOneHot = FILL_STYLES.map((s) => (f.fillStyle === s ? 1 : 0));
  return [darkness, logArea, ...fillOneHot];
}

export const FEATURE_NAMES = ['darknessL', 'log1pArea', ...FILL_STYLES.map((s) => `fill=${s}`)];

/** Fit standardization (mean/std) on TRAIN ONLY — never on test (no leakage). */
export function fitStandardizer(trainRaw) {
  const d = trainRaw[0].length;
  const mean = new Array(d).fill(0);
  const std = new Array(d).fill(0);
  for (const x of trainRaw) for (let j = 0; j < d; j++) mean[j] += x[j];
  for (let j = 0; j < d; j++) mean[j] /= trainRaw.length;
  for (const x of trainRaw) for (let j = 0; j < d; j++) std[j] += (x[j] - mean[j]) ** 2;
  for (let j = 0; j < d; j++) {
    std[j] = Math.sqrt(std[j] / Math.max(1, trainRaw.length - 1));
    if (std[j] < 1e-8) std[j] = 1; // constant column → leave as-is (one-hot can be near-constant)
  }
  return { mean, std };
}

export function applyStandardizer(raw, { mean, std }) {
  return raw.map((x) => x.map((v, j) => (v - mean[j]) / std[j]));
}

// ───────────────────── leakage-safe shape-grouped split ──────────────────────
//
// SPLIT RULE (documented in the artifact): group examples by svgHash; assign
// each WHOLE shape deterministically to train or test by a hash of its svgHash
// (seeded). A shape's regions therefore never straddle the boundary — the
// leakage path the task names ("same shape's regions must not straddle") is
// closed by construction. Region-level random split would leak: regions from
// one shape are near-duplicates (shared darkness/area regime), so a test region
// whose sibling is in train is a memorization freebie, not generalization.

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Deterministic shape-grouped split.
 * @returns {{trainIdx:number[], testIdx:number[], trainShapes:Set, testShapes:Set}}
 */
export function shapeGroupedSplit(rows, { testFraction = 0.25, seed = 'desk-doodles-v1' } = {}) {
  const shapes = [...new Set(rows.map((r) => r.svgHash))];
  // Rank shapes by their seeded hash, take the top testFraction as the test set.
  // Deterministic, reproducible, and independent of row order.
  const scored = shapes
    .map((h) => ({ h, k: fnv1a(`${seed}:${h}`) / 0xffffffff }))
    .sort((a, b) => a.k - b.k);
  const nTest = Math.max(1, Math.round(shapes.length * testFraction));
  const testShapes = new Set(scored.slice(0, nTest).map((s) => s.h));
  const trainShapes = new Set(scored.slice(nTest).map((s) => s.h));
  const trainIdx = [];
  const testIdx = [];
  rows.forEach((r, i) => (testShapes.has(r.svgHash) ? testIdx : trainIdx).push(i));
  return { trainIdx, testIdx, trainShapes, testShapes };
}

// ───────────────── softmax logistic regression (from scratch) ────────────────
//
// Real training: a (numClasses × numFeatures+1) weight matrix learned by
// minibatch SGD on the cross-entropy loss, with L2 regularization. No library
// hides the math; the gradient is computed explicitly below.

function softmax(logits) {
  const m = Math.max(...logits);
  const ex = logits.map((z) => Math.exp(z - m));
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / s);
}

/** Seeded PRNG (mulberry32) so training is reproducible. */
function mulberry32(seedStr) {
  let a = fnv1a(seedStr);
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Train softmax LR.
 * @param X standardized feature matrix (n × d)
 * @param y integer class labels (n)
 * @param numClasses
 * @returns weights W: numClasses × (d+1)  (last col = bias)
 */
export function trainSoftmaxLR(
  X,
  y,
  numClasses,
  { epochs = 300, lr = 0.3, l2 = 1e-3, batchSize = 32, seed = 'sgd-v1', verbose = false } = {},
) {
  const n = X.length;
  const d = X[0].length;
  // class-balanced sample weights — the dataset is imbalanced (structural-frame
  // is 53/1394). Weighting by inverse class frequency stops the model collapsing
  // to the majority class; reported below so it's not a hidden thumb on the scale.
  const counts = new Array(numClasses).fill(0);
  for (const c of y) counts[c]++;
  const classW = counts.map((c) => (c > 0 ? n / (numClasses * c) : 0));

  const W = Array.from({ length: numClasses }, () => new Array(d + 1).fill(0));
  const rand = mulberry32(seed);
  const idx = [...Array(n).keys()];

  for (let ep = 0; ep < epochs; ep++) {
    // shuffle
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    for (let b = 0; b < n; b += batchSize) {
      const batch = idx.slice(b, b + batchSize);
      const grad = Array.from({ length: numClasses }, () => new Array(d + 1).fill(0));
      let wsum = 0;
      for (const i of batch) {
        const xi = X[i];
        const logits = W.map((wc) => {
          let z = wc[d]; // bias
          for (let j = 0; j < d; j++) z += wc[j] * xi[j];
          return z;
        });
        const p = softmax(logits);
        const sw = classW[y[i]];
        wsum += sw;
        for (let c = 0; c < numClasses; c++) {
          const err = (p[c] - (y[i] === c ? 1 : 0)) * sw;
          for (let j = 0; j < d; j++) grad[c][j] += err * xi[j];
          grad[c][d] += err;
        }
      }
      const scale = lr / Math.max(1e-9, wsum);
      for (let c = 0; c < numClasses; c++) {
        for (let j = 0; j < d; j++) {
          // L2 on weights, not bias
          W[c][j] -= scale * grad[c][j] + lr * l2 * W[c][j];
        }
        W[c][d] -= scale * grad[c][d];
      }
    }
    if (verbose && (ep % 50 === 0 || ep === epochs - 1)) {
      const loss = crossEntropy(X, y, W, numClasses, classW);
      process.stderr.write(`  epoch ${ep}: weighted CE loss ${loss.toFixed(4)}\n`);
    }
  }
  return { W, classW };
}

function crossEntropy(X, y, W, numClasses, classW) {
  const d = X[0].length;
  let loss = 0;
  let wsum = 0;
  for (let i = 0; i < X.length; i++) {
    const logits = W.map((wc) => {
      let z = wc[d];
      for (let j = 0; j < d; j++) z += wc[j] * X[i][j];
      return z;
    });
    const p = softmax(logits);
    const sw = classW[y[i]];
    loss += -sw * Math.log(Math.max(1e-12, p[y[i]]));
    wsum += sw;
  }
  return loss / Math.max(1e-9, wsum);
}

/** Predict class probabilities for one standardized feature row. */
export function predictProba(W, x) {
  const d = x.length;
  const logits = W.map((wc) => {
    let z = wc[d];
    for (let j = 0; j < d; j++) z += wc[j] * x[j];
    return z;
  });
  return softmax(logits);
}

export function argmax(arr) {
  let bi = 0;
  for (let i = 1; i < arr.length; i++) if (arr[i] > arr[bi]) bi = i;
  return bi;
}

// ────────────────────────────── metrics ─────────────────────────────────────

/** Accuracy + macro-F1 + per-class P/R/F1 + confusion matrix. */
export function classificationReport(yTrue, yPred, classes) {
  const K = classes.length;
  const conf = Array.from({ length: K }, () => new Array(K).fill(0));
  for (let i = 0; i < yTrue.length; i++) conf[yTrue[i]][yPred[i]]++;
  let correct = 0;
  for (let i = 0; i < yTrue.length; i++) if (yTrue[i] === yPred[i]) correct++;
  const accuracy = correct / Math.max(1, yTrue.length);

  const perClass = classes.map((name, c) => {
    let tp = conf[c][c];
    let fp = 0;
    let fn = 0;
    for (let r = 0; r < K; r++) {
      if (r !== c) fp += conf[r][c];
      if (r !== c) fn += conf[c][r];
    }
    const support = conf[c].reduce((a, b) => a + b, 0);
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    return { name, support, precision, recall, f1 };
  });
  const macroF1 = perClass.reduce((a, p) => a + p.f1, 0) / K;
  return { accuracy, macroF1, perClass, confusion: conf, classes };
}

// ─────────────────────────── baseline classifiers ───────────────────────────
//
// Two honest baselines, each fit on TRAIN and evaluated on the SAME held-out
// TEST shapes — so the learned model's lift is measured against a real bar, not
// against nothing.

/** Majority-class baseline: always predict the most frequent TRAIN label. */
export function majorityBaseline(yTrain) {
  const counts = {};
  for (const c of yTrain) counts[c] = (counts[c] || 0) + 1;
  let best = 0;
  let bestN = -1;
  for (const [c, n] of Object.entries(counts)) if (n > bestN) { bestN = n; best = +c; }
  return best;
}

/**
 * Rule-flavored single-feature baseline restricted to the 3 dataset features —
 * a transparent decision stub that mirrors how the rule engine reads darkness +
 * fillStyle, fit by lookup on TRAIN. This is the "rule-engine-on-the-same-3-features"
 * comparison the task asks for: it shows whether LEARNING the weighting beats a
 * hand-style lookup on the identical inputs.
 *
 * Cell = (fillStyle, darkness bucket). Predict the TRAIN-majority label per cell;
 * unseen cell → global TRAIN majority.
 */
export function buildLookupBaseline(rowsTrain, classToIdx) {
  const cell = (ex) => {
    const f = ex.features || {};
    const d = clamp01(num(f.darknessL));
    const db = d < 0.05 ? 'p' : d < 0.3 ? 'lo' : d < 0.55 ? 'mid' : d < 0.8 ? 'hi' : 'blk';
    return `${f.fillStyle}|${db}`;
  };
  const tally = new Map();
  const global = {};
  for (const ex of rowsTrain) {
    const k = cell(ex);
    if (!tally.has(k)) tally.set(k, {});
    const t = tally.get(k);
    t[ex.label] = (t[ex.label] || 0) + 1;
    global[ex.label] = (global[ex.label] || 0) + 1;
  }
  const pick = (t) => Object.entries(t).sort((a, b) => b[1] - a[1])[0][0];
  const lookup = new Map([...tally].map(([k, t]) => [k, classToIdx[pick(t)]]));
  const globalIdx = classToIdx[pick(global)];
  return (ex) => (lookup.has(cell(ex)) ? lookup.get(cell(ex)) : globalIdx);
}

// ───────────────────────────── small utils ──────────────────────────────────

function num(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}
function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
