import { useLayoutEffect } from 'react';
import { useCardFrame } from './CardFrameContext';
import { useDivider } from './DividerContext';
import { useTitleRegister } from './TitleRegisterContext';
import { useImageTreatment } from './ImageTreatmentContext';
import { useCaptionRegister } from './CaptionRegisterContext';
import { useShippedProof } from './ShippedProofContext';
import { useProofPlacement } from './ProofPlacementContext';
import { useAspectVariance } from './AspectVarianceContext';
import { useDensity } from './DensityContext';
import { useCardScale } from './CardScaleContext';
import { usePreset } from './PresetContext';

// Resets all 9 identity axes to 'native' and preset to 'custom' on mount.
// Mount in old-lab entry points (/surface, /layout, /narrow-1, /narrow-2, /combo
// index) so toggle state set in the Cards/Tiles family or Combo candidate views
// doesn't leak in and override each surface's authored baseline.
//
// Why: the 9 axis contexts + PresetContext live at App.tsx root, so state
// persists across all route navigations. Without an explicit reset on mount,
// toggles set anywhere drag into every other view.
export function useResetIdentityToggles() {
  const { setState: setCardFrame } = useCardFrame();
  const { setState: setDivider } = useDivider();
  const { setState: setTitleRegister } = useTitleRegister();
  const { setState: setImageTreatment } = useImageTreatment();
  const { setState: setCaptionRegister } = useCaptionRegister();
  const { setState: setShippedProof } = useShippedProof();
  const { setState: setProofPlacement } = useProofPlacement();
  const { setState: setAspectVariance } = useAspectVariance();
  const { setState: setDensity } = useDensity();
  const { setMode: setCardScale } = useCardScale();
  const { setPreset } = usePreset();

  useLayoutEffect(() => {
    setCardFrame('native');
    setDivider('native');
    setTitleRegister('native');
    setImageTreatment('native');
    setCaptionRegister('native');
    setShippedProof('native');
    setProofPlacement('native');
    setAspectVariance('native');
    setDensity('native');
    setCardScale('standard');
    setPreset('custom');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
