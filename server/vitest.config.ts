import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths({ root: '.' })],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/__tests__/**/*.test.ts'],
    testTimeout: 30000,
    fileParallelism: false,
  },

});
