import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // Permite usar 'describe', 'it', 'expect' globalmente
    environment: 'node',
    // Arquivo de setup para rodar antes de cada teste (ex: limpar DB)
    setupFiles: ['./src/tests/setup.ts'], 
    include: ['src/tests/**/*.test.ts'], // Padrão de nomenclatura dos testes
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
        // Mínimo de 90% para novos módulos (DRS)
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});

