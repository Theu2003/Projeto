import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'main.ts'),
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          preload: path.resolve(__dirname, 'preload.ts'),
        },
      },
    },
  },
  renderer: {
    root: path.resolve(__dirname, '../src'),
    build: {
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, '../src/index.html'),
        },
      },
    },
    plugins: [react()],
  },
});
