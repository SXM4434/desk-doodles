import type { ShellId } from '../../state/ShellPickerContext';

// Native shell mapping per layout. When ShellPicker is in 'native' mode the
// renderer picks these shells for the layout's Featured and Standard slots.
//
// featured: ShellId | null — null = layout has no Featured anchor slot
// standard: ShellId          — shell used for the grid / shelf / column slots
// reserve?: { slotIdx: number; shell: ShellId } — layout-specific reserve
//   slot override (e.g. T2-L1 has an FV-A reserve at slot index 1).
//
// Rules honored from docs/locked/project-card-system.md:
//   - FH-B primary, FH-A proof-light fallback
//   - FV-A only in wider reserve slots (\u2265 2/3 container width)
//   - SV-A default standard; SV-B only in explicit whole-grid proof register
//   - SH-A Row list-mode only

export type NativeShellForLayout = {
  featured: ShellId | null;
  standard: ShellId;
  reserve?: { slotIdx: number; shell: ShellId };
};

export const NATIVE_SHELL_FOR_LAYOUT: Record<string, NativeShellForLayout> = {
  't1-l1': { featured: 'FH-B', standard: 'SV-A' },
  't1-l2': { featured: 'FH-B', standard: 'SH-A-Row' },
  't1-l3': { featured: 'FH-B', standard: 'SV-A' },
  't1-l4': { featured: 'FH-B', standard: 'SV-A' },

  't2-l1': { featured: 'FH-B', standard: 'SV-A', reserve: { slotIdx: 1, shell: 'FV-A' } },
  't2-l2': { featured: 'FH-B', standard: 'SV-A' },
  't2-l3': { featured: 'FH-B', standard: 'SV-A' },
  't2-l4': { featured: 'FH-B', standard: 'SV-A' },

  't3-l1': { featured: 'FH-B', standard: 'SV-A' },
  't3-l2': { featured: 'FH-B', standard: 'SV-A' },
  't3-l3': { featured: 'FH-A', standard: 'SV-A' },
  't3-l4': { featured: 'FH-B', standard: 'SV-A' },

  't4-l1': { featured: 'FH-A', standard: 'SV-A' },
  't4-l2': { featured: 'FH-A', standard: 'SV-A' },
  't4-l3': { featured: 'FH-A', standard: 'SV-A' },
  't4-l4': { featured: 'FH-B', standard: 'SV-A' },

  't5a-l1': { featured: null, standard: 'SV-A' },
  't5a-l2': { featured: 'FH-A', standard: 'SV-A' },
  't5a-l3': { featured: 'FH-A', standard: 'SV-A' },
  't5a-l4': { featured: 'FH-A', standard: 'SV-A' },
  't5a-l5': { featured: 'FH-A', standard: 'SV-A' },
  't5a-l6': { featured: 'FH-B', standard: 'SV-B' },
  't5a-l7': { featured: 'FH-A', standard: 'SV-A' },
  't5a-l8': { featured: null, standard: 'SH-A-Row' },
  't5a-l9': { featured: 'FH-A', standard: 'SH-A-Row' },

  't5b-l1': { featured: null, standard: 'SV-A' },
  't5b-l2': { featured: null, standard: 'SV-A' },
  't5b-l3': { featured: null, standard: 'SV-A' },
  't5b-l4': { featured: 'FH-A', standard: 'SV-A' },
  't5b-l5': { featured: null, standard: 'SV-A' },
  't5b-l6': { featured: 'FH-A', standard: 'SV-A' },

  't5c-l1': { featured: null, standard: 'SV-A' },
  't5c-l2': { featured: null, standard: 'SV-A' },
  't5c-l3': { featured: 'FH-A', standard: 'SV-A' },
  't5c-l4': { featured: null, standard: 'SV-A' },
  't5c-l5': { featured: null, standard: 'SV-A' },
  't5c-l6': { featured: 'FH-A', standard: 'SV-A' },
};
