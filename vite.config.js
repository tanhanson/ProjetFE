import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/ProjetFE/' : '/',
  ssr: {
    noExternal: ['@dimforge/rapier3d-compat']
  }
});