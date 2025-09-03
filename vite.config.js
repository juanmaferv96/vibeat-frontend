import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Define dónde está tu backend EN DESARROLLO.
// Puedes sobreescribir con: VITE_DEV_API_TARGET=http://192.168.1.163:8080
const DEV_API_TARGET = process.env.VITE_DEV_API_TARGET || 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // 0.0.0.0 (disponible en tu LAN)
    port: 5173,
    proxy: {
      '/api': {
        target: DEV_API_TARGET,
        changeOrigin: true,
        secure: false,
        // Eliminar la cabecera Origin para evitar que el backend aplique CORS en DEV
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin')
          })
        },
      },
    },
  },
})
