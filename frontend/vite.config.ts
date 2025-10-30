// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // <<< CORREÇÃO: Importar path

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // CORREÇÃO (Causa 1)
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Configuração do Vitest (movida para seu próprio arquivo)
});
