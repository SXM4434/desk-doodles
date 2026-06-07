// F3-B pin slate — shared by Trophy Wall and Floating Canvas concepts.
// Single source of truth for the 7 pin positions, shapes, and click actions.
// Both Path 1 (3D) and Path 2 (SVG) coordinates live here.
//
// Coordinates are MESSY-SCATTERED 2026-05-29 per user direction: clusters
// (pairs of close pins), gaps (stretches of empty space), no strict L/R
// alternation. Goal = "messy desk where items got placed randomly," not
// rhythmic columns or zigzag lists.

export type F3BPinId =
  | 'elaraSketch'
  | 'loveLetter'
  | 'polaroidGF'
  | 'runningPin'
  | 'postcardColombia'
  | 'pokemonCard'
  | 'boardingPass';

export type F3BClickAction =
  | { kind: 'case-study'; slug: string }
  | { kind: 'about'; anchor: string }
  | { kind: 'external'; href: string }
  | { kind: 'easter-egg'; label: string };

export type F3BPinShape2D = 'framed-rect' | 'paper' | 'polaroid' | 'disc-flat' | 'postcard' | 'card' | 'boarding-pass';

export type F3BPinShape3D = 'box' | 'cylinder' | 'thin-box';

export type F3BPin = {
  id: F3BPinId;
  label: string;
  caption: string;
  shape2D: F3BPinShape2D;
  shape3D: F3BPinShape3D;
  // SVG (Path 2) positioning
  top: number;          // px from top of scatter area
  leftPct: number;      // % from left edge of column (0–100)
  // 3D (Path 1) positioning
  x3D: number;
  y3D: number;
  size3D: [number, number, number];
  // Shared rotation (degrees; both paths scale this by tilt-range toggle)
  tilt: number;
  action: F3BClickAction;
};

// Messy scatter v3 2026-05-29 — TRUE corner-to-corner spread.
// Pins push from leftPct 4 to 78 (column SVG); x3D from -2.0 to +2.3 (3D).
// Plus orthographic zoom reduced to 50 (was 60) so the 3D canvas shows
// more world units → pin coords map to MORE of the visible canvas width.
//
// Vertical pattern: rough thirds (top / mid / lower / bottom) with pins
// NOT aligned in rows — some pairs across diagonal, some near each other
// vertically but FAR horizontally.
export const F3B_PINS: F3BPin[] = [
  {
    id: 'elaraSketch',
    label: 'Framed Elara sketch',
    caption: 'Process artifact · case study →',
    shape2D: 'framed-rect', shape3D: 'box',
    top: 25, leftPct: 4,
    x3D: -2.0, y3D: 3.5, size3D: [1.5, 1.1, 0.10],
    tilt: -5,
    action: { kind: 'case-study', slug: 'elara' },
  },
  {
    id: 'loveLetter',
    label: 'Love letter',
    caption: 'for her · tap to read',
    shape2D: 'paper', shape3D: 'thin-box',
    top: 90, leftPct: 62,
    x3D: 1.7, y3D: 3.0, size3D: [1.0, 1.3, 0.05],
    tilt: 9,
    action: { kind: 'easter-egg', label: 'love-letter' },
  },
  {
    id: 'polaroidGF',
    label: 'Polaroid',
    caption: 'with M · road trip',
    shape2D: 'polaroid', shape3D: 'box',
    top: 260, leftPct: 28,
    x3D: -0.8, y3D: 1.5, size3D: [0.95, 1.15, 0.06],
    tilt: -11,
    action: { kind: 'easter-egg', label: 'polaroid-gf' },
  },
  {
    id: 'runningPin',
    label: 'Race medal',
    caption: 'on Strava →',
    shape2D: 'disc-flat', shape3D: 'cylinder',
    top: 200, leftPct: 78,
    x3D: 2.3, y3D: 2.2, size3D: [0.42, 0.42, 0.12],
    tilt: 6,
    action: { kind: 'external', href: 'https://strava.com' },
  },
  {
    id: 'postcardColombia',
    label: 'Postcard · Cartagena',
    caption: 'roots · Colombia + USA',
    shape2D: 'postcard', shape3D: 'thin-box',
    top: 430, leftPct: 8,
    x3D: -1.8, y3D: -0.5, size3D: [1.7, 1.05, 0.05],
    tilt: -3,
    action: { kind: 'about', anchor: 'roots' },
  },
  {
    id: 'pokemonCard',
    label: 'Pokémon trading card',
    caption: 'inner child',
    shape2D: 'card', shape3D: 'thin-box',
    top: 400, leftPct: 68,
    x3D: 1.8, y3D: 0.2, size3D: [0.9, 1.3, 0.05],
    tilt: 7,
    action: { kind: 'easter-egg', label: 'pokemon' },
  },
  // Big gap, then lone item at bottom — center
  {
    id: 'boardingPass',
    label: 'Boarding pass · BOG→JFK',
    caption: 'trip reveal',
    shape2D: 'boarding-pass', shape3D: 'thin-box',
    top: 740, leftPct: 42,
    x3D: 0.0, y3D: -3.0, size3D: [1.8, 0.75, 0.04],
    tilt: -6,
    action: { kind: 'easter-egg', label: 'boarding-pass' },
  },
];

export const F3B_SCATTER_HEIGHT = 870;

export function describeF3BAction(a: F3BClickAction): string {
  switch (a.kind) {
    case 'case-study': return `case-study:${a.slug}`;
    case 'about': return `about:${a.anchor}`;
    case 'external': return `external:${a.href}`;
    case 'easter-egg': return `easter-egg:${a.label}`;
  }
}
