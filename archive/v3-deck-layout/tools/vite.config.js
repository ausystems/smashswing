import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const pages = ['what-is-smashswing', 'vs-traditional-sims', 'technology', 'who-its-for', 'press', 'consultation', 'contact'];

export default defineConfig({
  base: process.env.SITE_BASE || '/',
  server: { port: 5173, host: true },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        ...Object.fromEntries(pages.map((p) => [p, resolve(__dirname, `${p}/index.html`)])),
      },
    },
  },
});
