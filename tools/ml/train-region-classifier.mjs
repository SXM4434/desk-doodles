#!/usr/bin/env node
// tools/ml/train-region-classifier.mjs
//
// Trains the FIRST real trained model for the Desk Doodles smart layer: a
// softmax logistic-regression region-role classifier (the documented T2-b /
// interpretable-model rung in docs/knowledge/04-the-ml-layer.md +
// 15-the-smart-ml-ladder.md). Re-runnable as datasets/smart-layer.dataset.jsonl
// grows.
//
// WHAT IS REAL HERE (feedback_actual_ml_not_fake):
//   - 1394 golden-labeled (features → role) examples, 6 classes.
//   - Leakage-safe TRAIN/TEST split BY SHAPE (svgHash): whole shapes go to one
//     side, so a shape's regions never straddle train/test.
//   - Actual weight matrix learned by minibatch SGD on cross-entropy (lib.mjs).
//   - Metrics reported ONLY on the held-out test shapes, vs two baselines fit on
//     train and scored on the same test shapes.
//   - Model artifact (weights + standardizer + class list + split receipt)
//     written to datasets/smart-layer.model.json.
//
// HONEST LIMITS (also written into the artifact + printed):
//   - Only 3 features exist in the dataset (darknessL, area, fillStyle); the rule
//     engine uses ~10 signals. This model answers "how far do those 3 predict the
//     role", not "can it replace the rule engine".
//   - Golden labels ORIGINATED as blessed rule output, so the labels and the
//     rule baseline share an ancestor; the test still measures generalization to
//     UNSEEN shapes, which is the honest claim.
//
// Usage:
//   node tools/ml/train-region-classifier.mjs
//   node tools/ml/train-region-classifier.mjs --dataset datasets/smart-layer.dataset.jsonl \
//        --out datasets/smart-layer.model.json --test-fraction 0.25 --seed desk-doodles-v1 --verbose

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadDataset,
  rawFeatures,
  FEATURE_NAMES,
  fitStandardizer,
  applyStandardizer,
  shapeGroupedSplit,
  trainSoftmaxLR,
  predictProba,
  argmax,
  classificationReport,
  majorityBaseline,
  buildLookupBaseline,
} from './lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

function parseArgs(argv) {
  const a = {
    dataset: path.join(REPO_ROOT, 'datasets', 'smart-layer.dataset.jsonl'),
    out: path.join(REPO_ROOT, 'datasets', 'smart-layer.model.json'),
    testFraction: 0.25,
    seed: 'desk-doodles-v1',
    epochs: 300,
    lr: 0.3,
    l2: 1e-3,
    verbose: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--dataset') a.dataset = path.resolve(argv[++i]);
    else if (k === '--out') a.out = path.resolve(argv[++i]);
    else if (k === '--test-fraction') a.testFraction = Number(argv[++i]);
    else if (k === '--seed') a.seed = argv[++i];
    else if (k === '--epochs') a.epochs = Number(argv[++i]);
    else if (k === '--lr') a.lr = Number(argv[++i]);
    else if (k === '--l2') a.l2 = Number(argv[++i]);
    else if (k === '--verbose') a.verbose = true;
    else { console.error(`Unknown arg: ${k}`); process.exit(2); }
  }
  return a;
}

const pct = (x) => `${(x * 100).toFixed(1)}%`;
const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);

