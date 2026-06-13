// Isolated vite config for the 2D audit-style sweep harness — keeps the harness
// OUT of the app's production build (app build still ships only index.html) and
// gives the .mjs driver a stable preview to dodge HMR churn from concurrent
// build fleets. Build:  npx vite build --config tools/2d/vite.sweep.config.ts
//                       --outDir /tmp/dd-2d-sweep-dist
// Preview: npx vite preview --config tools/2d/vite.sweep.config.ts
//                       --outDir /tmp/dd-2d-sweep-dist --port <uniqueport>
import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const ROOT = path.resolve(__dirname, '../..');

export default defineConfig({
  root: ROOT,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(ROOT, './src') },
  },
  build: {
    rollupOptions: {
      // The harness HTML is the SOLE entry — app index.html is excluded.
      input: path.resolve(ROOT, 'tools/2d/audit-style-sweep.html'),
    },
  },
});
