import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      // Silence structured logs during tests — errors still surface via thrown exceptions
      LOG_LEVEL: 'error',
    },
  },
});
