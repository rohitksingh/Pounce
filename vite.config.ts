import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Pounce/', // GitHub Pages base path (must match repository name)
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    sourcemap: false
  },
  server: {
    port: 5173,
    strictPort: true, // Fail if port is occupied instead of trying next port
    open: false
  }
});
