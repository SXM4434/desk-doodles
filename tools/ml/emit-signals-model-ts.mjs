// Emit the trained signals-only artifact as a typed TS module inside src/ (the
// tsconfig include is ["src"], so a JSON import from datasets/ won't resolve).
// RE-RUN THIS AFTER RE-TRAINING:  node tools/ml/emit-signals-model-ts.mjs
// (train-region-classifier-signals.mjs writes datasets/smart-layer.signals.model.json;
//  this copies the weights/standardizer/classes into the bundled runtime module.)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'datasets/smart-layer.signals.model.json');
const OUT = path.join(ROOT, 'src/app/lib/smartHachure/signalsModel.generated.ts');

const a = JSON.parse(fs.readFileSync(SRC, 'utf8'));
// Keep only the fields the runtime needs (weights, standardizer, classes,
// featureNames, + light metadata) — drop the bulky split/metrics/honesty blobs.
const slim = {
  model: a.model,
  modelType: a.modelType,
  version: a.version,
  trainedAt: a.trainedAt,
  classes: a.classes,
  featureNames: a.featureNames,
  standardizer: a.standardizer,
  weights: a.weights,
  heldOutAccuracy: a.metrics?.learned?.accuracy ?? a.metrics?.accuracy ?? null,
};

const banner = `// AUTO-GENERATED from datasets/smart-layer.signals.model.json
// DO NOT EDIT BY HAND. Regenerate: node tools/ml/emit-signals-model-ts.mjs
// (run after tools/ml/train-region-classifier-signals.mjs re-trains the model)
import type { LearnedSignalsArtifact } from './learnedProvider';

export const SIGNALS_MODEL: LearnedSignalsArtifact = ${JSON.stringify(slim, null, 2)} as LearnedSignalsArtifact;
`;

fs.writeFileSync(OUT, banner);
console.log(`✓ wrote ${path.relative(ROOT, OUT)}`);
console.log(`  classes: ${slim.classes.join(', ')}`);
console.log(`  features: ${slim.featureNames.length}  weights: ${slim.weights.length}×${slim.weights[0].length}  heldOutAcc: ${slim.heldOutAccuracy}`);
