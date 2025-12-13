import { defineConfig } from 'vite';

export default defineConfig({
  // Set base to your repository name for GitHub Pages
  // Change '/claude-test/' to match your repo name
  base: process.env.NODE_ENV === 'production' ? '/claude-test/' : '/',

  root: 'public',

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // Generate sourcemaps for debugging
    sourcemap: true,
  },

  server: {
    port: 3000,
    open: true,
  },
});
