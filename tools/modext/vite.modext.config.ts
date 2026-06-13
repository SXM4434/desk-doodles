// Isolated build config for the modext 2D break-hunt harness — keeps the build
// out of the active app dist so concurrent build fleets don't churn it (the
// MODIFIER-EXTREME sweep's isolated-preview rule). Builds ONLY the harness page.
import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

const root = path.resolve(__dirname, '../..');

export default defineConfig({
  root,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(root, './src') },
  },
  build: {
    outDir: '/tmp/modext-dist',
    emptyOutDir: true,
    rollupOptions: {
      input: { modext: path.resolve(root, 'tools/modext/modext.html') },
    },
  },
});
