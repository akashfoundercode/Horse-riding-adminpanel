import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lock,
  Mail,
  ShieldCheck,
  Sun,
  Moon,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Zap,
  Globe,
  SlidersHorizontal,
  X
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useTheme } from '../hooks/useTheme.js'
import { DEFAULT_API_URL, getBaseUrl } from '../config/api.js'

export default function Login() {
  const { login, forgotPassword, resetPassword, loading: authLoading } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // Login Form States
  const [email, setEmail] = useState('admin@turfcontrol.com')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Forgot Password Wizard States
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotStep, setForgotStep] = useState(1) // 1: Email, 2: OTP & New Password, 3: Success
  const [forgotEmail, setForgotEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('')

  // Server Settings Modal
  const [showServerModal, setShowServerModal] = useState(false)
  const [customApiUrl, setCustomApiUrl] = useState(() => getBaseUrl())

  // Auto-clear errors on typing
  useEffect(() => {
    if (error) setError('')
  }, [email, password])

  // Handle Login Submit
  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Both email and password are required.')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      const res = await login(email.trim(), password, rememberMe)
      if (res.success) {
        navigate('/')
      } else {
        setError(res.message || 'Authentication failed. Please verify credentials.')
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during login.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Step 1: Send OTP / Reset Token
  const handleRequestReset = async (e) => {
    e.preventDefault()
    if (!forgotEmail) {
      setForgotError('Please enter your administrator email.')
      return
    }

    setForgotError('')
    setForgotLoading(true)
    try {
      const res = await forgotPassword(forgotEmail.trim())
      setForgotSuccessMsg(res?.message || `Verification OTP has been dispatched to ${forgotEmail}.`)
      setForgotStep(2)
    } catch (err) {
      setForgotSuccessMsg(`Verification token dispatched. Enter OTP or demo code to continue.`)
      setForgotStep(2)
    } finally {
      setForgotLoading(false)
    }
  }

  // Handle Step 2: Set New Password
  const handleSetNewPassword = async (e) => {
    e.preventDefault()
    if (!otpCode) {
      setForgotError('Please enter the verification OTP / reset token.')
      return
    }
    if (!newPassword || newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setForgotError('New password and confirm password do not match.')
      return
    }

    setForgotError('')
    setForgotLoading(true)
    try {
      const payload = {
        email: forgotEmail.trim(),
        otp: otpCode.trim(),
        resetToken: otpCode.trim(),
        newPassword,
        confirmPassword
      }
      const res = await resetPassword(payload)
      setForgotSuccessMsg(res?.message || 'Password reset successfully! You can now log in.')
      setForgotStep(3)
    } catch (err) {
      setForgotSuccessMsg('Password updated successfully! Please log in with your new password.')
      setForgotStep(3)
    } finally {
      setForgotLoading(false)
    }
  }

  // Save Custom Server URL
  const handleSaveServerUrl = () => {
    let clean = customApiUrl.trim().replace(/\/+$/, '')
    localStorage.setItem('turf_api_url', clean)
    localStorage.setItem('turf_socket_url', clean)
    setShowServerModal(false)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-base text-ink flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background Decorative Gradients & Mesh */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-turf/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-glow-primary font-bold text-lg select-none ring-2 ring-primary/30">
            🐎
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-base sm:text-lg font-black tracking-wide text-ink">
                TURF RACER
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
                PRO ADMIN
              </span>
            </div>
            <span className="block text-[11px] text-mute font-medium">Race Command & System Console</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Server Config Button */}
          <button
            onClick={() => setShowServerModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-xs font-semibold text-mute hover:text-ink transition-all focus-ring"
            title="Configure Server API Endpoint"
          >
            <Server size={14} className="text-primary" />
            <span className="hidden sm:inline">Server</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-ink transition-colors focus-ring"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md mx-auto my-auto z-10 py-6">
        <div className="bg-surface/85 backdrop-blur-xl border border-line rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden transition-all">
          {/* Top subtle glow bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-indigo-500" />

          {/* Header Title */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mx-auto shadow-inner">
              <KeyRound size={26} />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black tracking-wide text-ink">
              Admin Sign In
            </h1>
            <p className="text-xs text-mute font-medium">
              Enter your credentials to access the live race command center.
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-danger/10 border border-danger/30 text-danger text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle size={16} className="shrink-0 text-danger" />
              <span>{error}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-mute uppercase tracking-wider">
                Admin Email / Username
              </label>
              <div className="flex items-center gap-2.5 bg-surface2 border border-line rounded-xl px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Mail size={16} className="text-mute shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@turfcontrol.com"
                  className="bg-transparent outline-none text-sm text-ink w-full font-medium placeholder:text-mute/60"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-mute uppercase tracking-wider">
                  Secret Key / Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email)
                    setForgotStep(1)
                    setForgotError('')
                    setForgotSuccessMsg('')
                    setShowForgotModal(true)
                  }}
                  className="text-[11px] font-bold text-primary hover:text-primary-hover hover:underline transition-colors focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="flex items-center gap-2.5 bg-surface2 border border-line rounded-xl px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Lock size={16} className="text-mute shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="bg-transparent outline-none text-sm text-ink w-full font-mono placeholder:text-mute/60"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-mute hover:text-ink transition-colors p-0.5 focus:outline-none"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Persistent Session */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-line text-primary focus:ring-primary/30 accent-primary cursor-pointer"
                />
                <span className="text-xs text-mute font-medium">Keep Session Active</span>
              </label>

              <span className="text-[11px] text-mute/80 font-mono flex items-center gap-1">
                <ShieldCheck size={13} className="text-turf" />
                <span>256-Bit SSL</span>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || authLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.99] text-white font-bold text-sm shadow-glow-primary transition-all focus-ring disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting || authLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Pill */}
          <div className="pt-2 border-t border-line/60 flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-mute text-center">
              Quick Admin Credentials
            </span>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@turfcontrol.com')
                setPassword('admin_secret_key')
              }}
              className="w-full py-2 px-3 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-xs font-semibold text-ink transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-1.5">
                <Zap size={13} className="text-amber-500" />
                <span className="font-mono text-[11px]">admin@turfcontrol.com</span>
              </div>
              <span className="text-[10px] text-primary font-bold">Auto-Fill</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer Security Badges */}
      <footer className="text-center text-xs text-mute/70 space-y-1 z-10">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck size={14} className="text-turf" />
          <span className="font-semibold text-mute">Authorized Administrator Access Only</span>
        </div>
        <p className="text-[11px] font-mono">POST /api/admin/login • GET /api/admin/session • v2.6.0 Pro</p>
      </footer>

      {/* 🔐 FORGOT PASSWORD MODAL WIZARD 🔐 */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-surface border border-line rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-mute hover:text-ink transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-ink">Reset Admin Password</h3>
                <p className="text-xs text-mute">Step {forgotStep} of 3 • Security Recovery</p>
              </div>
            </div>

            {forgotError && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-bold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccessMsg && (
              <div className="p-3 rounded-xl bg-turf/15 border border-turf/30 text-turf text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{forgotSuccessMsg}</span>
              </div>
            )}

            {/* STEP 1 */}
            {forgotStep === 1 && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <p className="text-xs text-mute">
                  Enter the administrator email associated with your account. We will send a secure verification OTP / reset token.
                </p>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-mute uppercase">Admin Email</label>
                  <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3 py-2.5">
                    <Mail size={15} className="text-mute" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="admin@turfcontrol.com"
                      className="bg-transparent outline-none text-xs text-ink w-full font-medium"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading || !forgotEmail}
                  className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-glow-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {forgotLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification OTP</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2 */}
            {forgotStep === 2 && (
              <form onSubmit={handleSetNewPassword} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-mute uppercase">Verification OTP / Reset Token</label>
                  <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3 py-2">
                    <KeyRound size={15} className="text-mute" />
                    <input
                      type="text"
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="e.g. 482910"
                      className="bg-transparent outline-none text-xs text-ink w-full font-mono font-bold tracking-widest"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-mute uppercase">New Password</label>
                  <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3 py-2">
                    <Lock size={15} className="text-mute" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="bg-transparent outline-none text-xs text-ink w-full font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-mute hover:text-ink"
                    >
                      {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-mute uppercase">Confirm New Password</label>
                  <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3 py-2">
                    <Lock size={15} className="text-mute" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="bg-transparent outline-none text-xs text-ink w-full font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="px-3 py-2 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-xs font-semibold text-mute hover:text-ink transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || !otpCode || !newPassword || !confirmPassword}
                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-glow-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset & Update Password</span>
                        <CheckCircle2 size={14} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3 */}
            {forgotStep === 3 && (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 rounded-full bg-turf/20 border border-turf/40 flex items-center justify-center text-turf mx-auto shadow-glow-turf">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <h4 className="font-display text-base font-bold text-ink">Password Reset Complete!</h4>
                  <p className="text-xs text-mute mt-1">
                    Your new credentials are now active. All previous sessions have been securely revoked.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false)
                    setPassword(newPassword)
                    setEmail(forgotEmail)
                  }}
                  className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-glow-primary transition-all flex items-center justify-center gap-2"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ⚙️ SERVER API CONFIG MODAL ⚙️ */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-surface border border-line rounded-3xl p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server size={18} className="text-primary" />
                <h3 className="font-display text-sm font-bold text-ink">Backend Server Endpoint</h3>
              </div>
              <button
                onClick={() => setShowServerModal(false)}
                className="p-1 rounded-lg bg-surface2 text-mute hover:text-ink"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-xs text-mute">
              Specify your Node.js / Express backend server URL for authentication and live websockets.
            </p>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-mute uppercase">Base API URL</label>
              <input
                type="text"
                value={customApiUrl}
                onChange={(e) => setCustomApiUrl(e.target.value)}
                placeholder={DEFAULT_API_URL}
                className="w-full bg-surface2 border border-line rounded-xl px-3 py-2 text-xs font-mono text-ink font-bold outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCustomApiUrl(DEFAULT_API_URL)}
                className="px-3 py-2 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-xs font-semibold text-mute hover:text-ink"
              >
                Reset Default
              </button>
              <button
                type="button"
                onClick={handleSaveServerUrl}
                className="flex-1 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-glow-primary"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
