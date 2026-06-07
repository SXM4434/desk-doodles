import React, { createContext, useContext, useState } from 'react';

// Tag rendering style toggle. Applies across every surface candidate that
// uses the TagList atom. 'auto' = each surface renders its register-native
// style (passed as nativeMode prop); other modes force every TagList in the
// app into that explicit mode — including surfaces whose native is 'hidden'.
//   - auto          : native per-surface default
//   - pill-outline  : Ion-style rounded border chip
//   - pill-filled   : muted-bg filled chip (softer weight)
//   - slash         : inline caps separated by " / " (rachelchen / emmiwu)
//   - dot           : inline caps separated by " · " (editorial meta line)
//   - bracket       : [Tag] [Tag] inline (dossier / archival register)
//   - underline     : inline words with underline (editorial)
//   - typeTag       : single medium chip (project.typeTag only — sparse register)
//   - hidden        : suppress all TagList atoms across every surface
export type TagStyleMode =
  | 'pill-outline'
  | 'pill-filled'
  | 'slash'
  | 'dot'
  | 'bracket'
  | 'underline'
  | 'typeTag'
  | 'hidden';

export type TagStyle = TagStyleMode | 'auto';

type Ctx = { mode: TagStyle; setMode: (m: TagStyle) => void };

const TagStyleCtx = createContext<Ctx | null>(null);

export function TagStyleProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<TagStyle>('auto');
  return <TagStyleCtx.Provider value={{ mode, setMode }}>{children}</TagStyleCtx.Provider>;
}

export function useTagStyle(): Ctx {
  const v = useContext(TagStyleCtx);
  if (!v) throw new Error('useTagStyle must be used inside TagStyleProvider');
  return v;
}
