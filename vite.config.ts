import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
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
