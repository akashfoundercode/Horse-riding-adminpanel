import { createContext, useContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('turf_admin_user')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        return null
      }
    }
    return null
  })

  useEffect(() => {
    if (admin) {
      localStorage.setItem('turf_admin_user', JSON.stringify(admin))
    } else {
      localStorage.removeItem('turf_admin_user')
    }
  }, [admin])

  const STATIC_CREDENTIALS = [
    { email: 'horseracing@gmail.com', password: 'admin321', name: 'Horse Racing Admin' },
    { email: 'admin@turfcontrol.com', password: 'admin_secret_key', name: 'Turf Admin' },
  ]

  const login = (email, password) => {
    const match = STATIC_CREDENTIALS.find(
      (c) => c.email.toLowerCase() === email.toLowerCase() && c.password === password
    )
    if (match) {
      const user = {
        id: "ADM-001",
        name: match.name,
        email: match.email,
        role: "admin",
        roleLabel: "Super Admin",
        token: `jwt_${Math.random().toString(36).substring(2)}`,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        sessionExpiresAt: Date.now() + 1000 * 60 * 60 * 12,
      }
      setAdmin(user)
      return { success: true }
    }
    return { success: false, message: 'Invalid email or password.' }
  }

  const logout = () => {
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, login, logout, isAuthenticated: !!admin }}>
      {children}
    </AuthContext.Provider>
  )
}

