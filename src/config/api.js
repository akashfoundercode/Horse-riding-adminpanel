/**
 * Centralized API & Server Configuration
 * Single Source of Truth for all Backend API and Socket endpoints
 */

export const BASE_BACKEND_URL = 'https://horseracing.siberiancrane.tech'

export const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('turf_api_url')
    if (custom && custom.trim()) {
      let base = custom.trim().replace(/\/+$/, '')
      if (base.endsWith('/api')) base = base.slice(0, -4)
      return base
    }
  }

  // Use relative path "" so Vercel / Vite proxy handles it with 0 CORS issues
  return ''
}

export const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('turf_socket_url') || localStorage.getItem('turf_api_url')
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '')
    }
  }
  return BASE_BACKEND_URL
}
