// Isolated Vite config for the render-survival battery — builds ONLY the harness
// page (render-survival-battery.html) so `vite preview` serves a static dist
// with no HMR churn fighting the active /desk + canvas3d edit zones (HMR-churn
// rule). outDir + port driven by the playwright driver via env so the build
// never collides with the app's dist or any running dev server.
//
//   npx vite build  --config tools/edge-fixtures/vite.rsb.config.ts
//   npx vite preview --config tools/edge-fixtures/vite.rsb.config.ts --port <port>

import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';

const root = path.resolve(__dirname, '../..');

export default defineConfig({
  // Build from repo root so '../../src/...' imports in the harness resolve.
  root,
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(root, './src') },
  },
  build: {
    outDir: process.env.DD_RSB_OUTDIR || '/tmp/dd-rsb-dist',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'render-survival-battery.html'),
    },
  },
});
