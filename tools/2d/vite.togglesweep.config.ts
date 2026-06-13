// Isolated vite config for the 2D audit-TOGGLE sweep harness. Keeps it out of
// the app build. Build:  npx vite build --config tools/2d/vite.togglesweep.config.ts
//   --outDir /tmp/dd-toggle-dist
// Preview: npx vite preview --config tools/2d/vite.togglesweep.config.ts
//   --outDir /tmp/dd-toggle-dist --port <uniqueport>
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
    rollupOptions: { input: path.resolve(ROOT, 'tools/2d/audit-toggle-sweep.html') },
  },
});
