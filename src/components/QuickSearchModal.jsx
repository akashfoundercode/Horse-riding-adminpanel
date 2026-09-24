import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Trophy, Users, Shield, Settings, Receipt, X } from 'lucide-react'
import { useGameEngine } from '../hooks/useGameEngine.js'

export default function QuickSearchModal({ open, onClose }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { horses, users, matchesHistory } = useGameEngine()

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) onClose()
        else open()
      }
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const cleanQuery = query.toLowerCase().trim()

  const filteredHorses = horses.filter(
    (h) =>
      h.name.toLowerCase().includes(cleanQuery) ||
      String(h.number).includes(cleanQuery)
  )

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(cleanQuery) ||
      u.email.toLowerCase().includes(cleanQuery) ||
      u.gameCode.toLowerCase().includes(cleanQuery)
  )

  const filteredMatches = matchesHistory.filter(
    (m) =>
      m.gameSerial.includes(cleanQuery) ||
      m.winnerHorse.name.toLowerCase().includes(cleanQuery)
  )

  const handleSelect = (path) => {
    navigate(path)
    onClose()
    setQuery('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-xl bg-panel border border-line rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line bg-surface">
          <Search size={18} className="text-mute shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search horses, users, game codes (GC...), race serials..."
            className="bg-transparent outline-none text-sm text-ink placeholder:text-mute w-full"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-mute hover:text-ink">
              <X size={16} />
            </button>
          )}
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface2 border border-line text-mute">
            ESC
          </span>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs">
          {/* Quick Pages */}
          {!query && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-mute px-3 mb-1 block">
                Quick Navigation
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => handleSelect('/')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-ink hover:bg-surface2 transition-colors text-left"
                >
                  <Trophy size={16} className="text-primary" />
                  <span>Executive Overview Dashboard</span>
                </button>
                <button
                  onClick={() => handleSelect('/races')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-ink hover:bg-surface2 transition-colors text-left"
                >
                  <Shield size={16} className="text-turf" />
                  <span>Live Race Control & History</span>
                </button>
                <button
                  onClick={() => handleSelect('/horses')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-ink hover:bg-surface2 transition-colors text-left"
                >
                  <Trophy size={16} className="text-gold" />
                  <span>12 Master Horses Management</span>
                </button>
                <button
                  onClick={() => handleSelect('/users')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-ink hover:bg-surface2 transition-colors text-left"
                >
                  <Users size={16} className="text-violet" />
                  <span>User & Permanent Game Codes</span>
                </button>
                <button
                  onClick={() => handleSelect('/wallet')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-ink hover:bg-surface2 transition-colors text-left"
                >
                  <Receipt size={16} className="text-amber-500" />
                  <span>Wallet & Ledger Adjustments</span>
                </button>
                <button
                  onClick={() => handleSelect('/settings')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-ink hover:bg-surface2 transition-colors text-left"
                >
                  <Settings size={16} className="text-mute" />
                  <span>Game Engine Timing Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* Horses Results */}
          {filteredHorses.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-mute px-3 mb-1 block">
                Horses ({filteredHorses.length})
              </span>
              <div className="space-y-1">
                {filteredHorses.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => handleSelect('/horses')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-ink hover:bg-surface2 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: horseColorSafe(h.color) }}
                      >
                        {h.number}
                      </div>
                      <span className="font-semibold">{h.name}</span>
                      <span className="text-mute">({h.hindiName || ''})</span>
                    </div>
                    <span className="font-display text-amber-600 dark:text-gold font-bold">{h.odds}x</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Users Results */}
          {filteredUsers.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-mute px-3 mb-1 block">
                Users & Game Codes ({filteredUsers.length})
              </span>
              <div className="space-y-1">
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelect('/users')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-ink hover:bg-surface2 transition-colors text-left"
                  >
                    <div>
                      <div className="font-semibold text-ink">{u.username}</div>
                      <div className="text-[11px] text-mute font-mono">{u.gameCode} • {u.email}</div>
                    </div>
                    <span className="font-display text-turf font-bold">₹{u.walletBalance.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matches History */}
          {filteredMatches.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-mute px-3 mb-1 block">
                Races History ({filteredMatches.length})
              </span>
              <div className="space-y-1">
                {filteredMatches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelect('/races')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-ink hover:bg-surface2 transition-colors text-left"
                  >
                    <div>
                      <div className="font-semibold text-ink">Race #{m.gameSerial}</div>
                      <div className="text-[11px] text-mute">Winner: {m.winnerHorse.name} ({m.jackpot})</div>
                    </div>
                    <span className="text-mute font-mono">{m.startedAt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && !filteredHorses.length && !filteredUsers.length && !filteredMatches.length && (
            <div className="text-center py-8 text-mute">
              No results found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function horseColorSafe(color) {
  return color || '#3B82F6'
}

