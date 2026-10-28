import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Reports live in ../docs, outside the Vite root.
  server: { fs: { allow: ['..'] } },
  // Each report becomes its own lazy chunk; game files are large by nature.
  build: { chunkSizeWarningLimit: 1024 },
});
