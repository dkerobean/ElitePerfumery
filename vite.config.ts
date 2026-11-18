import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Two pages: "/" (Black Friday landing) and "/shop/" (catalogue).
// Each builds to its own index.html, so /shop works on any static host with no rewrites.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        shop: resolve(__dirname, 'shop/index.html'),
        catalog: resolve(__dirname, 'catalog/index.html'), // /catalog → redirects to /shop/
      },
    },
  },
});
