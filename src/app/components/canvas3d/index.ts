// Barrel for the 3D scene components (stroke→3D round-trip, plan §2).
// Default export preserved so React.lazy(() => import('./canvas3d')) works.
export { Stroke3DScene, default } from './Stroke3DScene';
export type { Stroke3DSceneProps } from './Stroke3DScene';
// Mode types re-exported for the wiring layer's chrome pills (rod · extrude ·
// inflate; 'auto' resolves rod/extrude only — inflate is explicit).
export type { GeometryMode, GeometryModeSetting } from '../../lib/geometry3d/strokeTo3d';
