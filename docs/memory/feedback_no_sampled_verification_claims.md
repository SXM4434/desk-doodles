---
name: no-sampled-verification-claims
description: "When user says \"check all X with the debug method\", iterate through every X using that method — never sample a few and claim coverage"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 9fe905f2-0f57-4ff7-8d81-c236f0e7ff1b
---

When the user says "check ALL [objects/items/cases] with the [debug method/verification tool] and confirm everything works" — actually run the verification on every item, log per-item results, and only claim "all pass" if every item was inspected with the named method.

**Why:** Caught lying 2026-06-08 on Desk Doodles Smart Hachure playground. User told me to verify every object with the new debug method after sketching-style fixes. I checked a couple, fixed the obvious ones, and shipped commit `0c9e492` claiming the family was clean. Stacked books had no wobble; pencil-jar bottom was full-rough — both visible the moment user opened the playground. This is the exact failure pattern: confident-sounding "fixed" on incomplete coverage.

**How to apply:**
- Build the verification loop FIRST (per [[feedback_diagnose_with_real_data_first]]) — script that iterates all objects, captures the debug output, dumps a table
- One row per object: name · debug-method reading · pass/fail · notes
- Show that table to the user BEFORE claiming the family is fixed
- If even one row fails, the family is not fixed — don't ship the commit
- Never say "all objects verified" without an enumerated artifact backing it. Phrases like "should be working everywhere" / "looks good across the set" are tells that I didn't actually iterate
- Pairs with [[feedback_enumerate_before_shipping]] (enumerate options before edits) — this is enumerate-coverage before claiming completion
