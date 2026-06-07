# Desk Doodles

Doodle what's on your desk. Flip 2D ↔ 3D. Share to a public canvas of everyone else's desk.

Designers sketch at their desks constantly — there's no shared space to make that creative habit social and visible. Desk Doodles is that space.

---

## What it does

- Draw a stroke or upload an image/SVG
- Apply real hand-drawn rendering — sketch, charcoal, stipple, risograph, etc. — controlled parametrically by ~13 axes (gap, weight, wobble, layers, ink, pressure…). Not a stamped filter.
- Flip between 2D and 3D versions of the same drawing (cached, instant)
- Publish to a shared infinite canvas where everyone else's doodles are scattered

## Built for

**[ConFigMakeathon](https://contra.com/community/topic/configmakeathon/guidelines)** — $100k prize hackathon for things built in Figma Make. Submission deadline 2026-06-18.

Building in public throughout.

## Stack

- **Build:** Figma Make + local Vite (continuous-sync via Make local-codebase beta when granted, manual paste-back checkpoint otherwise)
- **Frontend:** React + TypeScript + Tailwind v4
- **3D:** Three.js + React Three Fiber + Drei
- **Physics:** cannon-es + @react-three/cannon (pure-JS, no WASM — Rapier doesn't load reliably in Make's sandbox)
- **Drawing:** perfect-freehand for stroke smoothing, rough.js for rendering
- **Backend:** Supabase (anonymous session ID, shared global feed, no auth at MVP)
- **Mark-making engine:** Smart Hachure — parametric hand-drawn rendering, lifted from my portfolio system

## Status

In active dev (Day 5 of 14). See `git log` for the build trail.
