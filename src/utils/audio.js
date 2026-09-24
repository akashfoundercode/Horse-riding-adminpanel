// Web Audio API synthesized sound generator - no external asset dependencies!
class SoundFX {
  constructor() {
    this.ctx = null
    this.muted = false
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) {
        this.ctx = new AudioContext()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  setMuted(muted) {
    this.muted = muted
  }

  playBeep(freq = 600, duration = 0.1, type = 'sine') {
    if (this.muted) return
    try {
      this.init()
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + duration)
    } catch (e) {
      // Audio context might be restricted before user interaction
    }
  }

  playCountdown() {
    this.playBeep(880, 0.12, 'sine')
  }

  playRaceStart() {
    if (this.muted) return
    try {
      this.init()
      if (!this.ctx) return
      // Brass fan-fare start chord
      const freqs = [523.25, 659.25, 783.99, 1046.5]
      freqs.forEach((freq, idx) => {
        setTimeout(() => {
          this.playBeep(freq, 0.25, 'triangle')
        }, idx * 60)
      })
    } catch (e) { }
  }

  playWinner() {
    if (this.muted) return
    try {
      this.init()
      if (!this.ctx) return
      // Victorious arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playBeep(freq, 0.35, 'triangle')
        }, idx * 100)
      })
    } catch (e) { }
  }

  playCash() {
    this.playBeep(1200, 0.08, 'sine')
    setTimeout(() => this.playBeep(1600, 0.15, 'sine'), 80)
  }

  playClick() {
    this.playBeep(400, 0.04, 'sine')
  }
}

export const sound = new SoundFX()

