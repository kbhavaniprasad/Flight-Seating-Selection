import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For GitHub Pages, uncomment and set `base` to your repository name,
// e.g. base: '/flight-seat-selection/'. For Vercel (root deploy) leave it as '/'.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
