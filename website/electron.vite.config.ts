import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  main: {
    build: {
      outDir: 'dist/main',
      lib: {
        entry: 'electron/main.ts',
        formats: ['es'],
      },
      externalizeDeps: true,
    },
  },
  preload: {
    build: {
      outDir: 'dist/preload',
      lib: {
        entry: 'electron/preload.ts',
        formats: ['es'],
      },
      externalizeDeps: true,
    },
  },
  renderer: {
    plugins: [react()],
    root: '.',
    build: {
      outDir: 'dist/renderer',
      rollupOptions: {
        input: 'index.html',
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 3000,
    },
  },
});