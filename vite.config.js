import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Carga variables .env.* (sin prefijo por conveniencia)
  const env = loadEnv(mode, process.cwd(), '')

  // Backend al que proxyear en DESARROLLO:
  // Por defecto localhost:8080; sobreescribe con VITE_DEV_API_TARGET
  // ej.: VITE_DEV_API_TARGET=http://192.168.1.50:8080
  const DEV_API_TARGET = env.VITE_DEV_API_TARGET || 'http://localhost:8080'

  // Servir en 0.0.0.0 para que sea accesible desde cualquier equipo de la red
  const HOST = env.VITE_HOST || '0.0.0.0'
  const PORT = Number(env.VITE_PORT || 5173)

  return {
    plugins: [react()],
    server: {
      host: HOST,
      port: PORT,
      proxy: {
        '/api': {
          target: DEV_API_TARGET,
          changeOrigin: true,
          secure: false,
          // Elimina la cabecera Origin -> el backend no aplica CORS en dev
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin')
            })
          },
        },
      },
    },
  }
})

