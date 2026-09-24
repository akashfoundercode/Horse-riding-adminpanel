import { useState } from 'react'
import { Menu, Search, Volume2, VolumeX, Sun, Moon, ChevronDown, Radio, Timer } from 'lucide-react'
import { useGameEngine } from '../hooks/useGameEngine.js'
import { useTheme } from '../hooks/useTheme.js'
import { useAuth } from '../hooks/useAuth.js'

const stageBadges = {
  BETTING_OPEN:   { label: "Betting Open",   cls: "bg-turf/15 text-turf border-turf/30",           dot: "bg-turf" },
  BETTING_CLOSED: { label: "Bets Locked",    cls: "bg-amber-500/15 text-amber-500 border-amber-500/30", dot: "bg-amber-500" },
  COUNTDOWN:      { label: "Countdown",      cls: "bg-amber-500/15 text-amber-500 border-amber-500/30", dot: "bg-amber-400" },
  RUNNING:        { label: "Race Running",   cls: "bg-primary/15 text-primary border-primary/30",   dot: "bg-primary" },
  FINISHING:      { label: "Photo Finish",   cls: "bg-violet-500/15 text-violet-400 border-violet-500/30", dot: "bg-violet-500" },
  RESULT:         { label: "Result",         cls: "bg-gold/15 text-amber-500 border-gold/30",       dot: "bg-gold" },
  FINISHED:       { label: "Next Round",     cls: "bg-surface2 text-mute border-line",              dot: "bg-mute" },
}

export default function Topbar({ title, onOpenSearch, setMobileOpen }) {
  const { currentRace, soundMuted, toggleSound, socketStatus } = useGameEngine()
  const { isDark, toggleTheme } = useTheme()
  const { admin, logout } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)

  const stage = stageBadges[currentRace.stage] || stageBadges.BETTING_OPEN

  return (
    <header className="h-14 border-b border-line bg-panel/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-3 sm:px-5 max-w-full w-full overflow-hidden">
      {/* Left (Title + Menu) */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg text-mute hover:text-ink hover:bg-surface2 transition-colors lg:hidden focus-ring shrink-0"
          aria-label="Open Menu"
        >
          <Menu size={18} />
        </button>
        <h1 className="font-display text-sm sm:text-base lg:text-lg font-bold tracking-wide text-ink truncate">
          {title}
        </h1>
      </div>

      {/* Right (Status + Race Ticker + Actions) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Socket status */}
        <div className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0
          ${socketStatus?.connected
            ? 'bg-turf/10 text-turf border-turf/25'
            : 'bg-amber-500/10 text-amber-500 border-amber-500/25'
          }`}
        >
          <Radio size={11} className={socketStatus?.connected ? 'live-dot' : ''} />
          <span>{socketStatus?.connected ? 'Live' : 'Offline'}</span>
        </div>

        {/* Race ticker */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-line bg-surface2 text-xs font-semibold shrink-0">
          <span className={`w-2 h-2 rounded-full live-dot shrink-0 ${stage.dot}`} />
          <span className="hidden lg:inline font-mono text-mute">#{currentRace.gameSerial}</span>
          <span className={`px-1.5 sm:px-2 py-0.5 rounded-md border text-[10px] sm:text-[11px] font-bold shrink-0 ${stage.cls}`}>
            {stage.label}
          </span>
          <div className="flex items-center gap-1 font-mono text-primary font-bold border-l border-line pl-1.5 sm:pl-2 shrink-0">
            <Timer size={12} className="animate-pulse shrink-0" />
            <span>{String(currentRace.stageRemaining).padStart(2, '0')}s</span>
          </div>
        </div>

        {/* Search */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-2 bg-surface2 hover:bg-surface3 border border-line rounded-xl px-2.5 sm:px-3 py-1.5 text-xs text-mute transition-colors focus-ring shrink-0"
        >
          <Search size={13} />
          <span className="hidden lg:inline">Search</span>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-line text-mute">⌘K</kbd>
        </button>

        {/* Sound */}
        <button
          onClick={toggleSound}
          title={soundMuted ? 'Unmute Sound' : 'Mute Sound'}
          className={`p-1.5 sm:p-2 rounded-xl border transition-colors focus-ring shrink-0
            ${soundMuted ? 'bg-surface2 text-mute border-line' : 'bg-primary/10 text-primary border-primary/25'}`}
        >
          {soundMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-ink transition-colors focus-ring shrink-0"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-500" />}
        </button>

        {/* Profile */}
        <div className="relative shrink-0">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-1 p-1 sm:p-1.5 rounded-xl hover:bg-surface2 transition-colors focus-ring"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
              {(admin?.name || 'SA').substring(0, 2).toUpperCase()}
            </div>
            <ChevronDown size={13} className="text-mute hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-panel border border-line rounded-2xl shadow-2xl p-2 z-50 text-xs animate-slide-in">
              <div className="px-3 py-2.5 border-b border-line">
                <div className="font-semibold text-ink truncate">{admin?.name || 'Super Admin'}</div>
                <div className="text-[11px] text-mute mt-0.5 truncate">{admin?.email || 'admin@turfcontrol.com'}</div>
              </div>
              <div className="py-1 mt-1">
                <button
                  onClick={() => { setProfileOpen(false); toggleTheme() }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface2 text-ink flex items-center justify-between transition-colors"
                >
                  <span>Toggle Theme</span>
                  <span className="text-mute font-mono">{isDark ? 'Dark' : 'Light'}</span>
                </button>
                <button
                  onClick={() => { setProfileOpen(false); logout() }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-danger/10 text-danger font-semibold mt-0.5 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
