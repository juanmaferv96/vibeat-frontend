import axios from 'axios'

// Producción / preview:
// - Si defines VITE_API_BASE_URL (p. ej. https://mi-backend.com/api), se usará eso.
// - Si NO la defines, se usará '/api' relativo (ideal si sirves front+back bajo el mismo dominio).
const API_BASE_URL = (import.meta.env && import.meta.env.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
  : '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  // withCredentials: true, // activa si usas cookies/sesiones entre dominios
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
)

// Útil para construir URLs (por ejemplo, descargas de PDF):
export const buildApiUrl = (path) => {
  const p = path.startsWith('/') ? path : `/${path}`
  return API_BASE_URL.startsWith('http') ? `${API_BASE_URL}${p}` : `${API_BASE_URL}${p}`
}

export default apiClient
