import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// For GitHub Pages, uncomment and set `base` to your repository name,
// e.g. base: '/flight-seat-selection/'. For Vercel (root deploy) leave it as '/'.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Expose only this public backend origin from the unprefixed Vercel
    // variable. Avoid exposing every API_* environment variable to the client.
    define: {
      'import.meta.env.API_BASE_URL': JSON.stringify(env.API_BASE_URL || process.env.API_BASE_URL || ''),
    },
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
  };
});
