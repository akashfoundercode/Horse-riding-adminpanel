import { createContext, useState, useEffect, useCallback, useRef } from 'react'
import { authApi } from '../services/authApi.js'
import { socketService } from '../services/socket.js'

export const AuthContext = createContext()

const STATIC_CREDENTIALS = [
  { email: 'horseracing@gmail.com', password: 'admin321', name: 'Horse Racing Admin' },
  { email: 'admin@turfcontrol.com', password: 'admin_secret_key', name: 'Turf Admin' },
]

// Default Inactivity Timeout: 30 minutes (1800000 ms)
export const getInactivityTimeoutMs = () => {
  const savedMinutes = Number(localStorage.getItem('turf_session_timeout_minutes'))
  if (savedMinutes && savedMinutes > 0) {
    return savedMinutes * 60 * 1000
  }
  return 30 * 60 * 1000 // 30 mins
}

// Session Validator: Checks if session is expired or inactive
export const isSessionValid = (adminObj) => {
  if (!adminObj || !adminObj.token) return false

  const now = Date.now()
  const timeoutMs = getInactivityTimeoutMs()
  const lastActive = Number(localStorage.getItem('turf_last_active_time'))

  // 1. Check inactivity timeout (if last active time exists and exceeded timeout)
  if (lastActive && now - lastActive > timeoutMs) {
    return false
  }

  // 2. Check JWT expiration timestamp if valid JWT token
  if (typeof adminObj.token === 'string' && adminObj.token.includes('.')) {
    try {
      const parts = adminObj.token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        if (payload.exp && payload.exp * 1000 <= now) {
          return false
        }
      }
    } catch {
      // Ignore base64 decode errors for non-JWT mock tokens
    }
  }

  // 3. Check explicit session expiration if set
  if (adminObj.sessionExpiresAt && Number(adminObj.sessionExpiresAt) <= now) {
    return false
  }

  return true
}

const savedAdmin = () => {
  try {
    const raw = localStorage.getItem('turf_admin_user')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!isSessionValid(parsed)) {
      localStorage.removeItem('turf_admin_user')
      localStorage.removeItem('turf_admin_token')
      localStorage.removeItem('turf_last_active_time')
      localStorage.setItem('turf_session_expired_notice', 'true')
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(savedAdmin)
  const [authLoading, setAuthLoading] = useState(false)
  const adminRef = useRef(admin)
  adminRef.current = admin

  // Persist to localStorage
  useEffect(() => {
    if (admin) {
      localStorage.setItem('turf_admin_user', JSON.stringify(admin))
    } else {
      localStorage.removeItem('turf_admin_user')
      localStorage.removeItem('turf_admin_token')
      localStorage.removeItem('turf_last_active_time')
    }
  }, [admin])

  // Record user activity timestamp
  const recordActivity = useCallback(() => {
    const now = Date.now()
    localStorage.setItem('turf_last_active_time', String(now))
  }, [])

  // Logout method
  const logout = useCallback(async (isAuto = false) => {
    const currentToken = adminRef.current?.token
    if (currentToken && !currentToken.startsWith('local_')) {
      try {
        await authApi.logout(currentToken)
      } catch (e) {
        // quiet fallback
      }
    }
    localStorage.removeItem('turf_admin_token')
    localStorage.removeItem('turf_admin_user')
    localStorage.removeItem('turf_last_active_time')
    if (isAuto) {
      localStorage.setItem('turf_session_expired_notice', 'true')
    }
    socketService.disconnect()
    setAdmin(null)
  }, [])

  // Inactivity & Session Expiration Tracker
  useEffect(() => {
    if (!admin) return

    // Record activity on mount
    recordActivity()

    // Throttled activity listener
    let lastRecorded = Date.now()
    const handleUserActivity = () => {
      const now = Date.now()
      // Throttle updating localStorage to every 4 seconds for 60fps performance
      if (now - lastRecorded > 4000) {
        lastRecorded = now
        recordActivity()
      }
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }))

    // Periodic Heartbeat Check (runs every 10 seconds)
    const checkInterval = setInterval(() => {
      const lastActive = Number(localStorage.getItem('turf_last_active_time')) || 0
      const timeoutMs = getInactivityTimeoutMs()

      if (Date.now() - lastActive > timeoutMs) {
        console.warn('🔒 [AuthContext] Auto logout: Inactivity timeout reached.')
        logout(true)
      }
    }, 10000)

    // Visibility / Tab Wakeup Check (When laptop wakes up or tab is re-opened after hours/days)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        const lastActive = Number(localStorage.getItem('turf_last_active_time')) || 0
        const timeoutMs = getInactivityTimeoutMs()
        if (Date.now() - lastActive > timeoutMs) {
          console.warn('🔒 [AuthContext] Auto logout: Session expired while inactive.')
          logout(true)
        } else {
          handleUserActivity()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityOrFocus)
    window.addEventListener('focus', handleVisibilityOrFocus)

    // Cross-tab logout listener
    const handleStorageChange = (e) => {
      if (e.key === 'turf_admin_user' && !e.newValue) {
        setAdmin(null)
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleUserActivity))
      clearInterval(checkInterval)
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
      window.removeEventListener('focus', handleVisibilityOrFocus)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [admin, recordActivity, logout])

  // On mount: verify token with /me if session is still valid
  useEffect(() => {
    const stored = savedAdmin()
    if (!stored?.token) return
    authApi.me(stored.token)
      .then((data) => {
        const fresh = data?.admin || data?.user || data
        if (fresh?.email) {
          setAdmin((prev) => ({ ...prev, ...fresh, token: stored.token }))
          localStorage.setItem('turf_admin_token', stored.token)
          recordActivity()
        }
      })
      .catch(() => {
        // Token expired on server
        logout(true)
      })
  }, [logout, recordActivity])

  const login = async (email, password) => {
    setAuthLoading(true)
    localStorage.removeItem('turf_session_expired_notice')
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
      recordActivity()
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
        recordActivity()
        setAdmin(adminUser)
        return { success: true }
      }
      return { success: false, message: apiErr.message || 'Invalid email or password.' }
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ admin, login, logout, authLoading, isAuthenticated: !!admin, recordActivity }}>
      {children}
    </AuthContext.Provider>
  )
}
