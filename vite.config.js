import { defineConfig } from 'vite';
import { resolve } from 'node:path';

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
        products: resolve(__dirname, 'products/index.html'),
        technology: resolve(__dirname, 'technology/index.html'),
        cases: resolve(__dirname, 'case-studies/index.html'),
        contact: resolve(__dirname, 'contact/index.html'),
      },
    },
  },
});
