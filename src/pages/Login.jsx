import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, ShieldCheck, Sun, Moon, ArrowRight, KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useTheme } from '../hooks/useTheme.js'
import { authApi } from '../services/authApi.js'

// view: 'login' | 'forgot' | 'reset'
export default function Login() {
  const { login, authLoading } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [view, setView] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  // Forgot password
  const [fpEmail, setFpEmail] = useState('')

  // Reset password
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPass, setShowNewPass] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Email and password are required.'); return }
    const res = await login(email, password)
    if (res.success) navigate('/')
    else setError(res.message || 'Invalid credentials.')
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError(''); setInfo('')
    if (!fpEmail) { setError('Enter your email address.'); return }
    setLoading(true)
    try {
      const res = await authApi.forgotPassword(fpEmail)
      setInfo(res.message || 'Reset link sent. Check your email.')
      setView('reset')
    } catch (err) {
      setError(err.message || 'Failed to send reset email.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError(''); setInfo('')
    if (!resetToken || !newPassword) { setError('Token and new password are required.'); return }
    setLoading(true)
    try {
      const res = await authApi.resetPassword(resetToken, newPassword)
      setInfo(res.message || 'Password reset successful.')
      setTimeout(() => { setView('login'); setInfo('') }, 1500)
    } catch (err) {
      setError(err.message || 'Reset failed. Token may be invalid or expired.')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => { setError(''); setInfo(''); setView('login') }

  return (
    <div className="min-h-screen bg-base text-ink flex flex-col justify-between p-5 relative overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between max-w-5xl w-full mx-auto z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white shadow-glow-primary font-bold text-base select-none">🐎</div>
          <div>
            <span className="font-display text-base font-bold text-ink tracking-wide">TURF RACER</span>
            <span className="block text-[10px] text-mute">Admin Console</span>
          </div>
        </div>
        <button onClick={toggleTheme} className="p-2 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-ink transition-colors">
          {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-500" />}
        </button>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm mx-auto my-auto z-10">
        <div className="bg-panel border border-line rounded-3xl p-7 shadow-2xl space-y-5">

          {/* ── LOGIN ── */}
          {view === 'login' && (
            <>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
                  <KeyRound size={22} />
                </div>
                <h2 className="font-display text-2xl font-bold tracking-wide text-ink">Admin Sign In</h2>
                <p className="text-xs text-mute">Secure access to the race management console.</p>
              </div>

              {error && <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold text-center">{error}</div>}

              <form onSubmit={handleLogin} className="space-y-4">
                <label className="flex flex-col gap-1.5 text-xs">
                  <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">Email</span>
                  <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3.5 py-2.5 focus-within:border-primary transition-colors">
                    <Mail size={15} className="text-mute shrink-0" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="horseracing@gmail.com" className="bg-transparent outline-none text-sm text-ink w-full" autoComplete="email" />
                  </div>
                </label>

                <label className="flex flex-col gap-1.5 text-xs">
                  <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">Password</span>
                  <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3.5 py-2.5 focus-within:border-primary transition-colors">
                    <Lock size={15} className="text-mute shrink-0" />
                    <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-transparent outline-none text-sm text-ink w-full" autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="text-mute hover:text-ink transition-colors shrink-0">
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>

                <div className="flex justify-end">
                  <button type="button" onClick={() => { setError(''); setFpEmail(email); setView('forgot') }} className="text-[11px] text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>

                <button type="submit" disabled={authLoading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-glow-primary transition-all disabled:opacity-60">
                  {authLoading ? 'Signing in…' : <><span>Sign In</span><ArrowRight size={15} /></>}
                </button>
              </form>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-mute pt-1 border-t border-line">
                <ShieldCheck size={13} className="text-turf" />
                <span>JWT · 256-bit SSL</span>
              </div>
            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {view === 'forgot' && (
            <>
              <div className="flex items-center gap-3">
                <button onClick={goBack} className="p-1.5 rounded-lg bg-surface2 hover:bg-surface3 border border-line text-mute hover:text-ink transition-colors">
                  <ArrowLeft size={15} />
                </button>
                <div>
                  <h2 className="font-display text-lg font-bold text-ink">Forgot Password</h2>
                  <p className="text-[11px] text-mute">We'll send a reset token to your email.</p>
                </div>
              </div>

              {error && <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold text-center">{error}</div>}
              {info && <div className="p-3 rounded-xl bg-turf/10 border border-turf/25 text-turf text-xs font-semibold text-center">{info}</div>}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <label className="flex flex-col gap-1.5 text-xs">
                  <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">Email</span>
                  <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3.5 py-2.5 focus-within:border-primary transition-colors">
                    <Mail size={15} className="text-mute shrink-0" />
                    <input type="email" value={fpEmail} onChange={(e) => setFpEmail(e.target.value)} placeholder="horseracing@gmail.com" className="bg-transparent outline-none text-sm text-ink w-full" autoComplete="email" />
                  </div>
                </label>
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-glow-primary transition-all disabled:opacity-60">
                  {loading ? 'Sending…' : <><span>Send Reset Link</span><ArrowRight size={15} /></>}
                </button>
              </form>

              <button onClick={() => { setError(''); setView('reset') }} className="w-full text-center text-[11px] text-primary hover:underline">
                Already have a reset token?
              </button>
            </>
          )}

          {/* ── RESET PASSWORD ── */}
          {view === 'reset' && (
            <>
              <div className="flex items-center gap-3">
                <button onClick={goBack} className="p-1.5 rounded-lg bg-surface2 hover:bg-surface3 border border-line text-mute hover:text-ink transition-colors">
                  <ArrowLeft size={15} />
                </button>
                <div>
                  <h2 className="font-display text-lg font-bold text-ink">Reset Password</h2>
                  <p className="text-[11px] text-mute">Enter the token from your email and set a new password.</p>
                </div>
              </div>

              {error && <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold text-center">{error}</div>}
              {info && <div className="p-3 rounded-xl bg-turf/10 border border-turf/25 text-turf text-xs font-semibold text-center">{info}</div>}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <label className="flex flex-col gap-1.5 text-xs">
                  <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">Reset Token</span>
                  <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3.5 py-2.5 focus-within:border-primary transition-colors">
                    <KeyRound size={15} className="text-mute shrink-0" />
                    <input type="text" value={resetToken} onChange={(e) => setResetToken(e.target.value)} placeholder="Paste token from email" className="bg-transparent outline-none text-sm text-ink w-full font-mono" />
                  </div>
                </label>

                <label className="flex flex-col gap-1.5 text-xs">
                  <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">New Password</span>
                  <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3.5 py-2.5 focus-within:border-primary transition-colors">
                    <Lock size={15} className="text-mute shrink-0" />
                    <input type={showNewPass ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="bg-transparent outline-none text-sm text-ink w-full" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="text-mute hover:text-ink transition-colors shrink-0">
                      {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>

                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-glow-primary transition-all disabled:opacity-60">
                  {loading ? 'Resetting…' : <><span>Set New Password</span><ArrowRight size={15} /></>}
                </button>
              </form>
            </>
          )}

        </div>
      </div>

      <div className="text-center text-[11px] text-mute py-2 z-10 font-mono">Turf Racer v2.4.0 · Admin Console</div>

      <div className="absolute top-1/4 -left-40 w-96 h-96 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 rounded-full bg-amber-500/8 blur-3xl pointer-events-none" />
    </div>
  )
}
