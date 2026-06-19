import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5152',
      '/health': 'http://localhost:5152',
    },
  },
  test: {
    environment: 'jsdom',
  },
});
