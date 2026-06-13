// Isolated vite config for the CATALOG VISUAL 3D sweep harness. Builds the
// harness page STATICALLY so the sweep previews against a frozen snapshot of
// Stroke3DScene (no HMR page-reload destroying the driver's execution context —
// the crash mode when a concurrent agent edits the 3D scene live). This is the
// "vite build + preview, unique port" path the native-material audit requires.
//
//   npx vite build   --config tools/3d/vite.catalog3d.config.ts --outDir /tmp/dd-cat3d-dist
//   npx vite preview --config tools/3d/vite.catalog3d.config.ts --outDir /tmp/dd-cat3d-dist --port 4491
// then point the driver at it:
//   VIS_URL=http://localhost:4491/tools/3d/catalog-visual-3d.html node tools/3d/catalog-visual-3d.mjs
import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const ROOT = path.resolve(__dirname, '../..');

export default defineConfig({
  root: ROOT,
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(ROOT, './src') } },
  build: {
    rollupOptions: { input: path.resolve(ROOT, 'tools/3d/catalog-visual-3d.html') },
  },
});
