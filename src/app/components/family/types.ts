import type { CardFrameMode } from '../../state/CardFrameContext';
import type { DividerMode } from '../../state/DividerContext';
import type { TitleRegisterMode } from '../../state/TitleRegisterContext';
import type { ImageTreatmentMode } from '../../state/ImageTreatmentContext';
import type { CaptionRegisterMode } from '../../state/CaptionRegisterContext';
import type { ShippedProofMode } from '../../state/ShippedProofContext';
import type { ProofPlacementMode } from '../../state/ProofPlacementContext';
import type { AspectVarianceMode } from '../../state/AspectVarianceContext';
import type { DensityMode } from '../../state/DensityContext';
import type { ShellId } from '../../state/ShellPickerContext';

export type Family = 'cards' | 'tiles';

export type Axis =
  | 'cardFrame'
  | 'divider'
  | 'titleRegister'
  | 'imageTreatment'
  | 'captionRegister'
  | 'shippedProof'
  | 'proofPlacement'
  | 'aspectVariance'
  | 'density';

export type AxisValueByAxis = {
  cardFrame: CardFrameMode;
  divider: DividerMode;
  titleRegister: TitleRegisterMode;
  imageTreatment: ImageTreatmentMode;
  captionRegister: CaptionRegisterMode;
  shippedProof: ShippedProofMode;
  proofPlacement: ProofPlacementMode;
  aspectVariance: AspectVarianceMode;
  density: DensityMode;
};

export type AxisSpec<A extends Axis> =
  | { fixed: true; value: AxisValueByAxis[A] }
  | { fixed: false; baseline: AxisValueByAxis[A] };

export type SurfaceAttrs = {
  id: string;
  family: Family;
  label: string;
  workingName: string;
  scanStrategy: string;
  identitySummary: string;
  featuredShell: ShellId;
  standardShell: ShellId;
  attributes: {
    cardFrame: AxisSpec<'cardFrame'>;
    divider: AxisSpec<'divider'>;
    titleRegister: AxisSpec<'titleRegister'>;
    imageTreatment: AxisSpec<'imageTreatment'>;
    captionRegister: AxisSpec<'captionRegister'>;
    shippedProof: AxisSpec<'shippedProof'>;
    proofPlacement: AxisSpec<'proofPlacement'>;
    aspectVariance: AxisSpec<'aspectVariance'>;
    density: AxisSpec<'density'>;
  };
};

export const AXES: Axis[] = [
  'cardFrame',
  'divider',
  'titleRegister',
  'imageTreatment',
  'captionRegister',
  'shippedProof',
  'proofPlacement',
  'aspectVariance',
  'density',
];

export const AXIS_LABEL: Record<Axis, string> = {
  cardFrame: 'Card frame',
  divider: 'Divider',
  titleRegister: 'Title register',
  imageTreatment: 'Image treatment',
  captionRegister: 'Caption register',
  shippedProof: 'Shipped proof',
  proofPlacement: 'Proof placement',
  aspectVariance: 'Aspect variance',
  density: 'Density',
};
