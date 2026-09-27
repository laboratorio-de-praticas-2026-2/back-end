import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ['test/**/*.e2e-spec.ts'],
    globals: true,
    environment: 'node',
    env: {
      DB_DIALECT: 'mysql', // Ajuste para 'postgres', 'sqlite', etc., conforme o banco do seu projeto
      DB_HOST: 'localhost',
      DB_PORT: '3306',
      DB_USER: 'root',
      DB_PASS: 'root',
      DB_NAME: 'rotuscan_test',
    },
  },
});