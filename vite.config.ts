import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        menuview: resolve(__dirname, 'src/menuview/index.html'),
        loadview: resolve(__dirname, 'src/loadview/index.html'),
        createview: resolve(__dirname, 'src/createview/index.html'),
        checkview: resolve(__dirname, 'src/checkview/index.html'),
      },
    },
  },
  server: {
    port: 5173,
  },
});
