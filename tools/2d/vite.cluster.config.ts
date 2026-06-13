// Isolated vite config for the 2D toggle-cluster sweep harness — keeps the
// harness OUT of the app's production build and gives the .mjs driver a stable
// preview to dodge HMR churn from concurrent build fleets.
// Build:   npx vite build --config tools/2d/vite.cluster.config.ts --outDir /tmp/dd-2d-cluster-dist
// Preview: npx vite preview --config tools/2d/vite.cluster.config.ts --outDir /tmp/dd-2d-cluster-dist --port <uniqueport>
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
      input: path.resolve(ROOT, 'tools/2d/toggle-cluster-sweep.html'),
    },
  },
});
