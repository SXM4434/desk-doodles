---
name: feedback-more-toggle-options-better
description: "For this portfolio project, more toggle options is always better. Default to 6+ granularity steps per toggle. Don't trim ranges for \"simplicity\" — the toggles ARE for exploration."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: ab08230a-30a0-4478-a2b1-ba5e8f6b16aa
---

User direction 2026-06-01: "modifier toggles should have 6+ range — the more the better for me to test. general rule for toggles."

**Rule:** When building any new toggle in this project, default to **6+ discrete options** (or a continuous slider). Apply to roughness, stroke width, fill gap, opacity, angle, density — any modifier that exists on a numeric or graduated axis.

**Why:** the user wants to A/B extensively across the design space. More granularity = more comparison data = better lock decisions. Trimming a toggle to 3 options to "keep chrome simple" forecloses comparison that the user wants to run.

**How to apply:**
- Don't ship "Low / Mid / High" — ship "Off · Very-low · Low · Mid-low · Mid · Mid-high · High · Very-high · Max" or similar
- For pixel values: don't ship "Tight / Loose" — ship "1 / 2 / 3 / 4 / 6 / 8 / 12 / 16" or similar
- For angles: don't ship "Default / Steep" — ship 8+ step intervals
- Sliders are also welcome when the range is continuous

**Edge cases:**
- Toggles with naturally bounded sets (on/off, yes/no) stay at 2 options — this rule applies to GRADUATED axes, not binary axes
- Conceptual modes that genuinely have only 3-4 options (e.g., card-fit has only 'current'/'compact'; nothing in between) stay at their natural count

Related: [[feedback-decision-discipline]] · [[feedback-enumerate-before-shipping]] · [[project-hero-8-f3-toggle-architecture]]
