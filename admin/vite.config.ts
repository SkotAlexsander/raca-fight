/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const dominio = fileURLToPath(new URL('../app/dominio', import.meta.url));

/**
 * O Admin importa o domínio do app (`../app/dominio`) por apelido, sem copiar
 * (03-arquitetura/05-ADMIN.md, seção 3). `server.fs.allow` deixa o Vite servir
 * a pasta irmã.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@dominio': dominio },
  },
  server: {
    port: 5174,
    strictPort: true,
    fs: { allow: ['..'] },
  },
  preview: { port: 4174, strictPort: true },
  build: {
    target: 'es2023',
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testes/preparar.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    pool: 'threads',
    // um arquivo por vez: nesta máquina (um pente de RAM) quatro jsdom juntos não sobem a tempo
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
