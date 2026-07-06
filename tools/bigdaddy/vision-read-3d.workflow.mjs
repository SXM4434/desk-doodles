export const meta = {
  name: 'ofat-3d-vision-read',
  description: 'Vision-read every 3D OFAT contact sheet, label each factor vs Clean (works/partial/broken)',
  phases: [{ title: 'VisionRead', detail: 'one agent per object contact sheet' }],
}

// args = [{ object: 'gameBoy', sheet: '/tmp/bigdaddy/gameBoy/3d/_contact.png' }, ...]
// Returns [{ object, sheetLegible, factors: [{factor, verdict, effectLevels, note}] }, ...]

const FACTORS = ['geoMode', 'style3d', 'material', 'polish', 'reflection', 'sheen', 'outline3d']

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['object', 'sheetLegible', 'factors'],
  properties: {
    object: { type: 'string' },
    sheetLegible: { type: 'boolean' },
    factors: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['factor', 'verdict', 'effectLevels', 'note'],
        properties: {
          factor: { type: 'string', enum: FACTORS },
          verdict: { type: 'string', enum: ['works', 'partial', 'broken'] },
          effectLevels: { type: 'string', description: 'which of L/M/H visibly change vs Clean, e.g. "M,H" or "none" or "L,M,H"' },
          note: { type: 'string', description: 'one concrete sentence on what the toggle does (or fails to do) vs Clean' },
        },
      },
    },
  },
}

const items = Array.isArray(args) ? args : []
log(`vision-reading ${items.length} 3D contact sheets`)

const prompt = (it) => `You are doing a 3D-fidelity vision read for an OFAT (one-factor-at-a-time) test.

Read this image with the Read tool: ${it.sheet}

It is a contact sheet for the object "${it.object}" rendered in the app's 3D mode — a grid of labeled panels. The panel labeled "clean" (top-left) is the BASELINE. The other panels are 7 one-factor 3D toggles, each at three levels L / M / H, labeled like "geoMode @L=rod", "material @M=Glossy Plastic", "polish @H=1". The 7 factors: geoMode (geometry: rod/extrude/lathe), style3d (Native/Hatch/SVG-port), material (Matte Clay/Glossy Plastic/Signal), polish, reflection, sheen, outline3d.

For EACH of the 7 factors, look at its L/M/H triple TOGETHER and compare to Clean, then verdict:
- "works" = a sensible, correct visual change with a coherent L->M->H progression (a low level looking near-Clean is FINE — subtle is expected).
- "partial" = effect present but weak/inconsistent, only at one level, or looks slightly off.
- "broken" = identical to Clean across ALL of L/M/H (no effect at any level) OR a clearly broken render (missing geometry, black blob, artifact, garbage).

IMPORTANT context: the default material is MATTE, so on the default the gloss-family toggles (polish/reflection/sheen) may legitimately show little change except at higher levels — that is honest behavior, judge it as you see it (often "partial"). Judge ONLY from the contact sheet image; do NOT open the individual PNGs (keep it fast). State which levels visibly change in effectLevels.

Return the StructuredOutput for object "${it.object}" with all 7 factors.`

const results = await pipeline(
  items,
  (it) => agent(prompt(it), { label: `vread:${it.object}`, phase: 'VisionRead', schema: SCHEMA })
    .then((r) => (r ? { ...r, object: r.object || it.object } : null)),
)

const ok = results.filter(Boolean)
log(`vision read complete: ${ok.length}/${items.length} sheets labeled`)
return ok
