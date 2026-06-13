// Throwaway vite config for the geomode 3D audit — HMR DISABLED so the harness
// page (whose top-level non-component exports trip Fast Refresh into a
// page-reload loop) loads ONCE and stays stable while Playwright drives it.
// Isolated from the shared :4495 dev server that concurrent agents churn.
// READ-ONLY audit tool config; never imported by the app.
import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, '../../src') } },
  root: path.resolve(__dirname, '../../'),
  server: { port: 4498, strictPort: true, hmr: false, watch: { ignored: ['**/*'] } },
});
