import { useState, useEffect } from 'react'
import {
  Receipt,
  Search,
  Filter,
  Download,
  Coins,
  TrendingUp,
  TrendingDown,
  Trash2,
  CheckCircle2,
  Clock,
  Play,
  RefreshCw,
  Radio,
  Trophy,
  ShieldCheck,
  Eye
} from 'lucide-react'
import { useGameEngine } from '../hooks/useGameEngine.js'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import { exportToCSV } from '../utils/export.js'
import { resolveImageUrl } from '../utils/imageUrl.js'

export default function Bets() {
  const { currentRace, liveBets, allBets, horses, users, socketStatus, fetchLiveLedger, liveLedgerLoading } = useGameEngine()
  const [activeTab, setActiveTab] = useState("live") // 'live' or 'history'

  // Live stream filters
  const [liveStatusFilter, setLiveStatusFilter] = useState("all") // 'all', 'PENDING', 'WON', 'LOST'
  const [liveSearchQuery, setLiveSearchQuery] = useState("")

  // History filters
  const [filterStatus, setFilterStatus] = useState("all") // 'all', 'won', 'lost'
  const [searchQuery, setSearchQuery] = useState("")

  // Filtered Live Bets Stream
  const filteredLiveBets = liveBets.filter((b) => {
    const query = liveSearchQuery.toLowerCase()
    const matchesSearch =
      String(b.id || '').toLowerCase().includes(query) ||
      String(b.user || '').toLowerCase().includes(query) ||
      String(b.name || '').toLowerCase().includes(query) ||
      String(b.username || '').toLowerCase().includes(query) ||
      String(b.maskedUsername || '').toLowerCase().includes(query) ||
      String(b.gameCode || '').toLowerCase().includes(query) ||
      String(b.horseName || '').toLowerCase().includes(query) ||
      String(b.horseNumber || b.horseSerial || '').includes(query) ||
      String(b.raceSerial || '').includes(query)

    const currentStatus = String(b.status || b.result || '').toUpperCase()
    const matchesStatus =
      liveStatusFilter === "all" ||
      currentStatus === liveStatusFilter.toUpperCase() ||
      (liveStatusFilter === "PENDING" && currentStatus === "PENDING") ||
      (liveStatusFilter === "WON" && (currentStatus === "WON" || currentStatus === "WIN")) ||
      (liveStatusFilter === "LOST" && (currentStatus === "LOST" || currentStatus === "LOSE"))

    return matchesSearch && matchesStatus
  })

  // Filtered History
  const filteredHistory = allBets.filter((b) => {
    const matchesSearch =
      String(b.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(b.user || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(b.gameCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(b.raceSerial || b.round || '').includes(searchQuery) ||
      String(b.horseName || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || b.result === filterStatus
    return matchesSearch && matchesStatus
  })

  // Auto-fetch live ledger on mount or when current round changes
  useEffect(() => {
    if (currentRace?.gameSerial) {
      fetchLiveLedger({
        game_serial: currentRace.gameSerial,
        status: liveStatusFilter !== 'all' ? liveStatusFilter : undefined,
        limit: 50
      })
    }
  }, [currentRace?.gameSerial, liveStatusFilter])

  // Manual refresh from GET /api/bets/live-ledger
  const handleRefreshLiveLedger = () => {
    fetchLiveLedger({
      game_serial: currentRace.gameSerial,
      status: liveStatusFilter !== 'all' ? liveStatusFilter : undefined,
      limit: 50
    })
  }

  // Export
  const handleExportBets = (dataToExport, fileName) => {
    const formatted = dataToExport.map((b) => ({
      betId: b.id,
      userId: b.userId || '',
      username: b.user || b.username || '',
      name: b.name || '',
      maskedUsername: b.maskedUsername || '',
      userRole: b.userRole || 'user',
      gameCode: b.gameCode || '',
      raceSerial: b.raceSerial || b.gameSerial || b.round || currentRace.gameSerial,
      horse: `#${b.horseNumber || b.horseSerial || ''} ${b.horseName || ''}`,
      amount: b.amount,
      displayAmount: b.displayAmount || `₹${b.amount}`,
      odds: b.odds,
      potentialPayout: b.potentialPayout || (b.amount * b.odds),
      payoutAmount: b.payoutAmount || b.payout || 0,
      status: b.status || b.result || 'PENDING',
      createdAt: b.createdAt || b.timestamp || '',
    }))
    exportToCSV(formatted, fileName)
  }

  // Quick stats
  const totalVolume = allBets.reduce((s, b) => s + b.amount, 0)
  const totalWon = allBets.filter((b) => b.result === 'won').reduce((s, b) => s + b.payout, 0)
  const netMargin = totalVolume - totalWon

  // Live pot calculation from current filtered or all live bets
  const liveTotalAmount = liveBets.reduce((s, b) => s + (Number(b.amount) || 0), 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-display text-2xl font-bold tracking-wide text-ink">
              Bet Ledger
            </h2>
            <Badge tone="turf" size="sm" dot>
              Live
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-mute">
            Real-time bets via Socket (<span className="font-mono text-primary font-semibold">admin:bet_live</span>) & REST (<span className="font-mono text-primary font-semibold">/api/bets/live-ledger</span>).
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-surface border border-line rounded-2xl p-1 shadow-sm shrink-0">
          <button
            onClick={() => setActiveTab("live")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === "live"
              ? "bg-primary text-white shadow-glow-primary"
              : "text-mute hover:text-ink"
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-turf live-dot" />
            <span>Live ({liveBets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === "history"
              ? "bg-primary text-white shadow-glow-primary"
              : "text-mute hover:text-ink"
              }`}
          >
            <Receipt size={15} />
            <span>History ({allBets.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "live" ? (
        <div className="space-y-4">
          {/* Live Stream Status & Pot Metrics Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 1. Round Serial & Stage */}
            <div className="bg-surface border border-line rounded-2xl p-4 shadow-card flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-display text-lg font-bold shrink-0">
                🏁
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-mute tracking-wider block">
                  Round
                </span>
                <div className="font-display text-lg font-bold text-ink font-mono truncate">
                  #{currentRace.gameSerial}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge tone={currentRace.stage === 'BETTING_OPEN' ? 'turf' : 'amber'} size="sm" dot>
                    {currentRace.stage.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* 2. Total Live Volume */}
            <div className="bg-surface border border-line rounded-2xl p-4 shadow-card flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-display text-lg font-bold shrink-0">
                ₹
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-mute tracking-wider block">
                  Round Pot
                </span>
                <div className="font-display text-xl font-bold text-amber-600 dark:text-gold num truncate">
                  ₹{liveTotalAmount.toLocaleString()}
                </div>
                <span className="text-[11px] text-mute">{liveBets.length} total entries</span>
              </div>
            </div>

            {/* 3. Stream Channel & Socket Health */}
            <div className="bg-surface border border-line rounded-2xl p-4 shadow-card flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-violet/10 border border-violet/30 flex items-center justify-center text-violet font-display text-lg font-bold shrink-0">
                <Radio size={20} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-mute tracking-wider block">
                  Socket Channel
                </span>
                <div className="font-mono text-xs font-bold text-ink truncate">
                  admin:bet_live
                </div>
                <span className="text-[11px] text-turf font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-turf live-dot" />
                  Room: admin (Subscribed)
                </span>
              </div>
            </div>

            {/* 4. REST API Sync & Actions */}
            <div className="bg-surface border border-line rounded-2xl p-4 shadow-card flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-mute tracking-wider block">
                  REST Sync
                </span>
                <div className="text-xs text-mute font-mono truncate max-w-[130px]">
                  /api/bets/live-ledger
                </div>
                <span className="text-[11px] text-ink font-semibold">Limit: 50</span>
              </div>
              <button
                onClick={handleRefreshLiveLedger}
                disabled={liveLedgerLoading}
                className="p-2.5 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-ink transition-all focus-ring disabled:opacity-50"
                title="Fetch latest GET /api/bets/live-ledger"
              >
                <RefreshCw size={17} className={liveLedgerLoading ? "animate-spin text-primary" : ""} />
              </button>
            </div>
          </div>

          {/* Filter and Search Bar for Live Ledger */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-line rounded-2xl p-3 shadow-card">
            <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3 py-2 text-xs w-full sm:w-80">
              <Search size={15} className="text-mute shrink-0" />
              <input
                value={liveSearchQuery}
                onChange={(e) => setLiveSearchQuery(e.target.value)}
                placeholder="Search user (aka***), GameCode, horse, ID..."
                className="bg-transparent outline-none text-ink placeholder:text-mute w-full"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter */}
              <div className="flex bg-surface2 border border-line rounded-xl p-1 text-xs">
                {["all", "PENDING", "WON", "LOST"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setLiveStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg uppercase font-bold transition-colors ${liveStatusFilter === st
                      ? "bg-primary text-white shadow-sm"
                      : "text-mute hover:text-ink"
                      }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Export Live */}
              <button
                onClick={() => handleExportBets(filteredLiveBets, `live_ledger_${currentRace.gameSerial}_${Date.now()}.csv`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-xs font-semibold text-ink transition-colors focus-ring"
                title="Export visible live stream rows to CSV"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>

          {/* Admin Live Ledger Stream Table */}
          <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-card">
            <div className="px-5 py-3.5 border-b border-line flex items-center justify-between bg-surface2/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-turf live-dot" />
                <h3 className="font-display text-sm sm:text-base font-bold text-ink tracking-wide">
                  Live Transaction Ledger (Admin Stream)
                </h3>
              </div>
              <span className="text-xs text-mute font-mono">
                Showing {filteredLiveBets.length} of {liveBets.length} entries
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider font-semibold text-mute border-b border-line bg-surface2/50">
                    <th className="px-4 py-3.5">Bet ID</th>
                    <th className="px-4 py-3.5">User (Masked & GameCode)</th>
                    <th className="px-4 py-3.5">Runner Selected</th>
                    <th className="px-4 py-3.5">Amount (INR)</th>
                    <th className="px-4 py-3.5">Odds</th>
                    <th className="px-4 py-3.5">Potential / Payout</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Time (UTC/IST)</th>
                    <th className="px-4 py-3.5 text-right">Stream Event</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filteredLiveBets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-mute">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Radio size={24} className="text-mute animate-pulse" />
                          <span className="font-semibold text-xs">Waiting for bets on round #{currentRace.gameSerial}...</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLiveBets.map((b) => {
                      const isPending = !b.status || b.status === 'PENDING' || b.result === 'pending'
                      const isWon = b.status === 'WON' || b.result === 'won'
                      const isLost = b.status === 'LOST' || b.result === 'lost'

                      return (
                        <tr key={b.id} className="hover:bg-surface2/40 transition-colors">
                          {/* Bet ID */}
                          <td className="px-4 py-3.5 font-mono text-ink font-bold text-xs">
                            #{b.id}
                          </td>

                          {/* User details */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-bold text-ink flex items-center gap-1.5">
                                  <span>{b.name || b.user}</span>
                                  {b.maskedUsername && (
                                    <span className="text-[11px] font-mono text-mute">({b.maskedUsername})</span>
                                  )}
                                </div>
                                <div className="text-xs text-mute font-mono flex items-center gap-1.5">
                                  <span>{b.gameCode}</span>
                                  <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-surface2 text-mute">
                                    {b.userRole || 'user'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Runner Selected */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0 font-display"
                                style={{ backgroundColor: b.horseColor || '#3B82F6' }}
                              >
                                {b.horseNumber || b.horseSerial || 1}
                              </div>
                              {b.horseImageUrl && (
                                <img
                                  src={b.horseImageUrl}
                                  alt={b.horseName}
                                  className="w-7 h-7 rounded-lg object-cover object-center border border-line shrink-0"
                                  onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150&auto=format&fit=crop&q=80'
                                  }}
                                />
                              )}
                              <span className="font-semibold text-ink truncate max-w-[110px]">
                                {b.horseName || `Runner #${b.horseNumber || b.horseSerial}`}
                              </span>
                            </div>
                          </td>

                          {/* Bet Amount */}
                          <td className="px-4 py-3.5 font-mono num font-bold text-ink">
                            {b.displayAmount || `₹${Number(b.amount).toLocaleString()}`}
                          </td>

                          {/* Odds */}
                          <td className="px-4 py-3.5 font-mono text-amber-600 dark:text-gold font-bold">
                            {b.odds}x
                          </td>

                          {/* Potential / Payout */}
                          <td className="px-4 py-3.5 font-mono num font-bold">
                            {isWon ? (
                              <span className="text-turf">₹{(b.payoutAmount || b.potentialPayout || 0).toLocaleString()}</span>
                            ) : (
                              <span className="text-mute font-normal">₹{(b.potentialPayout || (b.amount * b.odds)).toLocaleString()}</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            {isWon ? (
                              <Badge tone="turf" size="sm">
                                WON
                              </Badge>
                            ) : isLost ? (
                              <Badge tone="danger" size="sm">
                                LOST
                              </Badge>
                            ) : (
                              <Badge tone="amber" size="sm" dot>
                                PENDING
                              </Badge>
                            )}
                          </td>

                          {/* Time */}
                          <td className="px-4 py-3.5 text-xs text-mute font-mono">
                            {b.timestamp || (b.createdAt ? new Date(b.createdAt).toLocaleTimeString('en-US', { hour12: false }) : '-')}
                          </td>

                          {/* Stream Event */}
                          <td className="px-4 py-3.5 text-right font-mono text-[10px] text-mute">
                            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                              admin:bet_live
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: All Bets Ledger (History) */
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface border border-line rounded-2xl p-4 shadow-card">
              <span className="text-xs uppercase font-bold text-mute tracking-wider">Total Wagered</span>
              <div className="font-display text-2xl text-ink font-bold num mt-1">₹{totalVolume.toLocaleString()}</div>
            </div>
            <div className="bg-surface border border-line rounded-2xl p-4 shadow-card">
              <span className="text-xs uppercase font-bold text-mute tracking-wider">Total Payouts</span>
              <div className="font-display text-2xl text-turf font-bold num mt-1">₹{totalWon.toLocaleString()}</div>
            </div>
            <div className="bg-surface border border-line rounded-2xl p-4 shadow-card">
              <span className="text-xs uppercase font-bold text-mute tracking-wider">House Margin</span>
              <div className="font-display text-2xl text-primary font-bold num mt-1">₹{netMargin.toLocaleString()}</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-line rounded-2xl p-3 shadow-card">
            <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3 py-2 text-xs w-full sm:w-72">
              <Search size={15} className="text-mute shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bet ID, user, game code, round..."
                className="bg-transparent outline-none text-ink placeholder:text-mute w-full"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-surface2 border border-line rounded-xl p-1 text-xs">
                {["all", "won", "lost"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-colors ${filterStatus === st
                      ? "bg-primary text-white shadow-sm"
                      : "text-mute hover:text-ink"
                      }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <button
                onClick={handleExportBets}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-xs font-semibold text-ink transition-colors focus-ring"
              >
                <Download size={15} />
                <span>Export Ledger</span>
              </button>
            </div>
          </div>

          {/* All Bets History Table */}
          <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider font-semibold text-mute border-b border-line bg-surface2/50">
                    <th className="px-5 py-3.5">Bet ID</th>
                    <th className="px-5 py-3.5">User & Game Code</th>
                    <th className="px-5 py-3.5">Race Round</th>
                    <th className="px-5 py-3.5">Horse Runner</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Payout</th>
                    <th className="px-5 py-3.5">Net P&L</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-mute">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Receipt size={24} className="text-mute opacity-60" />
                          <span className="font-semibold text-xs">No historical bets found.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((b) => (
                      <tr key={b.id} className="hover:bg-surface2/40 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-ink font-semibold">{b.id}</td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-ink">{b.user || b.username || b.name}</div>
                          <div className="text-xs text-mute font-mono">{b.gameCode || b.maskedUsername || ''}</div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-mute font-mono">
                          {b.round || `R-${b.raceSerial || b.gameSerial}`}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: b.horseColor || '#3B82F6' }}
                            >
                              {b.horseNumber || b.horseSerial || '—'}
                            </div>
                            <span className="font-semibold text-ink">{b.horseName || `Runner #${b.horseNumber || b.horseSerial}`}</span>
                            <span className="text-xs text-amber-600 dark:text-gold font-bold">
                              ({b.odds}x)
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono num font-semibold text-ink">
                          ₹{(Number(b.amount) || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 font-mono num font-semibold text-turf">
                          {b.payout || b.payoutAmount ? `₹${(Number(b.payout || b.payoutAmount) || 0).toLocaleString()}` : "₹0"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`font-mono text-xs font-bold ${b.result === "won" || b.status === "WON" ? "text-turf" : "text-danger"
                              }`}
                          >
                            {b.result === "won" || b.status === "WON"
                              ? `+₹${((Number(b.payout || b.payoutAmount) || 0) - (Number(b.amount) || 0)).toLocaleString()}`
                              : `-₹${(Number(b.amount) || 0).toLocaleString()}`}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge tone={b.result === "won" || b.status === "WON" ? "turf" : b.result === "lost" || b.status === "LOST" ? "danger" : "amber"} size="sm">
                            {b.result || b.status || 'PENDING'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-mute font-mono text-right">
                          {b.timestamp || (b.createdAt ? new Date(b.createdAt).toLocaleTimeString('en-US', { hour12: false }) : '-')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
