import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/ProjetFE/' : '/',
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d-compat']
  }
});