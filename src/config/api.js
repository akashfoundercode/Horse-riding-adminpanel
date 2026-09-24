/**
 * 🌐 CENTRALIZED SERVER & WEBSOCKET CONFIGURATION 🌐
 * Single Source of Truth for the Entire Application.
 * 
 * 👉 AGAR URL BADALNA HO: Sirf yahan 'BASE_SERVER_URL' ko change karein.
 * Har API, Socket, Images aur Pages me automatic apply ho jayega!
 */

// ⚡ YAHAN APNA MAIN BACKEND DOMAIN / URL RAKHEIN ⚡
export const BASE_SERVER_URL = 'https://horseracing.siberiancrane.tech'

export const DEFAULT_API_URL = BASE_SERVER_URL
export const DEFAULT_SOCKET_URL = BASE_SERVER_URL

/**
 * Get active Base URL for all REST API calls
 */
export const getBaseUrl = () => {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
  const localUrl = localStorage.getItem('turf_api_url') || localStorage.getItem('turf_socket_url')

  if (localUrl && localUrl.includes('localhost')) {
    localStorage.removeItem('turf_api_url')
    localStorage.removeItem('turf_socket_url')
    return BASE_SERVER_URL
  }

  let base = localUrl || envUrl || BASE_SERVER_URL
  base = base.trim().replace(/\/+$/, '')
  if (base.endsWith('/api')) {
    base = base.slice(0, -4)
  }
  return base
}

/**
 * Get active WebSocket URL for live Socket.io connections
 */
export const getSocketUrl = () => {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOCKET_URL
  const localUrl = localStorage.getItem('turf_socket_url') || localStorage.getItem('turf_api_url')

  if (localUrl && localUrl.includes('localhost')) {
    localStorage.removeItem('turf_socket_url')
    localStorage.removeItem('turf_api_url')
    return BASE_SERVER_URL
  }

  let base = localUrl || envUrl || BASE_SERVER_URL
  return base.trim().replace(/\/+$/, '')
}

/**
 * Change URL across the entire application dynamically at runtime
 */
export const updateServerUrl = (newUrl) => {
  if (!newUrl) return
  let clean = newUrl.trim().replace(/\/+$/, '')
  if (clean.endsWith('/api')) {
    clean = clean.slice(0, -4)
  }
  localStorage.setItem('turf_api_url', clean)
  localStorage.setItem('turf_socket_url', clean)
  return clean
}

/**
 * Reset URL back to default BASE_SERVER_URL
 */
export const resetServerUrlToDefault = () => {
  localStorage.removeItem('turf_api_url')
  localStorage.removeItem('turf_socket_url')
  return BASE_SERVER_URL
}
