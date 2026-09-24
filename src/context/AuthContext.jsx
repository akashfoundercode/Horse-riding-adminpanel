import { createContext, useState, useEffect } from 'react'
import { authApi } from '../services/authApi.js'
import { socketService } from '../services/socket.js'

export const AuthContext = createContext()

const STATIC_CREDENTIALS = [
  { email: 'horseracing@gmail.com', password: 'admin321', name: 'Horse Racing Admin' },
  { email: 'admin@turfcontrol.com', password: 'admin_secret_key', name: 'Turf Admin' },
]

const savedAdmin = () => {
  try { return JSON.parse(localStorage.getItem('turf_admin_user')) } catch { return null }
}

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(savedAdmin)
  const [authLoading, setAuthLoading] = useState(false)

  // Persist to localStorage
  useEffect(() => {
    if (admin) localStorage.setItem('turf_admin_user', JSON.stringify(admin))
    else localStorage.removeItem('turf_admin_user')
  }, [admin])

  // On mount: verify token with /me, refresh admin data
  useEffect(() => {
    const stored = savedAdmin()
    if (!stored?.token) return
    authApi.me(stored.token)
      .then((data) => {
        const fresh = data?.admin || data?.user || data
        if (fresh?.email) {
          setAdmin((prev) => ({ ...prev, ...fresh, token: stored.token }))
          localStorage.setItem('turf_admin_token', stored.token)
        }
      })
      .catch(() => {
        // token expired — keep local session, don't force logout
      })
  }, [])

  const login = async (email, password) => {
    setAuthLoading(true)
    try {
      // Try real API first
      const data = await authApi.login(email, password)
      const token = data?.token || data?.accessToken || data?.data?.token
      const user = data?.admin || data?.user || data?.data || {}
      const adminUser = {
        id: user.id || 'ADM-001',
        name: user.name || user.username || email.split('@')[0],
        email: user.email || email,
        role: user.role || 'admin',
        roleLabel: user.roleLabel || 'Super Admin',
        token,
        avatar: user.avatar || user.profileImage || null,
        sessionExpiresAt: Date.now() + 1000 * 60 * 60 * 12,
      }
      setAdmin(adminUser)
      localStorage.setItem('turf_admin_token', token)
      // reconnect socket with fresh token
      socketService.connect('https://horseracing.siberiancrane.tech', token)
      return { success: true }
    } catch (apiErr) {
      // Fallback: static credentials
      const match = STATIC_CREDENTIALS.find(
        (c) => c.email.toLowerCase() === email.toLowerCase() && c.password === password
      )
      if (match) {
        const adminUser = {
          id: 'ADM-001',
          name: match.name,
          email: match.email,
          role: 'admin',
          roleLabel: 'Super Admin',
          token: `local_${Math.random().toString(36).substring(2)}`,
          avatar: null,
          sessionExpiresAt: Date.now() + 1000 * 60 * 60 * 12,
        }
        setAdmin(adminUser)
        return { success: true }
      }
      return { success: false, message: apiErr.message || 'Invalid email or password.' }
    } finally {
      setAuthLoading(false)
    }
  }

  const logout = async () => {
    if (admin?.token) await authApi.logout(admin.token)
    localStorage.removeItem('turf_admin_token')
    socketService.disconnect()
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, login, logout, authLoading, isAuthenticated: !!admin }}>
      {children}
    </AuthContext.Provider>
  )
}
