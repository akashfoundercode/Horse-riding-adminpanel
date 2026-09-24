import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, ShieldCheck, Sun, Moon, ArrowRight, KeyRound } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useTheme } from '../hooks/useTheme.js'

export default function Login() {
  const { login } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [email, setEmail] = useState('admin@turfcontrol.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Email and password are required.'); return }
    const res = login(email, password)
    if (res.success) navigate('/')
    else setError(res.message || 'Invalid credentials.')
  }

  const handleDemoLogin = () => {
    login('admin@turfcontrol.com', 'admin_secret_key')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-base text-ink flex flex-col justify-between p-5 relative overflow-hidden">
      {/* Navbar */}
      <div className="flex items-center justify-between max-w-5xl w-full mx-auto z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white shadow-glow-primary font-bold text-base select-none">
            🐎
          </div>
          <div>
            <span className="font-display text-base font-bold text-ink tracking-wide">TURF RACER</span>
            <span className="block text-[10px] text-mute">Admin Console</span>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-ink transition-colors focus-ring"
        >
          {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-500" />}
        </button>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm mx-auto my-auto z-10">
        <div className="bg-panel border border-line rounded-3xl p-7 shadow-2xl space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
              <KeyRound size={22} />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-wide text-ink">Admin Sign In</h2>
            <p className="text-xs text-mute">Secure access to the race management console.</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">Email</span>
              <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3.5 py-2.5 focus-within:border-primary transition-colors">
                <Mail size={15} className="text-mute shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@turfcontrol.com"
                  className="bg-transparent outline-none text-sm text-ink w-full"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">Password</span>
              <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3.5 py-2.5 focus-within:border-primary transition-colors">
                <Lock size={15} className="text-mute shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent outline-none text-sm text-ink w-full"
                />
              </div>
            </label>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-glow-primary transition-all focus-ring"
            >
              <span>Sign In</span>
              <ArrowRight size={15} />
            </button>
          </form>

          <div className="pt-1 border-t border-line">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-ink text-xs font-semibold transition-colors"
            >
              Continue as Demo Admin
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-mute">
            <ShieldCheck size={13} className="text-turf" />
            <span>JWT Session · 256-bit SSL</span>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-mute py-2 z-10 font-mono">
        Turf Racer v2.4.0 · Admin Console
      </div>

      {/* BG blurs */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 rounded-full bg-amber-500/8 blur-3xl pointer-events-none" />
    </div>
  )
}
