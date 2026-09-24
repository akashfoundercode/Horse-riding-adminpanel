import { io } from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
    this.url = localStorage.getItem('turf_socket_url') || 'https://horseracing.siberiancrane.tech/'
    this.token = localStorage.getItem('turf_admin_token') || ''
    this.listeners = new Map()
    this.status = 'idle' // 'connected' | 'connecting' | 'disconnected' | 'idle'
    this.latency = 0
    this.enabled = localStorage.getItem('turf_socket_enabled') !== 'false'
  }

  connect(customUrl, token) {
    if (customUrl) {
      this.url = customUrl
      localStorage.setItem('turf_socket_url', customUrl)
    }
    if (token !== undefined) {
      this.token = token
      localStorage.setItem('turf_admin_token', token)
    }

    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }

    this.enabled = true
    localStorage.setItem('turf_socket_enabled', 'true')
    this.status = 'connecting'
    this.notifyStatusChange()

    try {
      this.socket = io(this.url, {
        auth: this.token ? { token: `Bearer ${this.token}` } : {},
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        timeout: 5000,
      })

      this.socket.on('connect', () => {
        this.status = 'connected'
        this.notifyStatusChange()
        console.log(`⚡ [Socket.IO] Connected successfully to ${this.url}`)
        this.socket.emit('subscribe:admin')
        this.socket.emit('admin:subscribe')
        this.socket.emit('join:room', 'admin')
        this.socket.emit('join_room', 'admin')
        this.socket.emit('join', 'admin')
        this.socket.emit('room:join', 'admin')
      })

      this.socket.on('disconnect', (reason) => {
        this.status = 'disconnected'
        this.notifyStatusChange()
      })

      this.socket.on('connect_error', () => {
        this.status = 'disconnected'
        this.notifyStatusChange()
      })

      // Wire listeners
      this.listeners.forEach((callbacks, eventName) => {
        callbacks.forEach((cb) => {
          this.socket.on(eventName, cb)
        })
      })

    } catch (e) {
      this.status = 'disconnected'
      this.notifyStatusChange()
    }

    return this.socket
  }

  disconnect() {
    this.enabled = false
    localStorage.setItem('turf_socket_enabled', 'false')
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.status = 'disconnected'
    this.notifyStatusChange()
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)

    if (this.socket) {
      this.socket.on(event, callback)
    }

    return () => {
      const set = this.listeners.get(event)
      if (set) {
        set.delete(callback)
        if (set.size === 0) {
          this.listeners.delete(event)
        }
      }
      if (this.socket) {
        this.socket.off(event, callback)
      }
    }
  }

  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data)
    }
  }

  onStatusChange(callback) {
    return this.on('__status_change__', callback)
  }

  notifyStatusChange() {
    const callbacks = this.listeners.get('__status_change__')
    if (callbacks) {
      callbacks.forEach((cb) =>
        cb({
          status: this.status,
          url: this.url,
          latency: this.latency,
          enabled: this.enabled,
          connected: this.status === 'connected',
        })
      )
    }
  }

  getStatus() {
    return {
      status: this.status,
      url: this.url,
      latency: this.latency,
      enabled: this.enabled,
      connected: this.status === 'connected',
    }
  }
}

export const socketService = new SocketService()
