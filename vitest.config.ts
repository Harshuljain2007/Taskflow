import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': import.meta.dirname,
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: [
      path.join(import.meta.dirname, 'server/**/*.test.ts'),
      path.join(import.meta.dirname, 'src/**/*.test.ts'),
      path.join(import.meta.dirname, 'firestore.rules.test.ts'),
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
    },
  },
});
