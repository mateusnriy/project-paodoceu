// frontend/vitest.config.ts

/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts', // Arquivo de setup para mocks globais
    // include: ['src/hooks/**/*.test.ts', 'src/components/**/*.test.tsx'], // (Removido 'include' para usar padrão)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/hooks', 'src/components', 'src/contexts'],
      exclude: [
        'src/types',
        'src/lib',
        'src/pages',
        'src/main.tsx', // (Renomeado de index.tsx)
        'src/App.tsx',
        'src/vite-env.d.ts',
        'src/**/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    // CORREÇÃO (Causa 1)
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