async function main() {
  const args = parseArgs(process.argv);
  console.log('Desk Doodles — smart-layer region-role classifier (softmax LR, from scratch)\n');

  const rows = await loadDataset(args.dataset);
  console.log(`dataset           : ${path.relative(REPO_ROOT, args.dataset)}`);
  console.log(`examples          : ${rows.length}`);

  // classes (sorted for stable indexing)
  const classes = [...new Set(rows.map((r) => r.label))].sort();
  const classToIdx = Object.fromEntries(classes.map((c, i) => [c, i]));
  const K = classes.length;
  const classCounts = classes.map((c) => rows.filter((r) => r.label === c).length);
  console.log(`classes (${K})       : ${classes.map((c, i) => `${c}=${classCounts[i]}`).join('  ')}`);

  // ── leakage-safe shape-grouped split ───────────────────────────────────────
  const { trainIdx, testIdx, trainShapes, testShapes } = shapeGroupedSplit(rows, {
    testFraction: args.testFraction,
    seed: args.seed,
  });
  // assert disjointness (the leakage guard, proven not assumed)
  const overlap = [...trainShapes].filter((h) => testShapes.has(h));
  if (overlap.length) { console.error(`FATAL: ${overlap.length} shapes in both splits — leakage!`); process.exit(1); }

  const trainRows = trainIdx.map((i) => rows[i]);
  const testRows = testIdx.map((i) => rows[i]);
  console.log('');
  console.log(`split rule        : group by svgHash; whole shapes → train or test (no straddle)`);
  console.log(`  seed            : ${args.seed}   test fraction ${args.testFraction}`);
  console.log(`  train           : ${trainShapes.size} shapes · ${trainRows.length} regions`);
  console.log(`  test (held-out) : ${testShapes.size} shapes · ${testRows.length} regions`);
  // confirm every test class is also seen in train (else a class is unlearnable)
  const trainClassSet = new Set(trainRows.map((r) => r.label));
  const testOnly = [...new Set(testRows.map((r) => r.label))].filter((c) => !trainClassSet.has(c));
  if (testOnly.length) console.log(`  ⚠ classes in test but not train: ${testOnly.join(', ')}`);

  // ── features + standardization (fit on TRAIN only) ─────────────────────────
  const Xtrain_raw = trainRows.map(rawFeatures);
  const Xtest_raw = testRows.map(rawFeatures);
  const ytrain = trainRows.map((r) => classToIdx[r.label]);
  const ytest = testRows.map((r) => classToIdx[r.label]);
  const stdz = fitStandardizer(Xtrain_raw);
  const Xtrain = applyStandardizer(Xtrain_raw, stdz);
  const Xtest = applyStandardizer(Xtest_raw, stdz);

  // ── train ──────────────────────────────────────────────────────────────────
  console.log('\ntraining softmax LR (minibatch SGD, class-balanced, L2)…');
  const { W, classW } = trainSoftmaxLR(Xtrain, ytrain, K, {
    epochs: args.epochs, lr: args.lr, l2: args.l2, seed: `${args.seed}:sgd`, verbose: args.verbose,
  });

  // ── evaluate: held-out TEST only ───────────────────────────────────────────
  const predTest = Xtest.map((x) => argmax(predictProba(W, x)));
  const predTrain = Xtrain.map((x) => argmax(predictProba(W, x)));
  const repTest = classificationReport(ytest, predTest, classes);
  const repTrain = classificationReport(ytrain, predTrain, classes);

  // ── baselines (fit on train, scored on the SAME held-out test) ─────────────
  const majIdx = majorityBaseline(ytrain);
  const majPredTest = testRows.map(() => majIdx);
  const repMaj = classificationReport(ytest, majPredTest, classes);

  const lookupFn = buildLookupBaseline(trainRows, classToIdx);
  const lookupPredTest = testRows.map(lookupFn);
  const repLookup = classificationReport(ytest, lookupPredTest, classes);

  // ── report ──────────────────────────────────────────────────────────────────
  console.log('\n══════════════════ HELD-OUT TEST RESULTS (unseen shapes) ══════════════════\n');
  const line = (name, r) =>
    console.log(`${pad(name, 34)} acc ${padL(pct(r.accuracy), 7)}   macro-F1 ${padL(r.macroF1.toFixed(3), 6)}`);
  line('majority-class baseline', repMaj);
  line('lookup baseline (rule-style, 3 feats)', repLookup);
  line('LEARNED softmax LR (3 feats)', repTest);
  console.log(`${pad('  (train-set acc, overfit check)', 34)} acc ${padL(pct(repTrain.accuracy), 7)}   macro-F1 ${padL(repTrain.macroF1.toFixed(3), 6)}`);

  console.log('\nper-class on held-out test (learned model):');
  console.log(`  ${pad('role', 18)} ${padL('support', 8)} ${padL('prec', 6)} ${padL('recall', 7)} ${padL('f1', 6)}`);
  for (const p of repTest.perClass) {
    console.log(`  ${pad(p.name, 18)} ${padL(p.support, 8)} ${padL(p.precision.toFixed(2), 6)} ${padL(p.recall.toFixed(2), 7)} ${padL(p.f1.toFixed(2), 6)}`);
  }

  console.log('\nconfusion matrix (rows=true, cols=pred) on held-out test:');
  console.log(`  ${pad('', 18)}${classes.map((c) => padL(c.slice(0, 6), 7)).join('')}`);
  repTest.confusion.forEach((row, i) => {
    console.log(`  ${pad(classes[i], 18)}${row.map((v) => padL(v, 7)).join('')}`);
  });

  const liftMaj = repTest.accuracy - repMaj.accuracy;
  const liftLookup = repTest.accuracy - repLookup.accuracy;
  console.log('\nlift (held-out accuracy):');
  console.log(`  learned − majority baseline : ${(liftMaj >= 0 ? '+' : '') + pct(liftMaj)}`);
  console.log(`  learned − lookup baseline   : ${(liftLookup >= 0 ? '+' : '') + pct(liftLookup)}`);

  // ── write the model artifact ───────────────────────────────────────────────
  const artifact = {
    model: 'smart-layer-region-role-classifier',
    modelType: 'softmax-logistic-regression',
    version: 1,
    trainedAt: new Date().toISOString(),
    note:
      'First real trained model for the Desk Doodles smart layer. Predicts region role ' +
      'from (darknessL, log1p(area), fillStyle one-hot). Trained by minibatch SGD on ' +
      'golden role labels. Re-run tools/ml/train-region-classifier.mjs to refit as the ' +
      'dataset grows.',
    dataset: path.relative(REPO_ROOT, args.dataset),
    exampleCount: rows.length,
    classes,
    featureNames: FEATURE_NAMES,
    fillStyles: ['none', 'solid', 'hachure'],
    standardizer: stdz,
    weights: W, // K × (d+1), last col = bias; applied to STANDARDIZED features
    classWeights: classW,
    hyperparams: { epochs: args.epochs, lr: args.lr, l2: args.l2 },
    split: {
      rule: 'group-by-svgHash; whole shapes to one side (leakage-safe, no straddle)',
      seed: args.seed,
      testFraction: args.testFraction,
      trainShapes: trainShapes.size,
      testShapes: testShapes.size,
      trainRegions: trainRows.length,
      testRegions: testRows.length,
    },
    metrics: {
      heldOut: {
        accuracy: repTest.accuracy,
        macroF1: repTest.macroF1,
        perClass: repTest.perClass,
      },
      trainSet: { accuracy: repTrain.accuracy, macroF1: repTrain.macroF1 },
      baselines: {
        majorityClass: { accuracy: repMaj.accuracy, macroF1: repMaj.macroF1 },
        lookupRuleStyle: { accuracy: repLookup.accuracy, macroF1: repLookup.macroF1 },
      },
      lift: { vsMajority: liftMaj, vsLookup: liftLookup },
    },
    honesty: {
      featuresAvailable: FEATURE_NAMES,
      featuresMissingVsRuleEngine: [
        'zIndex', 'areaFractionOfParent', 'enclosesSiblingCount', 'containedInZIndex',
        'aspectRatio', 'tag', 'stroke', 'hasDasharray', 'isPartOfStripeCluster',
      ],
      labelProvenance:
        'Golden labels originated as blessed rule-engine output; labels and the rule baseline ' +
        'share an ancestor. The held-out metric still measures generalization to UNSEEN shapes.',
      metricScope: 'All headline metrics are on held-out test shapes the model never saw in training.',
    },
  };
  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, JSON.stringify(artifact, null, 2) + '\n');
  console.log(`\n✓ Wrote model artifact → ${path.relative(REPO_ROOT, args.out)}`);
  console.log('  (re-runnable: node tools/ml/train-region-classifier.mjs)');
}

main().catch((e) => { console.error(e); process.exit(1); });
