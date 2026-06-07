import React from 'react';
import { Page1120 } from '../layouts/PageInset';

// Held Surface-mode layout: T1-L1 Classical Anchor Grid geometry.
// Full-width Featured on top, 3-col Standard grid below, gap 24, rowGap 32.
// Geometry is held. Featured shell (FH-A vs FH-B) is a per-candidate Axis B
// attribute — declared inside each candidate file.
export function SurfacePage({
  featured,
  standards,
}: {
  featured: React.ReactNode;
  standards: React.ReactNode[];
}) {
  return (
    <Page1120>
      <div style={{ marginBottom: 48 }}>{featured}</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          rowGap: 32,
        }}
      >
        {standards.map((s, i) => (
          <React.Fragment key={i}>{s}</React.Fragment>
        ))}
      </div>
    </Page1120>
  );
}
