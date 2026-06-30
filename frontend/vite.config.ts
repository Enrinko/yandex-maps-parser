import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    // Proxy API calls to the Laravel backend during local dev so the SPA shares
    // an origin and Sanctum cookie auth works without CORS friction.
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/sanctum': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
});
