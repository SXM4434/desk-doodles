import React from 'react';
import { useGateAIonFinalImageWidth } from '../../state/GateAIonFinalImageWidthContext';

interface IonFinalImageProps {
  /** IMG WIDTH fallback style (from existing imgStyle in shell) */
  fallbackStyle?: React.CSSProperties;
  /** twStyle — text column constraint, used for 'text-column' token */
  twStyle?: React.CSSProperties;
  children: React.ReactNode;
}

export function IonFinalImage({ fallbackStyle, twStyle, children }: IonFinalImageProps) {
  const { finalImageWidth } = useGateAIonFinalImageWidth();

  const wrapperStyle = ((): React.CSSProperties => {
    switch (finalImageWidth) {
      case 'text-column':
        return twStyle ?? {};
      case 'inner-container':
        return twStyle ?? {};
      case 'content-area':
        return {};
      case 'partial-bleed':
        return {
          width: 'calc(100% + var(--ion-page-margin) / 2)',
          marginRight: 'calc(-1 * var(--ion-page-margin) / 2)',
        };
      case 'near-bleed':
        return {
          width: 'calc(100% + var(--ion-page-margin) + var(--ion-auto-margin, 0px) - 8px)',
          marginRight: 'calc(-1 * (var(--ion-page-margin) + var(--ion-auto-margin, 0px)) + 4px)',
          marginLeft: 4,
        };
      case 'bleed-right':
        return {
          width: 'calc(100% + var(--ion-page-margin) + var(--ion-auto-margin, 0px))',
          marginRight: 'calc(-1 * (var(--ion-page-margin) + var(--ion-auto-margin, 0px)))',
        };
      case 'full-viewport':
        return {
          width: '100cqi',
          marginLeft: 'calc(-1 * var(--ion-content-left-offset))',
          marginRight: 'calc(-1 * (var(--ion-page-margin) + var(--ion-auto-margin, 0px)))',
        };
      case 'panoramic':
        return {
          width: '130cqi',
          marginLeft: 'calc(-1 * var(--ion-content-left-offset) - 15cqi)',
          marginRight: 'calc(-1 * (var(--ion-page-margin) + var(--ion-auto-margin, 0px)) - 15cqi)',
          overflow: 'hidden',
        };
      default: // 'native'
        return fallbackStyle ?? {};
    }
  })();

  return <div style={wrapperStyle}>{children}</div>;
}
