import React from 'react';
import { useGateAIonBodyImageWidth } from '../../state/GateAIonBodyImageWidthContext';

interface IonBodyImageProps {
  /** IMG WIDTH fallback style (from existing imgStyle in shell) */
  fallbackStyle?: React.CSSProperties;
  /** twStyle — text column constraint, used for 'text-column' token */
  twStyle?: React.CSSProperties;
  children: React.ReactNode;
}

export function IonBodyImage({ fallbackStyle, twStyle, children }: IonBodyImageProps) {
  const { bodyImageWidth } = useGateAIonBodyImageWidth();

  const wrapperStyle = ((): React.CSSProperties => {
    switch (bodyImageWidth) {
      case 'inset':
        return { width: '70%' };
      case 'text-column':
        return twStyle ?? {};
      case 'art-book':
        return { width: '115%', marginLeft: '-7.5%' };
      case 'inner-container':
        return twStyle ?? {};
      case 'science-double':
        return { maxWidth: 693 };
      case 'content-area':
        return {};
      case 'partial-bleed':
        return {
          width: 'calc(100% + var(--ion-page-margin) / 2)',
          marginRight: 'calc(-1 * var(--ion-page-margin) / 2)',
        };
      case 'bleed-right':
        return {
          width: 'calc(100% + var(--ion-page-margin) + var(--ion-auto-margin, 0px))',
          marginRight: 'calc(-1 * (var(--ion-page-margin) + var(--ion-auto-margin, 0px)))',
        };
      default: // 'native'
        return fallbackStyle ?? {};
    }
  })();

  return <div style={wrapperStyle}>{children}</div>;
}
