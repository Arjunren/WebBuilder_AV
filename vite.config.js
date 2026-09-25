import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/client',
  build: { outDir: '../../dist', emptyOutDir: true },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:3000',
      '/exports': 'http://127.0.0.1:3000',
    },
  },
});
