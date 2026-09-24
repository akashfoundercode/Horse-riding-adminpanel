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

const parseJson = async (res) => {
  try {
    const text = await res.text()
    return text ? JSON.parse(text) : {}
  } catch (e) {
    return { success: false, message: `HTTP ${res.status}: ${res.statusText || 'Parse error'}` }
  }
}

export const walletApi = {
  /**
   * 1. GET /api/admin/wallets/transactions (Fallback: /api/wallet/transactions, /api/wallet/ledger)
   * Fetch ledger history / transactions with filters
   */
  async getTransactions(params = {}) {
    const query = new URLSearchParams()
    if (params.userId) query.append('userId', params.userId)
    if (params.gameCode) query.append('gameCode', params.gameCode)
    if (params.type && params.type !== 'all') query.append('type', params.type)
    if (params.category && params.category !== 'all') query.append('category', params.category)
    if (params.limit) query.append('limit', params.limit)
    if (params.page) query.append('page', params.page)

    const queryString = query.toString() ? `?${query.toString()}` : ''
    const endpoints = [
      `${getBaseUrl()}/api/admin/wallets/transactions${queryString}`,
      `${getBaseUrl()}/api/wallet/transactions${queryString}`,
      `${getBaseUrl()}/api/wallet/ledger${queryString}`,
      `${getBaseUrl()}/api/admin/wallets/ledger${queryString}`,
      `${getBaseUrl()}/api/admin/ledger${queryString}`
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
        // try next fallback
      }
    }
    return { transactions: [] }
  },

  /**
   * 2. POST /api/admin/wallets/adjust (Fallback: /api/wallet/adjust)
   * Atomic admin credit/debit adjustment
   *
   * Payload:
   * {
   *   "userId": 5, // or "username": "rahul123"
   *   "type": "credit" | "debit",
   *   "amount": 500,
   *   "category": "manual",
   *   "description": "Admin Topup / Deposit Bonus"
   * }
   */
  async adjustWallet(data) {
    const payload = {
      userId: data.userId !== undefined ? (Number(data.userId) || data.userId) : undefined,
      username: data.username,
      type: data.type || 'credit',
      amount: Number(data.amount) || 0,
      category: data.category || 'manual',
      description: data.description || (data.type === 'credit' ? 'Admin Topup / Deposit Bonus' : 'Admin Deduction / Penalty')
    }

    const endpoints = [
      payload.type === 'credit' ? `${getBaseUrl()}/api/admin/wallets/credit` : `${getBaseUrl()}/api/admin/wallets/debit`,
      `${getBaseUrl()}/api/admin/wallets/adjust`,
      `${getBaseUrl()}/api/wallet/adjust`
    ]

    let lastError = null

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        })
        const resData = await parseJson(res)
        if (res.ok) {
          return resData
        }
        lastError = new Error(resData.message || `HTTP ${res.status}: Failed to adjust wallet`)
        if (res.status !== 404) {
          throw lastError
        }
      } catch (err) {
        lastError = err
        if (err.message && !err.message.includes('404') && !err.message.includes('Failed to fetch')) {
          throw err
        }
      }
    }

    if (lastError) throw lastError
    return { success: true, message: 'Wallet adjusted successfully', data: payload }
  },

  /**
   * Helper: Credit User Wallet (POST /api/admin/wallets/credit)
   */
  async creditWallet(userId, amount, description = 'Deposit approved', category = 'manual') {
    return this.adjustWallet({
      userId,
      type: 'credit',
      amount,
      category,
      description
    })
  },

  /**
   * Helper: Debit User Wallet (POST /api/admin/wallets/debit)
   */
  async debitWallet(userId, amount, description = 'Withdrawal processed', category = 'manual') {
    return this.adjustWallet({
      userId,
      type: 'debit',
      amount,
      category,
      description
    })
  },

  /**
   * Helper: Bonus To All Players (POST /api/admin/wallets/bonus-all)
   */
  async bonusAll({ amount, description = 'Festive Bonus' }) {
    const url = `${getBaseUrl()}/api/admin/wallets/bonus-all`
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount: Number(amount) || 0,
          description
        }),
      })
      const resData = await parseJson(res)
      if (!res.ok) throw new Error(resData.message || 'Failed to distribute bonus')
      return resData
    } catch (err) {
      console.warn('[walletApi.bonusAll] Fetch error:', err.message)
      throw err
    }
  },

  /**
   * 3. GET /api/wallet/balance/:userId
   */
  async getBalance(userId) {
    const endpoints = [
      `${getBaseUrl()}/api/admin/wallets/balance/${userId}`,
      `${getBaseUrl()}/api/wallet/balance/${userId}`
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
    return { balance: 0 }
  }
}

export default walletApi

