// Isolated Vite config for the security battery — builds ONLY the harness page
// (tools/security/security-battery.html) so `vite preview` serves a static dist
// with no HMR churn fighting the active /desk + canvas3d edit zones.
//
//   npx vite build  --config tools/security/vite.security.config.ts
//   npx vite preview --config tools/security/vite.security.config.ts --port <port>
//
// outDir + port are driven by the playwright driver via env so the build never
// collides with the app's own dist or any running dev server.

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
    outDir: process.env.DD_SEC_OUTDIR || '/tmp/dd-sec-dist',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'security-battery.html'),
    },
  },
  // Tailwind plugin intentionally omitted — the harness uses inline styles only,
  // so we avoid pulling the app's full CSS pipeline into the isolated build.
});
