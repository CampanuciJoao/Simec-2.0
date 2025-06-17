// Ficheiro: vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Importa o módulo 'path' do Node.js

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Define um alias: '@' irá apontar para o diretório 'src'
      '@': path.resolve(__dirname, './src'),
    },
  },
});