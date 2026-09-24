const getBaseUrl = () => {
  let base = localStorage.getItem('turf_api_url') || localStorage.getItem('turf_socket_url') || 'https://horseracing.siberiancrane.tech/'
  base = base.trim().replace(/\/+$/, '')
  if (base.endsWith('/api')) {
    base = base.slice(0, -4)
  }
  return base
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('turf_admin_token') || localStorage.getItem('turf_user_token') || ''
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

export const userApi = {
  /**
   * 1. POST /api/games/initialize
   * Initialize or get game session for the user
   */
  async initializeGame(payload = {}) {
    const url = `${getBaseUrl()}/api/games/initialize`
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to initialize game')
      return data
    } catch (err) {
      console.warn('[userApi.initializeGame] Error:', err.message)
      throw err
    }
  },

  /**
   * 2. GET /api/games/me
   * Get logged-in user's active game code and session
   */
  async getMyGame() {
    const url = `${getBaseUrl()}/api/games/me`
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to fetch user game')
      return data
    } catch (err) {
      console.warn('[userApi.getMyGame] Error:', err.message)
      throw err
    }
  },

  /**
   * 3. GET /api/games/users (Fallback: /api/games/all, /api/users)
   * Fetch all users with game codes, role, and wallet details
   */
  async getAll(params = {}) {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search)
    if (params.limit) query.append('limit', params.limit)
    if (params.page) query.append('page', params.page)
    if (params.status && params.status !== 'all') query.append('status', params.status)

    const queryString = query.toString() ? `?${query.toString()}` : ''
    const endpoints = [
      `${getBaseUrl()}/api/games/users${queryString}`,
      `${getBaseUrl()}/api/games/all${queryString}`,
      `${getBaseUrl()}/api/users${queryString}`
    ]

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders(),
        })
        if (res.ok) {
          const data = await res.json()
          return data
        }
      } catch (e) {
        // Continue fallback
      }
    }

    throw new Error('Failed to fetch users from all game/user endpoints')
  },

  /**
   * 4. GET /api/users/:id
   */
  async getById(id) {
    const url = `${getBaseUrl()}/api/users/${id}`
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || `Failed to fetch user #${id}`)
      return data
    } catch (err) {
      console.warn('[userApi.getById] Fetch error:', err.message)
      throw err
    }
  },

  /**
   * 5. GET /api/users/game-code/:gameCode
   */
  async getByGameCode(gameCode) {
    const url = `${getBaseUrl()}/api/users/game-code/${encodeURIComponent(gameCode)}`
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || `Failed to fetch user with game code ${gameCode}`)
      return data
    } catch (err) {
      console.warn('[userApi.getByGameCode] Fetch error:', err.message)
      throw err
    }
  },

  /**
   * 6. POST /api/users
   */
  async create(userData) {
    const url = `${getBaseUrl()}/api/users`
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to create user')
      return data
    } catch (err) {
      console.warn('[userApi.create] Fetch error:', err.message)
      throw err
    }
  },

  /**
   * 7. PUT /api/users/:id
   */
  async update(id, userData) {
    const url = `${getBaseUrl()}/api/users/${id}`
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || `Failed to update user #${id}`)
      return data
    } catch (err) {
      console.warn('[userApi.update] Fetch error:', err.message)
      throw err
    }
  },

  /**
   * 8. POST /api/users/:id/game-code
   */
  async generateGameCode(id) {
    const url = `${getBaseUrl()}/api/users/${id}/game-code`
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || `Failed to generate game code for user #${id}`)
      return data
    } catch (err) {
      console.warn('[userApi.generateGameCode] Fetch error:', err.message)
      throw err
    }
  },

  /**
   * 9. DELETE /api/users/:id
   */
  async delete(id) {
    const url = `${getBaseUrl()}/api/users/${id}`
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || `Failed to delete user #${id}`)
      return data
    } catch (err) {
      console.warn('[userApi.delete] Fetch error:', err.message)
      throw err
    }
  }
}

export default userApi
