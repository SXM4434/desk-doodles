import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  F3_PEGBOARD_SUBJECTS,
  F3_TROPHY_WALL_SUBJECTS,
  F3_A_DESK_SUBJECTS,
  type F3SubjectId,
  type F3PegboardShapeId,
  type F3TrophyWallShapeId,
} from '../components/hero8/cells/f3CoreIdentitySet';

// F3 per-subject form choice — one pick per subject, per concept.
//
// User direction 2026-05-31: "everything as toggle options ... I should have an
// off option for each item as well." Replaces F3VisibilityContext for
// concepts that have CIS form catalogs (currently Pegboard, Trophy Wall,
// Floating Canvas + F3-A horizontal desk).
//
// Three state slots:
//   - pegboard   → F3-B Pegboard concept
//   - trophyWall → F3-B Trophy Wall concept + F3-B Floating Canvas (shared catalog)
//   - f3aDesk    → F3-A horizontal desk concept (uses F3PegboardShapeId catalog,
//                  renders as 3D primitives instead of SVG)
//
// Per project memory `family-a-vs-b-perceptual-frame` — F3-A and Pegboard
// share the SHAPE CATALOG (mechanical pencil = mechanical pencil regardless
// of family) but have SEPARATE state because positions / defaults / which
// subjects are default-on may differ per family.

export type F3PegboardFormChoice = 'off' | F3PegboardShapeId;
export type F3TrophyWallFormChoice = 'off' | F3TrophyWallShapeId;
export type F3DeskFormChoice = 'off' | F3PegboardShapeId; // F3-A desk uses Pegboard shape catalog

export type F3PegboardFormsState = Record<F3SubjectId, F3PegboardFormChoice>;
export type F3TrophyWallFormsState = Record<F3SubjectId, F3TrophyWallFormChoice>;
export type F3DeskFormsState = Record<F3SubjectId, F3DeskFormChoice>;

function defaultPegboardForms(): F3PegboardFormsState {
  const out = {} as F3PegboardFormsState;
  F3_PEGBOARD_SUBJECTS.forEach((subj) => {
    out[subj.id] = subj.defaultForm ?? subj.forms[0].shape;
  });
  return out;
}

function defaultTrophyWallForms(): F3TrophyWallFormsState {
  const out = {} as F3TrophyWallFormsState;
  F3_TROPHY_WALL_SUBJECTS.forEach((subj) => {
    if (subj.defaultOff) {
      out[subj.id] = 'off';
    } else {
      out[subj.id] = subj.defaultForm ?? subj.forms[0].shape;
    }
  });
  return out;
}

function defaultDeskForms(): F3DeskFormsState {
  const out = {} as F3DeskFormsState;
  F3_A_DESK_SUBJECTS.forEach((subj) => {
    if (subj.defaultOff) {
      out[subj.id] = 'off';
    } else {
      out[subj.id] = subj.defaultForm ?? subj.forms[0].shape;
    }
  });
  return out;
}

type Ctx = {
  pegboard: F3PegboardFormsState;
  setPegboardForm: (subjectId: F3SubjectId, choice: F3PegboardFormChoice) => void;
  trophyWall: F3TrophyWallFormsState;
  setTrophyWallForm: (subjectId: F3SubjectId, choice: F3TrophyWallFormChoice) => void;
  f3aDesk: F3DeskFormsState;
  setF3ADeskForm: (subjectId: F3SubjectId, choice: F3DeskFormChoice) => void;
};

const F3SubjectFormsCtx = createContext<Ctx | null>(null);

export function F3SubjectFormsProvider({ children }: { children: ReactNode }) {
  const [pegboard, setPegboard] = useState<F3PegboardFormsState>(defaultPegboardForms);
  const [trophyWall, setTrophyWall] = useState<F3TrophyWallFormsState>(defaultTrophyWallForms);
  const [f3aDesk, setF3ADesk] = useState<F3DeskFormsState>(defaultDeskForms);
  const setPegboardForm = (subjectId: F3SubjectId, choice: F3PegboardFormChoice) => {
    setPegboard((prev) => ({ ...prev, [subjectId]: choice }));
  };
  const setTrophyWallForm = (subjectId: F3SubjectId, choice: F3TrophyWallFormChoice) => {
    setTrophyWall((prev) => ({ ...prev, [subjectId]: choice }));
  };
  const setF3ADeskForm = (subjectId: F3SubjectId, choice: F3DeskFormChoice) => {
    setF3ADesk((prev) => ({ ...prev, [subjectId]: choice }));
  };
  return (
    <F3SubjectFormsCtx.Provider value={{ pegboard, setPegboardForm, trophyWall, setTrophyWallForm, f3aDesk, setF3ADeskForm }}>
      {children}
    </F3SubjectFormsCtx.Provider>
  );
}

export function useF3SubjectForms(): Ctx {
  const v = useContext(F3SubjectFormsCtx);
  if (!v) throw new Error('useF3SubjectForms must be used inside F3SubjectFormsProvider');
  return v;
}
