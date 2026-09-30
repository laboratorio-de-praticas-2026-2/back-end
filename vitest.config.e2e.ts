import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ['test/**/*.e2e-spec.ts'],
    globals: true,
    environment: 'node',
  },
});
