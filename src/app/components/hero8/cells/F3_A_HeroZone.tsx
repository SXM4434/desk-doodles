import { useF3AConcept } from '../../../state/F3AConceptContext';
import { F3_A_DeskScene } from './F3_A_DeskScene';
import { F3_A_ConceptComingSoon } from './F3_A_ConceptComingSoon';

// F3-A · Hero zone dispatcher (mirrors F3_B_HeroZone pattern).
//
// Reads F3-A concept context (Desk Scattered / Pegboard Horizontal / etc.)
// and routes to the matching concept component. Only desk-scattered is built;
// other concepts render F3_A_ConceptComingSoon placeholder.

export function F3_A_HeroZone() {
  const { state: concept } = useF3AConcept();
  if (concept === 'desk-scattered') {
    return <F3_A_DeskScene />;
  }
  return <F3_A_ConceptComingSoon concept={concept} />;
}
