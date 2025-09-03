import axios from 'axios'

// Base de la API para producción / preview (build):
// - Si defines VITE_API_BASE_URL (p.ej. https://mi-backend.com/api), se usará eso.
// - Si NO la defines, se usará '/api' relativo (ideal si sirves front+back juntos detrás de un reverse proxy).
const ENV_BASE = import.meta.env?.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
  : '/api'

// En desarrollo con Vite + proxy, ENV_BASE debería seguir siendo '/api'.
// El proxy de Vite (vite.config.js) redirige /api -> backend real.
export const API_BASE_URL = ENV_BASE

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  // Si en el futuro usas cookies/sesiones entre dominios:
  // withCredentials: true,
})

// (Opcional) Interceptores básicos de respuesta/errores
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    // Puedes centralizar logs, toasts o redirecciones según status
    // if (err.response?.status === 401) { ... }
    return Promise.reject(err)
  }
)

// Helper para construir URLs absolutas (útil para descargas, p.ej. PDF)
export const buildApiUrl = (path) => {
  const p = path.startsWith('/') ? path : `/${path}`
  // Si API_BASE_URL es absoluta (https://...), devuelve absoluta; si es '/api', devuelve relativo.
  return API_BASE_URL.startsWith('http') ? `${API_BASE_URL}${p}` : `${API_BASE_URL}${p}`
}

export default apiClient
