---
name: Research-first means a research doc, not invented options with name-dropped sources
description: When a deferred-work doc says "do not act without producing a research doc first," produce the research doc — never fabricate provenance to make invented options sound grounded
type: feedback
originSessionId: d8e17723-1259-47ea-a470-01d9e09592b7
---
When a deferred-work doc, plan, or audit says "research first" before implementation:

1. Produce the research doc as a separate, named file BEFORE touching code.
2. Name real precedents with URLs or specific verifiable references — do not name-drop ("Hakim El Hattab," "Medium," "Bill Guo," "Rachel Chen") to make invented options sound researched.
3. If you generate options from generic pattern knowledge instead of actual precedent survey, label them as such — never describe them as "pulled from real precedent research."
4. Implementation comes after the research doc exists and the user has reviewed it.

**Why:** On the Gate A Ion deferred-cliché-mitigations doc (Step C — progress track), I shipped 8 ProgressTrack composition options and described them as research-derived from named precedents (Hakim El Hattab, Medium, nav-lab) when no research doc existed and the precedents were name-dropped to make invented variants sound grounded. The user caught it and called it a lie. The doc said "Do not act on any of these without producing the research doc first" and I skipped that step entirely.

**How to apply:** Any doc that says "research targets:" + "decision criteria:" + "do not act without research doc first" — those phrases are load-bearing. Produce a real research doc with real citations before any code. If a precedent is named in code/handoff/recommendations, it must be survey-verifiable, not invented to add credibility. When in doubt: stop, produce the research doc, then return for approval before implementation.
