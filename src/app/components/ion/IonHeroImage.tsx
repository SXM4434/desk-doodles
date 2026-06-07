import React from 'react';
import { useGateAIonHeroBleed } from '../../state/GateAIonHeroBleedContext';

interface IonHeroImageProps {
  /** Text-column gridColumn value (e.g. '2') */
  gridColT: string;
  /** Full-bleed gridColumn value (e.g. '1 / -1') */
  gridColF: string;
  /** Fallback gridColumn when token = 'native' (from existing imageWidthState logic) */
  fallbackGridCol: string;
  /** Base wrapper style to spread before bleed overrides */
  baseStyle?: React.CSSProperties;
  children: React.ReactNode;
}

export function IonHeroImage({ gridColT, gridColF, fallbackGridCol, baseStyle, children }: IonHeroImageProps) {
  const { heroBleed } = useGateAIonHeroBleed();

  const [resolvedGridCol, bleedStyle] = ((): [string, React.CSSProperties] => {
    switch (heroBleed) {
      case 'inset':
        return [gridColT, { width: '80%', margin: '0 auto' }];
      case 'text-column':
        return [gridColT, {}];
      case 'inner-container':
        return [gridColT, {}];
      case 'content-area':
        return [gridColF, { width: '100%' }];
      case 'half-split':
        return [fallbackGridCol, {}];
      case 'bleed-right':
        return [gridColF, {
          width: 'calc(100% + var(--ion-page-margin) + var(--ion-auto-margin, 0px))',
          marginRight: 'calc(-1 * (var(--ion-page-margin) + var(--ion-auto-margin, 0px)))',
        }];
      case 'full-viewport':
        return [gridColF, {
          width: '100cqi',
          marginLeft: 'calc(-1 * var(--ion-content-left-offset))',
          marginRight: 'calc(-1 * (var(--ion-page-margin) + var(--ion-auto-margin, 0px)))',
        }];
      case 'monograph':
        return [gridColF, {
          width: 'calc(100cqi + 8px)',
          marginLeft: 'calc(-1 * var(--ion-content-left-offset) - 4px)',
          marginRight: 'calc(-1 * (var(--ion-page-margin) + var(--ion-auto-margin, 0px)) - 4px)',
        }];
      default: // 'native'
        return [fallbackGridCol, {}];
    }
  })();

  return (
    <div style={{ ...baseStyle, gridColumn: resolvedGridCol, ...bleedStyle }}>
      {children}
    </div>
  );
}
