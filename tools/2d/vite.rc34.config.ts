// Isolated vite config for the RC-3/RC-4 ink-visibility sweep harness. Keeps it
// out of the app build.
//   Build:   npx vite build --config tools/2d/vite.rc34.config.ts --outDir /tmp/dd-rc34-dist
//   Preview: npx vite preview --config tools/2d/vite.rc34.config.ts --outDir /tmp/dd-rc34-dist --port <uniqueport>
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
    rollupOptions: { input: path.resolve(ROOT, 'tools/2d/rc34-sweep.html') },
  },
});
