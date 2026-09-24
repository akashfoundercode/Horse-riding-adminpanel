/**
 * Admin Authentication & Session Management API Service
 */
import { getBaseUrl } from '../config/api.js'

const getAuthHeaders = () => {
  const token = localStorage.getItem('turf_admin_token') || ''
  const sessionToken = localStorage.getItem('turf_session_token') || ''
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(sessionToken ? { 'x-session-token': sessionToken } : {})
  }
}

export const authApi = {
  /**
   * 1. POST /api/admin/login
   */
  async login(credentials) {
    const url = `${getBaseUrl()}/api/admin/login`
    const fallbackUrl = `${getBaseUrl()}/api/auth/admin/login`

    try {
      let res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      if (!res.ok && res.status === 404) {
        res = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        })
      }

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Authentication failed. Please verify credentials.')
      }

      const token = data.token || data.accessToken || data.sessionToken || data.jwt || ''
      const sessionToken = data.sessionToken || data.sessionId || ''
      if (token) localStorage.setItem('turf_admin_token', token)
      if (sessionToken) localStorage.setItem('turf_session_token', sessionToken)

      return data
    } catch (err) {
      console.warn('[authApi.login] Error:', err.message)
      throw err
    }
  },

  /**
   * 2. POST /api/admin/forgot-password
   */
  async forgotPassword(payload) {
    const url = `${getBaseUrl()}/api/admin/forgot-password`
    const fallbackUrl = `${getBaseUrl()}/api/auth/forgot-password`

    try {
      let res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok && res.status === 404) {
        res = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to send password reset request.')
      }
      return data
    } catch (err) {
      console.warn('[authApi.forgotPassword] Error:', err.message)
      throw err
    }
  },

  /**
   * 3. POST /api/admin/verify-otp
   */
  async verifyOtp(payload) {
    const url = `${getBaseUrl()}/api/admin/verify-otp`
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Invalid or expired OTP.')
      return data
    } catch (err) {
      console.warn('[authApi.verifyOtp] Error:', err.message)
      throw err
    }
  },

  /**
   * 4. POST /api/admin/reset-password
   */
  async resetPassword(payload) {
    const url = `${getBaseUrl()}/api/admin/reset-password`
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to reset password.')
      }
      return data
    } catch (err) {
      console.warn('[authApi.resetPassword] Error:', err.message)
      throw err
    }
  },

  /**
   * 5. GET /api/admin/me (Alias: GET /api/admin/session)
   */
  async getProfile() {
    const url = `${getBaseUrl()}/api/admin/me`
    const aliasUrl = `${getBaseUrl()}/api/admin/session`

    try {
      let res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      if (!res.ok && res.status === 404) {
        res = await fetch(aliasUrl, {
          method: 'GET',
          headers: getAuthHeaders()
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Session expired or invalid.')
      return data
    } catch (err) {
      console.warn('[authApi.getProfile] Error:', err.message)
      throw err
    }
  },

  /**
   * 6. POST /api/admin/change-password
   */
  async changePassword(payload) {
    const url = `${getBaseUrl()}/api/admin/change-password`
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to change password.')
      }
      return data
    } catch (err) {
      console.warn('[authApi.changePassword] Error:', err.message)
      throw err
    }
  },

  /**
   * 7. POST /api/admin/logout
   */
  async logout(payload = {}) {
    const url = `${getBaseUrl()}/api/admin/logout`
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      return data
    } catch (err) {
      console.warn('[authApi.logout] Note:', err.message)
      return { success: true }
    } finally {
      localStorage.removeItem('turf_admin_token')
      localStorage.removeItem('turf_session_token')
      localStorage.removeItem('turf_admin_user')
    }
  },

  /**
   * 8. GET /api/admin/sessions
   */
  async getSessions() {
    const url = `${getBaseUrl()}/api/admin/sessions`
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to fetch sessions.')
      return data
    } catch (err) {
      console.warn('[authApi.getSessions] Error:', err.message)
      throw err
    }
  },

  /**
   * 8. DELETE /api/admin/sessions/:id
   */
  async revokeSession(sessionId) {
    const url = `${getBaseUrl()}/api/admin/sessions/${sessionId}`
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to revoke session.')
      return data
    } catch (err) {
      console.warn('[authApi.revokeSession] Error:', err.message)
      throw err
    }
  }
}
