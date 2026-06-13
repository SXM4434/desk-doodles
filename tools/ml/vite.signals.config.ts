// Isolated vite config for the FULL signal-vector capture harness — keeps it OUT
// of the app's production build and gives the capture-signals.mjs driver a stable
// preview to dodge HMR churn from concurrent build fleets.
// Build:   npx vite build --config tools/ml/vite.signals.config.ts --outDir /tmp/dd-ml-sig-dist
// Preview: npx vite preview --config tools/ml/vite.signals.config.ts --outDir /tmp/dd-ml-sig-dist --port 4471 --strictPort
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
      input: path.resolve(ROOT, 'tools/ml/signals-capture.html'),
    },
  },
});
