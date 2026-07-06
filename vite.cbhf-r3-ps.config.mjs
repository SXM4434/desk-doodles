import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  cacheDir: '/tmp/dd-cbhf-r3-ps',
  resolve: { alias: { '@': path.resolve(__dirname, './src') }, dedupe: ['react', 'react-dom'] },
  server: { port: 5348, strictPort: true, watch: { ignored: ['**/.claude/worktrees/**','**/dist/**','**/audit-runs/**','**/node_modules/**'] } },
});
