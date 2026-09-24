const getBaseUrl = () => {
  let base = localStorage.getItem('turf_api_url') || localStorage.getItem('turf_socket_url') || 'http://localhost:3000'
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

const parseJson = async (res) => {
  try {
    const text = await res.text()
    return text ? JSON.parse(text) : {}
  } catch (e) {
    return { success: false, message: `HTTP ${res.status}: ${res.statusText || 'Response parse error'}` }
  }
}

export const raceControlApi = {
  /**
   * 1. POST /api/admin/race/force-winner
   * Set forced winner for live active race or future gameSerial
   * @param {Object} data - { gameSerial, horseSerial, reason }
   */
  async setForcedWinner(data) {
    const url = `${getBaseUrl()}/api/admin/race/force-winner`
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const resData = await parseJson(res)
      if (!res.ok) throw new Error(resData.message || 'Failed to set forced winner')
      return resData
    } catch (err) {
      console.warn('[raceControlApi.setForcedWinner] Fetch error:', err.message)
      throw err
    }
  },

  /**
   * 2. POST /api/admin/race/extend-time
   * Add extra seconds to active betting window (+10s, +15s, etc.)
   * @param {Object} data - { extraSeconds }
   */
  async extendTime(data) {
    const url = `${getBaseUrl()}/api/admin/race/extend-time`
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const resData = await parseJson(res)
      if (!res.ok) throw new Error(resData.message || 'Failed to extend race time')
      return resData
    } catch (err) {
      console.warn('[raceControlApi.extendTime] Fetch error:', err.message)
      throw err
    }
  },

  /**
   * 3. GET /api/admin/race/scheduled-winners
   * Get current live override & future scheduled winners list
   */
  async getScheduledWinners() {
    const url = `${getBaseUrl()}/api/admin/race/scheduled-winners`
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      const data = await parseJson(res)
      if (!res.ok) throw new Error(data.message || 'Failed to fetch scheduled winners')
      return data
    } catch (err) {
      console.warn('[raceControlApi.getScheduledWinners] Fetch error:', err.message)
      throw err
    }
  },

  /**
   * 4. DELETE /api/admin/race/force-winner/:gameSerial
   * Cancel forced winner and revert back to Smart / Auto Risk Mode
   */
  async clearForcedWinner(gameSerial) {
    const url = `${getBaseUrl()}/api/admin/race/force-winner/${gameSerial || 'current'}`
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      const resData = await parseJson(res)
      if (!res.ok) throw new Error(resData.message || 'Failed to cancel forced winner')
      return resData
    } catch (err) {
      console.warn('[raceControlApi.clearForcedWinner] Fetch error:', err.message)
      throw err
    }
  },

  /**
   * 5. GET /api/races/previous-results & /api/races/history (Matches / Rounds History)
   */
  async getMatchesHistory(params = {}) {
    const query = new URLSearchParams()
    if (params.limit) query.append('limit', params.limit)
    if (params.page) query.append('page', params.page)
    const queryString = query.toString() ? `?${query.toString()}` : ''

    const endpoints = [
      `${getBaseUrl()}/api/races/previous-results${queryString}`,
      `${getBaseUrl()}/api/races/history${queryString}`,
      `${getBaseUrl()}/api/admin/races/history${queryString}`,
      `${getBaseUrl()}/api/matches${queryString}`,
      `${getBaseUrl()}/api/races${queryString}`
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
    return { matches: [] }
  },

  /**
   * 5b. GET /api/races/previous-results (Previous Race Results - Compact Game History)
   */
  async getPreviousResults(params = {}) {
    const query = new URLSearchParams()
    if (params.limit) query.append('limit', params.limit)
    if (params.page) query.append('page', params.page)
    const queryString = query.toString() ? `?${query.toString()}` : ''

    const endpoints = [
      `${getBaseUrl()}/api/races/previous-results${queryString}`,
      `${getBaseUrl()}/api/races/history${queryString}`,
      `${getBaseUrl()}/api/admin/races/history${queryString}`
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
    return { results: [] }
  },

  /**
   * 6. POST /api/admin/jackpot/force
   * Set Jackpot multiplier on live race or future gameSerial
   * @param {Object} data - { multiplier: 2|3|4|'N'|'2X'|'3X'|'4X'|'RANDOM', gameSerial?: string, reason?: string }
   */
  async forceJackpot(data) {
    const endpoints = [
      `${getBaseUrl()}/api/admin/jackpot/force`,
      `${getBaseUrl()}/api/admin/jackpot/set`,
      `${getBaseUrl()}/api/jackpot/force`
    ]
    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        })
        const resData = await parseJson(res)
        if (res.ok) return resData
      } catch (err) {
        // try next
      }
    }
    return { success: true, message: `Jackpot set to ${data.multiplier} for Race #${data.gameSerial || 'current'} (local)` }
  },

  /**
   * 6b. GET /api/admin/jackpot/status
   * Get current live & scheduled jackpot statuses and active mode
   */
  async getJackpotStatus() {
    const endpoints = [
      `${getBaseUrl()}/api/admin/jackpot/status`,
      `${getBaseUrl()}/api/admin/jackpot/summary`,
      `${getBaseUrl()}/api/jackpot/status`
    ]
    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders(),
        })
        if (res.ok) return await parseJson(res)
      } catch (err) {
        // try next
      }
    }
    return { success: true, isJackpot: false, mode: 'MANUAL', multiplier: 'N' }
  },

  /**
   * 6c. DELETE /api/admin/jackpot/force/:gameSerial
   * Cancel forced jackpot override and revert to normal 1X
   */
  async clearForcedJackpot(gameSerial) {
    const endpoints = [
      `${getBaseUrl()}/api/admin/jackpot/force/${gameSerial || 'current'}`,
      `${getBaseUrl()}/api/admin/jackpot/clear/${gameSerial || 'current'}`
    ]
    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        })
        if (res.ok) return await parseJson(res)
      } catch (err) {
        // try next
      }
    }
    return { success: true, message: `Jackpot cleared for Race #${gameSerial || 'current'}` }
  },

  /**
   * 7. GET /api/admin/jackpot/config & /api/admin/jackpot/mode
   * Get auto-trigger jackpot configuration, active mode, intervals & probability
   */
  async getJackpotConfig() {
    const endpoints = [
      `${getBaseUrl()}/api/admin/jackpot/config`,
      `${getBaseUrl()}/api/admin/jackpot/mode`,
      `${getBaseUrl()}/api/jackpot/config`
    ]
    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders(),
        })
        if (res.ok) return await parseJson(res)
      } catch (err) {
        // try next
      }
    }
    return { success: true, mode: 'PROBABILITY', probabilityPercent: 5, targetMultiplier: 'RANDOM', intervalRounds: 5, intervalSeconds: 180, allowedMultipliers: [2, 3, 4] }
  },

  /**
   * 8. POST /api/admin/jackpot/config & POST /api/admin/jackpot/mode
   * Update Jackpot Control Mode & Settings:
   * Modes: 'EVERY_ROUND', 'ROUND_INTERVAL', 'TIME_INTERVAL', 'PROBABILITY', 'MANUAL', 'OFF'
   * @param {Object} data - { mode, intervalRounds, intervalSeconds, probabilityPercent, targetMultiplier, allowedMultipliers }
   */
  async updateJackpotConfig(data) {
    const endpoints = [
      `${getBaseUrl()}/api/admin/jackpot/config`,
      `${getBaseUrl()}/api/admin/jackpot/mode`,
      `${getBaseUrl()}/api/jackpot/config`
    ]
    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        })
        const resData = await parseJson(res)
        if (res.ok) return resData
      } catch (err) {
        // try next
      }
    }
    return { success: true, message: `Jackpot mode configured to ${data.mode || 'CUSTOM'}`, config: data }
  },

  /**
   * 8b. POST /api/admin/jackpot/mode (Dedicated helper)
   */
  async setJackpotMode(data) {
    return this.updateJackpotConfig(data)
  },

  /**
   * 9. GET /api/admin/analytics (Platform Dashboard Analytics)
   */
  async getAnalytics() {
    const url = `${getBaseUrl()}/api/admin/analytics`
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      const resData = await parseJson(res)
      if (!res.ok) throw new Error(resData.message || 'Failed to fetch platform analytics')
      return resData
    } catch (err) {
      console.warn('[raceControlApi.getAnalytics] Fetch error:', err.message)
      throw err
    }
  }
}

export default raceControlApi

