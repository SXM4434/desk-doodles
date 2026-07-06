import { defineConfig, mergeConfig } from 'vite';
import base from './vite.config.ts';

export default defineConfig(async (env) => {
  const b = typeof base === 'function' ? await base(env) : base;
  return mergeConfig(b, {
    server: { port: 5184, strictPort: true },
    cacheDir: 'node_modules/.vite-verify-5184',
  });
});
