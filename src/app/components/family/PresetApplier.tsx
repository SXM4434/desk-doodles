import { useEffect } from 'react';
import { usePreset } from '../../state/PresetContext';
import { useCardFrame } from '../../state/CardFrameContext';
import { useDivider } from '../../state/DividerContext';
import { useTitleRegister } from '../../state/TitleRegisterContext';
import { useImageTreatment } from '../../state/ImageTreatmentContext';
import { useCaptionRegister } from '../../state/CaptionRegisterContext';
import { useShippedProof } from '../../state/ShippedProofContext';
import { useProofPlacement } from '../../state/ProofPlacementContext';
import { useAspectVariance } from '../../state/AspectVarianceContext';
import { useDensity } from '../../state/DensityContext';
import { SURFACE_BY_ID } from './surfaceAttributes';
import type { Family } from './types';

// Preset cascade — watches the PresetContext and pushes the selected preset's
// 9 identity-axis values into the 9 axis contexts. 'custom' resets each axis
// to 'native' so the toggles drive the render. Must be mounted inside the
// scope that owns the family (FamilyGallery for /cards · /tiles, and the
// LabShell toolbar for narrow-2 with a family selected).
export function PresetApplier({ family }: { family: Family }) {
  const { preset } = usePreset();
  const { setState: setCardFrame } = useCardFrame();
  const { setState: setDivider } = useDivider();
  const { setState: setTitleRegister } = useTitleRegister();
  const { setState: setImageTreatment } = useImageTreatment();
  const { setState: setCaptionRegister } = useCaptionRegister();
  const { setState: setShippedProof } = useShippedProof();
  const { setState: setProofPlacement } = useProofPlacement();
  const { setState: setAspectVariance } = useAspectVariance();
  const { setState: setDensity } = useDensity();

  useEffect(() => {
    if (preset === 'custom') {
      setCardFrame('native');
      setDivider('native');
      setTitleRegister('native');
      setImageTreatment('native');
      setCaptionRegister('native');
      setShippedProof('native');
      setProofPlacement('native');
      setAspectVariance('native');
      setDensity('native');
      return;
    }
    const attrs = SURFACE_BY_ID[preset];
    if (!attrs || attrs.family !== family) {
      // Cross-family mismatch (e.g. Tiles preset still selected when the Cards
      // family mounts) or unknown preset: reset every axis to native so the
      // prior family's cascaded state can't bleed through.
      setCardFrame('native');
      setDivider('native');
      setTitleRegister('native');
      setImageTreatment('native');
      setCaptionRegister('native');
      setShippedProof('native');
      setProofPlacement('native');
      setAspectVariance('native');
      setDensity('native');
      return;
    }
    const resolve = <T,>(spec: { fixed: true; value: T } | { fixed: false; baseline: T }): T =>
      spec.fixed ? spec.value : spec.baseline;
    setCardFrame(resolve(attrs.attributes.cardFrame));
    setDivider(resolve(attrs.attributes.divider));
    setTitleRegister(resolve(attrs.attributes.titleRegister));
    setImageTreatment(resolve(attrs.attributes.imageTreatment));
    setCaptionRegister(resolve(attrs.attributes.captionRegister));
    setShippedProof(resolve(attrs.attributes.shippedProof));
    setProofPlacement(resolve(attrs.attributes.proofPlacement));
    setAspectVariance(resolve(attrs.attributes.aspectVariance));
    setDensity(resolve(attrs.attributes.density));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, family]);

  return null;
}
