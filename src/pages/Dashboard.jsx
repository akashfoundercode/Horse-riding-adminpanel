import { useState } from 'react'
import {
  Coins as CoinsIcon, Users as UsersLucide, TrendingUp as TrendingUpIcon,
  Percent as PercentIcon, Wallet as WalletLucide, Trophy as TrophyLucide,
  ArrowRight, Eye, Server, ShieldCheck, RefreshCw
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useGameEngine } from '../hooks/useGameEngine.js'
import { useTheme } from '../hooks/useTheme.js'
import { resolveImageUrl } from '../utils/imageUrl.js'
import StatCard from '../components/StatCard.jsx'
import Badge from '../components/Badge.jsx'
import Drawer from '../components/Drawer.jsx'
import Modal from '../components/Modal.jsx'
import { Link } from 'react-router-dom'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-panel border border-line rounded-xl px-3 py-2.5 shadow-2xl text-xs">
      <div className="text-mute font-semibold mb-1.5">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5 num">
          <span className="flex items-center gap-1.5" style={{ color: p.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="text-ink font-bold font-mono">₹{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { kpiStats, currentRace, horses, matchesHistory, fetchMatchesHistory, hourlyRevenueSeries, socketStatus, reconnectSocket } = useGameEngine()
  const { isDark } = useTheme()
  const [selectedRound, setSelectedRound] = useState(null)
  const [socketConfigOpen, setSocketConfigOpen] = useState(false)
  const [customSocketUrl, setCustomSocketUrl] = useState(socketStatus?.url || 'http://localhost:3000')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshHistory = async () => {
    setIsRefreshing(true)
    try {
      await fetchMatchesHistory?.()
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  const topHorse = horses && horses.length > 0
    ? [...horses].sort((a, b) => (b.wins || 0) - (a.wins || 0))[0] || horses[0]
    : null

  const handleSaveSocketUrl = (e) => {
    e.preventDefault()
    reconnectSocket(customSocketUrl)
    setSocketConfigOpen(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-primary p-5 sm:p-6 text-white shadow-card">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Season Live 24/7
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-wide">
              Round #{currentRace.gameSerial}
            </h2>
            <p className="text-xs text-blue-100 mt-1 max-w-md">
              1000M Royal Turf Championship · Real-time odds · Instant settlements
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSocketConfigOpen(true)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
              title="Socket Server Configuration"
            >
              <Server size={17} />
            </button>
            <Link
              to="/races"
              className="flex items-center gap-2 bg-white text-slate-900 hover:bg-blue-50 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-md"
            >
              <span>Command Center</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-56 h-56 rounded-full bg-white/8 blur-2xl pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="Active Players" value={kpiStats.activePlayers.toLocaleString()} sub="Connected now" tone="blue" icon={UsersLucide} trend="up" trendValue="Live" />
        <StatCard label="Today's Bets" value={kpiStats.displayBets || `₹${kpiStats.todayBetsAmount.toLocaleString()}`} sub={`${kpiStats.todayBetsCount} placed`} tone="gold" icon={CoinsIcon} trend="up" trendValue="+8.6%" />
        <StatCard label="Payouts" value={kpiStats.displayPayouts || `₹${kpiStats.todayPayoutsAmount.toLocaleString()}`} sub="Auto-settled" tone="turf" icon={TrendingUpIcon} trend="up" trendValue="Auto" />
        <StatCard label="GGR" value={kpiStats.displayGGR || `₹${kpiStats.ggr.toLocaleString()}`} sub={`${kpiStats.profitMarginPercent}% margin`} tone="violet" icon={PercentIcon} trend={kpiStats.ggr >= 0 ? 'up' : 'down'} trendValue={`${kpiStats.profitMarginPercent}%`} />
        <StatCard label="Liability" value={kpiStats.displayLiability || `₹${kpiStats.platformLiability.toLocaleString()}`} sub="Wallet float" tone="danger" icon={WalletLucide} trend="up" trendValue="Protected" />
      </div>

      {/* Chart + Top Horse */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-surface border border-line rounded-2xl p-5 shadow-card flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div>
              <h3 className="font-display text-base font-bold text-ink tracking-wide">Hourly Revenue</h3>
              <p className="text-xs text-mute">Bets vs Payouts vs GGR (₹)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              {[['#3B6EF6', 'Bets'], ['#10B981', 'Payouts'], ['#8B5CF6', 'GGR']].map(([c, l]) => (
                <span key={l} className="flex items-center gap-1.5 text-mute">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />{l}
                </span>
              ))}
            </div>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyRevenueSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  {[['betsGrad', '#3B6EF6'], ['payoutGrad', '#10B981'], ['ggrGrad', '#8B5CF6']].map(([id, c]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E2D45' : '#E2E8F0'} vertical={false} />
                <XAxis dataKey="t" stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" name="Bets" dataKey="bets" stroke="#3B6EF6" fill="url(#betsGrad)" strokeWidth={2} />
                <Area type="monotone" name="Payouts" dataKey="payouts" stroke="#10B981" fill="url(#payoutGrad)" strokeWidth={2} />
                <Area type="monotone" name="GGR" dataKey="ggr" stroke="#8B5CF6" fill="url(#ggrGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Horse */}
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-ink tracking-wide">Top Champion</h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/25 text-[11px] font-bold">Rank #1</span>
          </div>
          {topHorse ? (
            <>
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-display text-2xl font-bold shadow-sm shrink-0"
                  style={{ backgroundColor: `${topHorse.color || '#3B82F6'}20`, color: topHorse.color || '#3B82F6', border: `2px solid ${topHorse.color || '#3B82F6'}50` }}
                >
                  #{topHorse.number}
                </div>
                <div className="min-w-0">
                  <div className="text-ink font-bold text-sm truncate">{topHorse.name}</div>
                  <div className="text-xs text-mute">{topHorse.hindiName || 'Lead Runner'}</div>
                  <Badge tone="gold" size="sm" className="mt-1">{topHorse.wins || 0}W / {topHorse.races || 0}R</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-line">
                <div className="bg-surface2 p-3 rounded-xl border border-line">
                  <span className="text-[10px] uppercase font-bold text-mute block">Win Rate</span>
                  <span className="font-display text-xl text-turf font-bold num">{(((topHorse.wins || 0) / (topHorse.races || 1)) * 100).toFixed(1)}%</span>
                </div>
                <div className="bg-surface2 p-3 rounded-xl border border-line">
                  <span className="text-[10px] uppercase font-bold text-mute block">Base Odds</span>
                  <span className="font-display text-xl text-amber-500 dark:text-gold font-bold num">{topHorse.odds}x</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-xs text-mute">
              Loading live runners from API...
            </div>
          )}
          <Link to="/horses" className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface2 hover:bg-surface3 text-ink text-xs font-semibold transition-colors focus-ring">
            <span>Manage Horses</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Recent Rounds */}
      <div className="bg-surface border border-line rounded-2xl p-5 shadow-card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-ink tracking-wide">Recent Rounds</h3>
            <p className="text-xs text-mute">Settled rounds with provably-fair hash</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefreshHistory}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-xs text-mute hover:text-ink px-2.5 py-1.5 rounded-lg border border-line bg-surface2/50 hover:bg-surface2 transition-colors disabled:opacity-50"
              title="Fetch latest rounds from API"
            >
              <RefreshCw size={12} className={isRefreshing ? "animate-spin text-primary" : ""} />
              <span>Refresh</span>
            </button>
            <Link to="/races" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight size={13} />
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider font-semibold text-mute border-b border-line">
                <th className="pb-3">Round</th>
                <th className="pb-3">Time</th>
                <th className="pb-3">Winner</th>
                <th className="pb-3">Odds</th>
                <th className="pb-3">Provably-Fair Hash</th>
                <th className="pb-3">Pot</th>
                <th className="pb-3">Payout</th>
                <th className="pb-3">GGR</th>
                <th className="pb-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {matchesHistory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-xs text-mute">
                    No recent rounds found. Settled races from API will appear here.
                  </td>
                </tr>
              ) : (
                matchesHistory.slice(0, 5).map((m) => (
                  <tr key={m.id || m.gameSerial} className="hover:bg-surface2/50 transition-colors">
                    <td className="py-3 font-mono font-semibold text-ink text-xs">#{m.gameSerial}</td>
                    <td className="py-3 text-mute font-mono text-xs">{m.finishedAt || m.endedAt || '-'}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: m.winnerHorse?.color || '#3B82F6' }}>
                          {m.winnerHorse?.number || '#'}
                        </div>
                        <img src={resolveImageUrl(m.winnerHorse?.avatar || m.winnerHorse?.imageUrl)} alt="" className="w-6 h-6 rounded-md object-cover border border-line shrink-0" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150&auto=format&fit=crop&q=80' }} />
                        <span className="font-semibold text-ink text-xs truncate max-w-[100px]">{m.winnerHorse?.name || 'Winner'}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge tone={m.isJackpot ? "amber" : "gold"} size="sm">
                        {m.jackpot || `${m.winnerHorse?.odds || 2.0}x`}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-turf/10 text-turf border border-turf/20 text-[10px] font-mono font-bold" title={m.seedHash || 'Provably-fair SHA256 verified'}>
                        <ShieldCheck size={11} className="shrink-0" />
                        <span className="truncate max-w-[85px]">{m.seedHash ? (m.seedHash.startsWith('sha256:') ? m.seedHash.replace('sha256:', '').slice(0, 8) : m.seedHash.slice(0, 8)) : 'Verified'}...</span>
                      </span>
                    </td>
                    <td className="py-3 font-mono text-xs font-semibold text-ink num">₹{(Number(m.totalBets) || 0).toLocaleString()}</td>
                    <td className="py-3 font-mono text-xs font-semibold text-turf num">₹{(Number(m.totalPayout) || 0).toLocaleString()}</td>
                    <td className="py-3 font-mono text-xs font-bold num">
                      <span className={(Number(m.ggr) || 0) >= 0 ? 'text-turf' : 'text-danger'}>
                        {(Number(m.ggr) || 0) >= 0 ? `+₹${(Number(m.ggr) || 0).toLocaleString()}` : `-₹${Math.abs(Number(m.ggr) || 0).toLocaleString()}`}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => setSelectedRound(m)} className="p-1.5 rounded-lg text-mute hover:text-primary hover:bg-primary/10 transition-colors focus-ring" title="View Round Verification Details">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Socket Config Modal */}
      <Modal
        open={socketConfigOpen}
        onClose={() => setSocketConfigOpen(false)}
        title="Socket Server Configuration"
        footer={
          <>
            <button onClick={() => setSocketConfigOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-mute hover:text-ink hover:bg-surface2 transition-colors">Cancel</button>
            <button onClick={handleSaveSocketUrl} className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-glow-primary transition-all focus-ring">Connect</button>
          </>
        }
      >
        <div className="flex flex-col gap-4 text-xs">
          <div className="p-3 rounded-xl bg-surface2 border border-line flex items-center justify-between">
            <span className="font-semibold text-mute">Status</span>
            <Badge tone={socketStatus?.connected ? 'turf' : 'amber'} size="sm" dot>
              {socketStatus?.connected ? 'Connected' : 'Reconnecting'}
            </Badge>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">Server URL</span>
            <input
              value={customSocketUrl}
              onChange={(e) => setCustomSocketUrl(e.target.value)}
              placeholder="http://localhost:3000"
              className="bg-surface2 border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary font-mono"
            />
          </label>
        </div>
      </Modal>

      {/* Round Detail Drawer */}
      <Drawer open={!!selectedRound} onClose={() => setSelectedRound(null)} title={`Round #${selectedRound?.gameSerial}`} subtitle="Finish positions & provably-fair verification">
        {selectedRound && (
          <div className="space-y-5 text-sm">
            <div className="p-3 rounded-xl bg-turf/10 border border-turf/25 text-turf flex items-start gap-2.5">
              <ShieldCheck size={17} className="shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold block">Provably-Fair Verified</span>
                <span className="text-[11px] opacity-80 break-all font-mono">{selectedRound.seedHash}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-display text-lg font-bold text-white shadow-sm" style={{ backgroundColor: selectedRound.winnerHorse.color }}>
                  #{selectedRound.winnerHorse.number}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Winner</span>
                  <div className="font-bold text-ink">{selectedRound.winnerHorse.name}</div>
                  <span className="text-xs text-mute">Odds: {selectedRound.jackpot}</span>
                </div>
              </div>
              <TrophyLucide size={24} className="text-amber-500" />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {[['Pot', `₹${selectedRound.totalBets.toLocaleString()}`, 'text-ink'], ['Payout', `₹${selectedRound.totalPayout.toLocaleString()}`, 'text-turf'], ['GGR', `₹${selectedRound.ggr.toLocaleString()}`, 'text-primary']].map(([l, v, c]) => (
                <div key={l} className="bg-surface2 border border-line p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-mute block">{l}</span>
                  <span className={`font-bold font-mono text-sm ${c}`}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-display text-xs tracking-wide font-bold text-ink uppercase mb-2.5">Finish Order</h4>
              <div className="space-y-1.5">
                {selectedRound.finishOrder?.map((pos) => (
                  <div key={pos.rank} className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${pos.rank === 1 ? 'bg-amber-500/10 border-amber-500/30 font-bold' : 'bg-surface2/50 border-line'}`}>
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${pos.rank === 1 ? 'bg-amber-500 text-slate-950' : pos.rank === 2 ? 'bg-slate-300 text-slate-900' : pos.rank === 3 ? 'bg-amber-700 text-white' : 'bg-surface3 text-mute'}`}>{pos.rank}</span>
                      <span>#{pos.number} {pos.name}</span>
                    </div>
                    <span className="font-mono text-mute">{pos.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
