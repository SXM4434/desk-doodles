import React, { createContext, useContext, useState } from 'react';

/**
 * Media Frame — lab-wide screenshot/media framing toggle.
 *
 * Opened 2026-05-25 as B3 step of the W1-D Dark Companion lab sequence.
 * Plan doc §7 surface #5 (screenshot framing) + Q3 decision (framed
 * over dimmed/native). Driven by W1-D walkthrough observation that
 * light-content screenshots float against the dark page ground without
 * a visible boundary — `--dir-recessed` alone (only ~2.5 L* below bg)
 * is insufficient containment.
 *
 * States:
 *   - `none`     (default) — no frame change. Preserves current Ion §02
 *                            and other media renders. Lab opens here so
 *                            existing screenshots/captures aren't affected.
 *   - `hairline`            — adds 1px `--dir-border` to the media wrapper.
 *                            Quiet structural containment, ~3:1 non-text
 *                            contrast against bg in both themes. Sanctioned
 *                            use of `--dir-border` per W1 spec ("default
 *                            border / divider"). Effective in dark mode;
 *                            near-invisible in light (the screenshot's own
 *                            dark chat panel already provides edge against
 *                            the light page).
 *   - `mat`                 — added 2026-05-25 after the user's W1-D walk
 *                            observation that hairline reads as no-op in
 *                            light. Adds an outer padded wrapper of
 *                            `--dir-recessed` + hairline border. The visible
 *                            frame is carried by LAYOUT (padding mat), not
 *                            by contrast — works symmetrically across both
 *                            themes regardless of the underlying palette's
 *                            low-chroma quiet-border tradeoff. Heavier touch:
 *                            compresses the image's effective render area by
 *                            the mat thickness.
 *
 * Boundary: this toggle is lab chrome only — no production toggle wiring,
 * no `prefers-color-scheme` coupling. Default first paint stays `none`.
 */
export type MediaFrameMode = 'none' | 'hairline' | 'mat';

type ContextValue = {
  state: MediaFrameMode;
  setState: (v: MediaFrameMode) => void;
};

const MediaFrameContext = createContext<ContextValue>({
  state: 'none',
  setState: () => {},
});

export function MediaFrameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MediaFrameMode>('none');
  return (
    <MediaFrameContext.Provider value={{ state, setState }}>
      {children}
    </MediaFrameContext.Provider>
  );
}

export function useMediaFrame() {
  return useContext(MediaFrameContext);
}
