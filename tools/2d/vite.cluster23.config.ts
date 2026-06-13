// Isolated vite config for the Cluster 2+3 toggle sweep harness — keeps it OUT
// of the app's production build and gives the .mjs driver a stable preview.
// Build:   npx vite build --config tools/2d/vite.cluster23.config.ts --outDir /tmp/dd-c23-dist
// Preview: npx vite preview --config tools/2d/vite.cluster23.config.ts --outDir /tmp/dd-c23-dist --port <uniqueport>
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
      input: path.resolve(ROOT, 'tools/2d/cluster23-sweep.html'),
    },
  },
});
