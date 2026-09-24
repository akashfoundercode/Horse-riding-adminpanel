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
    // Default logged-in admin for fast pairing & instant dashboard preview
    return {
      id: "ADM-001",
      name: "Akash Superadmin",
      email: "admin@turfcontrol.com",
      role: "admin",
      roleLabel: "Super Admin",
      token: "jwt_token_sample_turf_2026",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      sessionExpiresAt: Date.now() + 1000 * 60 * 60 * 12, // 12 hours
    }
  })

  useEffect(() => {
    if (admin) {
      localStorage.setItem('turf_admin_user', JSON.stringify(admin))
    } else {
      localStorage.removeItem('turf_admin_user')
    }
  }, [admin])

  const login = (email, password) => {
    if (email && password) {
      const user = {
        id: "ADM-001",
        name: email.split('@')[0].toUpperCase(),
        email,
        role: "admin",
        roleLabel: "Super Admin",
        token: `jwt_${Math.random().toString(36).substring(2)}`,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        sessionExpiresAt: Date.now() + 1000 * 60 * 60 * 12,
      }
      setAdmin(user)
      return { success: true }
    }
    return { success: false, message: "Invalid credentials" }
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

