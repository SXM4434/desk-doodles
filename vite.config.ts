import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
    // CRITICAL (2026-06-13): force a SINGLE React copy. Concurrent agent Vite
    // servers symlink this node_modules and share node_modules/.vite, which
    // corrupted the optimized-deps cache → "Invalid hook call / more than one
    // copy of React / null useState" → blank page on every route. dedupe makes
    // every instance resolve the one on-disk react@18, so a shared/again-stale
    // cache can't produce a second copy. (Agent servers should ALSO pass their
    // own --cacheDir; this is the belt-and-suspenders.)
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5182,
    watch: {
      // CRITICAL (2026-06-13): the dev server was watching .claude/worktrees/**,
      // so every file a background agent wrote into a worktree fired a page
      // reload on the MAIN app → with many agents the HMR module graph tore
      // (Invalid hook call / null useState / blank page) and only a server
      // restart cleared it. Ignore the worktrees (+ build/test artifacts) so
      // agent activity never touches the live dev server again.
      ignored: [
        '**/.claude/worktrees/**',
        '**/dist/**',
        '**/audit-runs/**',
        '**/node_modules/**',
      ],
    },
  },
})
