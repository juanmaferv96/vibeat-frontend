import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // necesario para exponer en red
    proxy: {
      '/api': {
        target: 'http://192.168.1.163:8080',
        changeOrigin: true
      }
    }
  }
});
