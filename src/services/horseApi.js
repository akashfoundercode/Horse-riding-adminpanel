import { getBaseUrl } from '../config/api.js'

const getAuthHeaders = () => {
  const token = localStorage.getItem('turf_admin_token') || ''
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

export const horseApi = {
  // 1. GET /api/horses (with status query: 'all', 'active', 'inactive')
  async getAll(status = 'all') {
    const url = `${getBaseUrl()}/api/horses${status !== 'active' ? `?status=${status}` : ''}`
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to fetch horses')
      return data
    } catch (err) {
      console.warn('[horseApi.getAll] API offline or error:', err.message)
      throw err
    }
  },

  // 2. GET /api/horses/:id
  async getById(id) {
    const url = `${getBaseUrl()}/api/horses/${id}`
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || `Horse #${id} not found`)
      return data
    } catch (err) {
      console.warn(`[horseApi.getById] API error for id ${id}:`, err.message)
      throw err
    }
  },

  // 3. POST /api/horses (Supports multipart/form-data for files & application/json for text/URLs)
  async create(horseData) {
    const url = `${getBaseUrl()}/api/horses`
    const serial = Number(horseData.number || horseData.serial_number || horseData.serialNumber)

    // CASE A: User selected a local binary file -> Send multipart/form-data
    if (horseData.file instanceof File || horseData.file instanceof Blob) {
      const formData = new FormData()
      formData.append('name', horseData.name || '')
      formData.append('serial_number', String(serial))
      formData.append('status', horseData.status || 'active')
      if (horseData.odds) formData.append('odds', String(horseData.odds))
      if (horseData.color) formData.append('color', horseData.color)
      if (horseData.jockey) formData.append('jockey', horseData.jockey)
      formData.append('image', horseData.file) // Standard single file field

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Failed to create horse via multipart')
        return data
      } catch (err) {
        // Retry with field name 'file' if 'image' field was rejected
        if (err.message && err.message.includes('Unexpected')) {
          const retryFormData = new FormData()
          retryFormData.append('name', horseData.name || '')
          retryFormData.append('serial_number', String(serial))
          retryFormData.append('status', horseData.status || 'active')
          retryFormData.append('file', horseData.file)
          const retryRes = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: retryFormData
          })
          const retryData = await retryRes.json()
          if (!retryRes.ok) throw new Error(retryData.message || 'Failed to create horse')
          return retryData
        }
        throw err
      }
    }

    // CASE B: Standard JSON payload (URL or Preset or Base64)
    const jsonPayload = {
      name: horseData.name,
      serial_number: serial,
      image_url: horseData.imageUrl || horseData.image_url || horseData.avatar || '',
      status: horseData.status || 'active',
      odds: Number(horseData.odds) || 3.5,
      color: horseData.color,
      jockey: horseData.jockey
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(jsonPayload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to create horse via JSON')
      return data
    } catch (err) {
      console.error('[horseApi.create] Error:', err.message)
      throw err
    }
  },

  // 4. PUT /api/horses/:id (Supports multipart/form-data for new files & application/json for text updates)
  async update(id, horseData) {
    const url = `${getBaseUrl()}/api/horses/${id}`
    const serial = Number(horseData.number || horseData.serial_number || horseData.serialNumber)

    // CASE A: User uploaded a NEW binary file -> Send multipart/form-data
    if (horseData.file instanceof File || horseData.file instanceof Blob) {
      const formData = new FormData()
      if (horseData.name) formData.append('name', horseData.name)
      if (serial) formData.append('serial_number', String(serial))
      if (horseData.status) formData.append('status', horseData.status)
      if (horseData.odds) formData.append('odds', String(horseData.odds))
      if (horseData.color) formData.append('color', horseData.color)
      if (horseData.jockey) formData.append('jockey', horseData.jockey)
      formData.append('image', horseData.file) // Standard single file field

      try {
        const res = await fetch(url, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: formData
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Failed to update horse via multipart')
        return data
      } catch (err) {
        if (err.message && err.message.includes('Unexpected')) {
          // Retry with 'file' field name
          const retryFormData = new FormData()
          if (horseData.name) retryFormData.append('name', horseData.name)
          if (serial) retryFormData.append('serial_number', String(serial))
          if (horseData.status) retryFormData.append('status', horseData.status)
          retryFormData.append('file', horseData.file)
          const retryRes = await fetch(url, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: retryFormData
          })
          const retryData = await retryRes.json()
          if (!retryRes.ok) throw new Error(retryData.message || 'Failed to update horse')
          return retryData
        }
        throw err
      }
    }

    // CASE B: Standard text & image URL update -> Send clean application/json
    const payload = {
      ...(horseData.name ? { name: horseData.name } : {}),
      ...(horseData.imageUrl || horseData.image_url || horseData.avatar ? { image_url: horseData.imageUrl || horseData.image_url || horseData.avatar } : {}),
      ...(horseData.status ? { status: horseData.status } : {}),
      ...(serial ? { serial_number: serial } : {}),
      ...(horseData.odds ? { odds: Number(horseData.odds) } : {}),
      ...(horseData.color ? { color: horseData.color } : {}),
      ...(horseData.jockey ? { jockey: horseData.jockey } : {})
    }

    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to update horse')
      return data
    } catch (err) {
      console.error(`[horseApi.update] Error for id ${id}:`, err.message)
      throw err
    }
  },

  // 5. DELETE /api/horses/:id
  async delete(id) {
    const url = `${getBaseUrl()}/api/horses/${id}`
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to delete horse')
      return data
    } catch (err) {
      console.error(`[horseApi.delete] Error for id ${id}:`, err.message)
      throw err
    }
  }
}
