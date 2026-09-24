import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Trophy, Flag, Receipt,
  Users, Wallet, Settings, Sun, Moon, LogOut, Zap
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme.js'
import { useAuth } from '../hooks/useAuth.js'
import { useGameEngine } from '../hooks/useGameEngine.js'

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/horses", label: "Horses", icon: Trophy },
  { to: "/races", label: "Live Race", icon: Flag },
  { to: "/bets", label: "Bets", icon: Receipt },
  { to: "/users", label: "Users", icon: Users },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/jackpot",  label: "Jackpot",  icon: Zap },
  { to: "/settings", label: "Settings", icon: Settings },
]

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { isDark, toggleTheme } = useTheme()
  const { admin, logout } = useAuth()
  const { currentRace } = useGameEngine()

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-40 w-60 shrink-0 h-screen flex flex-col
        bg-panel border-r border-line transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-line shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white font-bold text-base shadow-glow-primary select-none">
            🐎
          </div>
          <div>
            <div className="font-display text-base font-bold text-ink tracking-wide leading-none">
              TURF RACER
            </div>
            <div className="text-[10px] text-mute mt-0.5 font-mono">Admin Console</div>
          </div>
        </div>

        {/* Live Status */}
        <div className="px-3 pt-3 pb-2 border-b border-line shrink-0">
          <div className="bg-surface2 border border-line rounded-xl px-3 py-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-turf live-dot" />
                <span className="text-[10px] font-bold text-turf uppercase tracking-wider">Live</span>
              </div>
              <span className="text-[10px] font-mono text-mute">#{currentRace.gameSerial}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-mute">Stage</span>
              <span className="font-semibold text-primary truncate max-w-[110px]">
                {currentRace.stage.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-mute">Round Pot</span>
              <span className="font-bold text-amber-500 dark:text-gold font-mono">
                ₹{currentRace.totalPot.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen?.(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 focus-ring
                ${isActive
                  ? 'bg-primary text-white shadow-glow-primary font-semibold'
                  : 'text-mute hover:text-ink hover:bg-surface2'
                }`
              }
            >
              <Icon size={16} className="shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-line space-y-2 shrink-0">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-[12px] font-medium text-ink transition-colors focus-ring"
          >
            <div className="flex items-center gap-2">
              {isDark
                ? <Moon size={14} className="text-amber-400" />
                : <Sun size={14} className="text-amber-500" />
              }
              <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <span className="text-[10px] font-mono text-mute">{isDark ? 'ON' : 'OFF'}</span>
          </button>

          <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-surface2 border border-line">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center font-bold text-primary text-[11px] shrink-0">
                {(admin?.name || 'SA').substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-ink truncate">{admin?.name || 'Super Admin'}</div>
                <div className="text-[10px] text-mute truncate">{admin?.roleLabel || 'Master Access'}</div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-mute hover:text-danger hover:bg-danger/10 transition-colors focus-ring"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
