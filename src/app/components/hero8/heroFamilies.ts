import type { ComponentType } from 'react';
import { F3_A_HeroZone } from './cells/F3_A_HeroZone';
import { F3_B_HeroZone } from './cells/F3_B_HeroZone';
import { HeroComposition_TBD } from './cells/HeroComposition_TBD';

export type FFamilyId = 'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6' | 'f7' | 'f8';
export type LayoutFamilyId = 'a' | 'b';

export const F_FAMILY_IDS: FFamilyId[] = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'];
export const LAYOUT_FAMILY_IDS: LayoutFamilyId[] = ['a', 'b'];

export type CellStatus = 'active' | 'pending' | 'inactive';

export type FFamilyMeta = {
  id: FFamilyId;
  label: string;
  workingName: string;
  thesis: string;
};

export const F_FAMILIES: FFamilyMeta[] = [
  { id: 'f1', label: 'F1', workingName: 'TBD', thesis: 'Type-led / editorial. Working name placeholder until F1 research opens.' },
  { id: 'f2', label: 'F2', workingName: 'TBD', thesis: 'Workspace screen-led. Working name placeholder until F2 research opens.' },
  { id: 'f3', label: 'F3', workingName: 'Desk / Workbench', thesis: 'Identity surfaced through scattered, hover-discoverable desk objects. First reference F-family — proves the lab + build pipeline. F3-A.md carries the research.' },
  { id: 'f4', label: 'F4', workingName: 'TBD', thesis: 'Live-lab interactive. Working name placeholder until F4 research opens.' },
  { id: 'f5', label: 'F5', workingName: 'TBD', thesis: 'Hero diagram / system map. Working name placeholder until F5 research opens.' },
  { id: 'f6', label: 'F6', workingName: 'TBD', thesis: 'Process / motion clip. Working name placeholder until F6 research opens.' },
  { id: 'f7', label: 'F7', workingName: 'TBD', thesis: 'Stat / outcome-led. Working name placeholder until F7 research opens.' },
  { id: 'f8', label: 'F8', workingName: 'TBD', thesis: 'Identity-aside dense. Working name placeholder until F8 research opens.' },
];

export type LayoutFamilyMeta = {
  id: LayoutFamilyId;
  label: string;
  workingName: string;
  thesis: string;
};

export const LAYOUT_FAMILIES: LayoutFamilyMeta[] = [
  { id: 'a', label: 'Family A', workingName: 'Anchored Work Field · horizontal band', thesis: 'Hero band above the work field — F-family composition replaces the band placeholder. Cards run below in the version-specific composition.' },
  { id: 'b', label: 'Family B', workingName: 'Identity + Work Field · vertical column', thesis: 'Vertical identity column beside the work column — F-family composition replaces the identity aside.' },
];

// Lookup: returns the hero zone component for a given cell. Family layout
// owns the cards + work-field; this component owns ONLY the hero zone.
export const HERO_BY_KEY: Record<`${FFamilyId}/${LayoutFamilyId}`, ComponentType> = {
  'f1/a': HeroComposition_TBD, 'f1/b': HeroComposition_TBD,
  'f2/a': HeroComposition_TBD, 'f2/b': HeroComposition_TBD,
  'f3/a': F3_A_HeroZone,       'f3/b': F3_B_HeroZone,
  'f4/a': HeroComposition_TBD, 'f4/b': HeroComposition_TBD,
  'f5/a': HeroComposition_TBD, 'f5/b': HeroComposition_TBD,
  'f6/a': HeroComposition_TBD, 'f6/b': HeroComposition_TBD,
  'f7/a': HeroComposition_TBD, 'f7/b': HeroComposition_TBD,
  'f8/a': HeroComposition_TBD, 'f8/b': HeroComposition_TBD,
};

export const CELL_STATUS_BY_KEY: Record<`${FFamilyId}/${LayoutFamilyId}`, CellStatus> = {
  'f1/a': 'inactive', 'f1/b': 'inactive',
  'f2/a': 'inactive', 'f2/b': 'inactive',
  'f3/a': 'active',   'f3/b': 'active',
  'f4/a': 'inactive', 'f4/b': 'inactive',
  'f5/a': 'inactive', 'f5/b': 'inactive',
  'f6/a': 'inactive', 'f6/b': 'inactive',
  'f7/a': 'inactive', 'f7/b': 'inactive',
  'f8/a': 'inactive', 'f8/b': 'inactive',
};

export function getHeroComponent(f: FFamilyId, l: LayoutFamilyId): ComponentType {
  return HERO_BY_KEY[`${f}/${l}`];
}

export function getCellStatus(f: FFamilyId, l: LayoutFamilyId): CellStatus {
  return CELL_STATUS_BY_KEY[`${f}/${l}`];
}

export function isFFamilyId(s: string): s is FFamilyId {
  return (F_FAMILY_IDS as string[]).includes(s);
}

export function isLayoutFamilyId(s: string): s is LayoutFamilyId {
  return s === 'a' || s === 'b';
}

export function getFFamilyMeta(id: FFamilyId): FFamilyMeta {
  return F_FAMILIES.find((f) => f.id === id)!;
}

export function getLayoutFamilyMeta(id: LayoutFamilyId): LayoutFamilyMeta {
  return LAYOUT_FAMILIES.find((l) => l.id === id)!;
}
