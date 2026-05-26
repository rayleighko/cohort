import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

/** Vitest config — resolves the `@/` path alias used across src/. */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environmentMatchGlobs: [
      ['src/components/**/*.{test,spec}.tsx', 'jsdom'],
    ],
  },
});
