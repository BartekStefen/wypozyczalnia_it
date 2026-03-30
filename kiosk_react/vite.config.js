import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Konfiguracja Vite — proxy API na backend Laravel.
 *
 * Proxy przekierowuje wszystkie żądania /api/* na port 8000 (Laravel artisan serve).
 * Dzięki temu axios.defaults.baseURL = '/api' działa bez CORS w środowisku dev.
 *
 * W produkcji proxy zastępuje konfiguracja nginx/Apache — /api proxy_pass do Laravel.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});