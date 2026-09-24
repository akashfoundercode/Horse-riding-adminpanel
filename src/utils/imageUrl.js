/**
 * Centralized Dynamic Image URL Resolver
 * Dynamically resolves relative paths, server uploads, and localhost/production domains.
 */

export const getBaseServerUrl = () => {
  let base = localStorage.getItem('turf_api_url') || localStorage.getItem('turf_socket_url') || 'https://horseracing.siberiancrane.tech/'
  base = base.trim().replace(/\/+$/, '')
  if (base.endsWith('/api')) {
    base = base.slice(0, -4)
  }
  return base
}

const DEFAULT_FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=300&auto=format&fit=crop&q=80'

export function resolveImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return DEFAULT_FALLBACK_AVATAR
  }

  const trimmed = url.trim()
  if (!trimmed) return DEFAULT_FALLBACK_AVATAR

  // 1. Data URLs & Blob URLs (from local file uploads)
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed
  }

  // 2. Placeholder dummy domains (e.g. your-domain.com, example.com) -> auto replace with current active server domain
  if (trimmed.includes('your-domain.com') || trimmed.includes('example.com') || trimmed.includes('my-game-domain.com')) {
    try {
      const parsed = new URL(trimmed)
      const serverBase = getBaseServerUrl()
      return `${serverBase}${parsed.pathname}${parsed.search}`
    } catch {
      // fallback
    }
  }

  // 3. Absolute http / https URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  // 4. Relative paths from backend (e.g. /assets/horses/horse-7.png or uploads/horses/1.jpg)
  const serverBase = getBaseServerUrl()
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return `${serverBase}${cleanPath}`
}

