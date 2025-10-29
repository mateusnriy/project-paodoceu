import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, 
    environment: 'node',
    setupFiles: ['./src/tests/setup.ts'], 
    include: ['src/tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/services/**/*.ts',
        'src/controllers/**/*.ts',
        'src/middlewares/**/*.ts',
      ],
      exclude: [
        'src/types',
        'src/dtos',
        'src/lib',
        'src/config',
        'src/routes',
        'src/app.ts',
        'src/server.ts',
        'src/validations',
        'src/tests',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
