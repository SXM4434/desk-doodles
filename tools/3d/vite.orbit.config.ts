// Isolated vite config for the CATALOG ORBIT tool (see catalog-orbit.html).
// Same pattern as vite.catalog3d.config.ts — the tool can run live-dev for
// interactive use OR be built statically for headless driving (no HMR reload
// destroying the driver's execution context).
//
//   LIVE:    npx vite --config tools/3d/vite.orbit.config.ts --port 4489
//            → http://localhost:4489/tools/3d/catalog-orbit.html
//   FROZEN:  npx vite build   --config tools/3d/vite.orbit.config.ts --outDir /tmp/dd-orbit-dist
//            npx vite preview --config tools/3d/vite.orbit.config.ts --outDir /tmp/dd-orbit-dist --port 4497
//            → drive with ORBIT_URL=http://localhost:4497/tools/3d/catalog-orbit.html
import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const ROOT = path.resolve(__dirname, '../..');

export default defineConfig({
  root: ROOT,
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(ROOT, './src') } },
  server: {
    // Never watch agent worktrees (project_desk_doodles_hmr_worktree_watch_crash).
    watch: { ignored: ['**/.claude/**', '**/node_modules/**'] },
  },
  build: {
    rollupOptions: { input: path.resolve(ROOT, 'tools/3d/catalog-orbit.html') },
  },
});
