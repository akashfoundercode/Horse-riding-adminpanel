const getBaseUrl = () => {
  let base = localStorage.getItem('turf_api_url') || localStorage.getItem('turf_socket_url') || 'http://localhost:3000'
  base = base.trim().replace(/\/+$/, '')
  if (base.endsWith('/api')) {
    base = base.slice(0, -4)
  }
  return base
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('turf_admin_token') || ''
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

const parseJson = async (res) => {
  try {
    const text = await res.text()
    return text ? JSON.parse(text) : {}
  } catch (e) {
    return { success: false, message: `HTTP ${res.status}: ${res.statusText || 'Parse error'}` }
  }
}

export const betApi = {
  /**
   * 1. GET /api/bets/live-ledger (with fallback to /api/bets/live)
   * @param {Object} params - { game_serial, raceId, limit, page, status }
   */
  async getLiveLedger(params = {}) {
    const query = new URLSearchParams()
    if (params.game_serial) query.append('game_serial', params.game_serial)
    if (params.gameSerial) query.append('game_serial', params.gameSerial)
    if (params.raceId) query.append('raceId', params.raceId)
    if (params.limit) query.append('limit', params.limit)
    if (params.page) query.append('page', params.page)
    if (params.status && params.status !== 'all' && params.status !== 'All') {
      query.append('status', params.status.toUpperCase())
    }

    const queryString = query.toString() ? `?${query.toString()}` : ''
    const primaryUrl = `${getBaseUrl()}/api/bets/live-ledger${queryString}`
    const fallbackUrl = `${getBaseUrl()}/api/bets/live${queryString}`

    try {
      const res = await fetch(primaryUrl, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        return await parseJson(res)
      }
      if (res.status === 404) {
        // Fallback to /api/bets/live
        const fallbackRes = await fetch(fallbackUrl, {
          method: 'GET',
          headers: getAuthHeaders(),
        })
        if (fallbackRes.ok) {
          return await parseJson(fallbackRes)
        }
      }
      const data = await parseJson(res)
      throw new Error(data.message || `HTTP ${res.status}: Failed to fetch live ledger`)
    } catch (err) {
      console.warn('[betApi.getLiveLedger] Fetch error:', err.message)
      throw err
    }
  },

  /**
   * 2. GET /api/bets (History / All Bets)
   */
  async getAllBets(params = {}) {
    const query = new URLSearchParams()
    if (params.limit) query.append('limit', params.limit)
    if (params.page) query.append('page', params.page)
    if (params.status && params.status !== 'all') query.append('status', params.status)
    if (params.game_serial) query.append('game_serial', params.game_serial)

    const queryString = query.toString() ? `?${query.toString()}` : ''
    const url = `${getBaseUrl()}/api/bets${queryString}`

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      const data = await parseJson(res)
      if (!res.ok) throw new Error(data.message || 'Failed to fetch bets')
      return data
    } catch (err) {
      console.warn('[betApi.getAllBets] Fetch error:', err.message)
      throw err
    }
  },

  /**
   * 3. GET /api/admin/races/live-bets (Live Race Bet Pool & Chips)
   * Fallback: /api/bets/pool
   */
  async getLiveBetPool() {
    const endpoints = [
      `${getBaseUrl()}/api/admin/races/live-bets`,
      `${getBaseUrl()}/api/bets/pool`,
      `${getBaseUrl()}/api/races/live-bets`
    ]

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders(),
        })
        if (res.ok) {
          return await parseJson(res)
        }
      } catch (e) {
        // try next
      }
    }
    return null
  }
}

