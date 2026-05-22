import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/** Vitest config — resolves the `@/` path alias used across src/. */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
