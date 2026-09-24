const getBaseUrl = () => {
  let base = localStorage.getItem('turf_api_url') || localStorage.getItem('turf_socket_url') || 'http://localhost:3000'
  return base.trim().replace(/\/+$/, '').replace(/\/api$/, '')
}

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

const parseJson = async (res) => {
  try {
    const text = await res.text()
    return text ? JSON.parse(text) : {}
  } catch {
    return { success: false, message: `HTTP ${res.status}` }
  }
}

export const authApi = {
  // POST /api/admin/auth/login
  async login(email, password) {
    const res = await fetch(`${getBaseUrl()}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await parseJson(res)
    if (!res.ok) throw new Error(data.message || 'Login failed')
    return data
  },

  // GET /api/admin/auth/me
  async me(token) {
    const res = await fetch(`${getBaseUrl()}/api/admin/auth/me`, {
      method: 'GET',
      headers: authHeaders(token),
    })
    const data = await parseJson(res)
    if (!res.ok) throw new Error(data.message || 'Unauthorized')
    return data
  },

  // POST /api/admin/auth/logout
  async logout(token) {
    try {
      await fetch(`${getBaseUrl()}/api/admin/auth/logout`, {
        method: 'POST',
        headers: authHeaders(token),
      })
    } catch {
      // best-effort
    }
  },

  // POST /api/admin/auth/forgot-password
  async forgotPassword(email) {
    const res = await fetch(`${getBaseUrl()}/api/admin/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await parseJson(res)
    if (!res.ok) throw new Error(data.message || 'Request failed')
    return data
  },

  // POST /api/admin/auth/reset-password
  async resetPassword(token, newPassword) {
    const res = await fetch(`${getBaseUrl()}/api/admin/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    })
    const data = await parseJson(res)
    if (!res.ok) throw new Error(data.message || 'Reset failed')
    return data
  },
}
