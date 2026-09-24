import { useState, useEffect } from 'react'
import {
  Flag,
  History,
  SkipForward,
  RotateCcw,
  Trophy,
  Play,
  Pause,
  AlertTriangle,
  Eye,
  ShieldCheck,
  Search,
  CheckCircle,
  Download,
  Clock,
  Trash2,
  Sparkles,
  Zap,
  TrendingDown,
  RefreshCw,
  Cpu,
  HelpCircle,
  Crown,
  Calendar,
  Check,
  Flame,
  Coins,
  Timer,
  Layers,
  Dices,
  Sliders,
  Target,
  XCircle,
  CircleOff,
} from 'lucide-react'
import { useGameEngine } from '../hooks/useGameEngine.js'
import LiveRaceTrack from '../components/LiveRaceTrack.jsx'
import Badge from '../components/Badge.jsx'
import Drawer from '../components/Drawer.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { exportToCSV } from '../utils/export.js'
import { resolveImageUrl } from '../utils/imageUrl.js'

export default function Races() {
  const {
    currentRace,
    horses,
    matchesHistory,
    forceNextStage,
    forceSetWinner,
    extendRaceTime,
    clearForcedWinner,
    scheduledWinners,
    scheduledWinnersLoading,
    fetchScheduledWinners,
    voidCurrentRound,
    jackpot,
    jackpotConfig,
    jackpotLoading,
    scheduledJackpot,
    cancelScheduledJackpot,
    forceJackpot,
    clearForcedJackpot,
    updateJackpotConfig,
    settings,
  } = useGameEngine()

  const [activeTab, setActiveTab] = useState("monitor") // 'monitor' or 'history'
  const [selectedRound, setSelectedRound] = useState(null)

  // 1. Live 1-Click Winner Selection State
  const [confirmLiveWinnerTarget, setConfirmLiveWinnerTarget] = useState(null)
  const [isSubmittingLivePick, setIsSubmittingLivePick] = useState(false)

  // 2. Future Round Winner Scheduler Modal State
  const [futureModalOpen, setFutureModalOpen] = useState(false)
  const [futureGameSerial, setFutureGameSerial] = useState("")
  const [futureSelectedHorseSerial, setFutureSelectedHorseSerial] = useState(horses[0]?.number || 1)
  const [futureJackpotMultiplier, setFutureJackpotMultiplier] = useState("N")
  const [futureReason, setFutureReason] = useState("VIP Round Selection")
  const [isSubmittingFuture, setIsSubmittingFuture] = useState(false)

  // 3. Jackpot Auto-Trigger Configuration Modal State
  const [jackpotConfigModalOpen, setJackpotConfigModalOpen] = useState(false)
  const [tempJackpotConfig, setTempJackpotConfig] = useState({
    mode: jackpotConfig?.mode || 'PROBABILITY',
    targetMultiplier: jackpotConfig?.targetMultiplier || 'RANDOM',
    intervalRounds: jackpotConfig?.intervalRounds || 5,
    intervalSeconds: jackpotConfig?.intervalSeconds || 180,
    probabilityPercent: jackpotConfig?.probabilityPercent || 5,
    allowedMultipliers: jackpotConfig?.allowedMultipliers || [2, 3, 4],
    enabled: jackpotConfig?.enabled ?? true
  })
  const [isSavingJackpotConfig, setIsSavingJackpotConfig] = useState(false)

  // Void confirmation dialog
  const [voidConfirmOpen, setVoidConfirmOpen] = useState(false)
  const [historySearch, setHistorySearch] = useState("")
  const [actionNotice, setActionNotice] = useState(null)
  const [adminNote, setAdminNote] = useState("")

  // Auto-fetch scheduled queue on load
  useEffect(() => {
    fetchScheduledWinners()
  }, [])

  const filteredHistory = matchesHistory.filter((m) =>
    (m.gameSerial || "").includes(historySearch) ||
    (m.winnerHorse?.name || "").toLowerCase().includes(historySearch.toLowerCase())
  )

  // Handler: Confirm 1-Click Live Winner for Current Active Race
  const handleConfirmLiveWinner = async () => {
    if (!confirmLiveWinnerTarget) return
    setIsSubmittingLivePick(true)
    try {
      const res = await forceSetWinner({
        gameSerial: currentRace.gameSerial,
        horseSerial: confirmLiveWinnerTarget.number,
        reason: "Live Admin 1-Click Winner Selection"
      })
      setActionNotice(res?.message || `Horse #${confirmLiveWinnerTarget.number} (${confirmLiveWinnerTarget.name}) set as Guaranteed Winner for Live Race #${currentRace.gameSerial}`)
      setTimeout(() => setActionNotice(null), 5000)
      setConfirmLiveWinnerTarget(null)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmittingLivePick(false)
    }
  }

  // Handler: Set Live Race Jackpot Multiplier (Feature A: Standing Continuous Mode)
  const handleSetLiveJackpot = async (multiplierSlot) => {
    try {
      const res = await forceJackpot({
        multiplier: multiplierSlot,
        gameSerial: currentRace.gameSerial
      })
      setActionNotice(res?.message || (multiplierSlot === '1X' || multiplierSlot === 'N'
        ? `Jackpot turned OFF. Standard 1X payout active.`
        : `Standing Continuous Jackpot set to ${multiplierSlot}!`))
      setTimeout(() => setActionNotice(null), 5000)
    } catch (e) {
      console.error(e)
    }
  }

  // 4. Custom Input Box State (Feature B: Consecutive Rounds & Feature C: Time Duration)
  const [customTimeSeconds, setCustomTimeSeconds] = useState(180)
  const [customTimeMultiplier, setCustomTimeMultiplier] = useState("3X")
  const [isApplyingTime, setIsApplyingTime] = useState(false)

  const [customRoundCount, setCustomRoundCount] = useState(5)
  const [customRoundMultiplier, setCustomRoundMultiplier] = useState("3X")
  const [isApplyingRounds, setIsApplyingRounds] = useState(false)

  // Handler: Apply Time Duration Mode (POST /api/admin/races/jackpot with { durationSeconds, multiplier })
  const handleApplyTimeJackpot = async (e) => {
    if (e) e.preventDefault()
    if (!customTimeSeconds || Number(customTimeSeconds) <= 0) return
    setIsApplyingTime(true)
    try {
      const res = await forceJackpot({
        durationSeconds: Number(customTimeSeconds),
        multiplier: customTimeMultiplier
      })
      setActionNotice(res?.message || `Time Duration Jackpot (${customTimeMultiplier}) activated for ${customTimeSeconds} seconds!`)
      setTimeout(() => setActionNotice(null), 5000)
    } catch (err) {
      console.error(err)
    } finally {
      setIsApplyingTime(false)
    }
  }

  // Handler: Apply Consecutive Rounds Mode (POST /api/admin/races/jackpot with { rounds, multiplier })
  const handleApplyRoundJackpot = async (e) => {
    if (e) e.preventDefault()
    if (!customRoundCount || Number(customRoundCount) <= 0) return
    setIsApplyingRounds(true)
    try {
      const res = await forceJackpot({
        rounds: Number(customRoundCount),
        multiplier: customRoundMultiplier
      })
      setActionNotice(res?.message || `Consecutive Jackpot (${customRoundMultiplier}) activated for next ${customRoundCount} rounds!`)
      setTimeout(() => setActionNotice(null), 5000)
    } catch (err) {
      console.error(err)
    } finally {
      setIsApplyingRounds(false)
    }
  }

  // Handler: Save Jackpot Auto-Trigger Configuration
  const handleSaveJackpotConfig = async (e) => {
    if (e) e.preventDefault()
    setIsSavingJackpotConfig(true)
    try {
      const res = await updateJackpotConfig(tempJackpotConfig)
      setActionNotice(res?.message || `Jackpot mode '${tempJackpotConfig.mode}' configured successfully!`)
      setTimeout(() => setActionNotice(null), 5000)
      setJackpotConfigModalOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSavingJackpotConfig(false)
    }
  }

  // Handler: Schedule Future Round Winner & Optional Pre-Scheduled Jackpot
  const handleScheduleFutureWinner = async (e) => {
    if (e) e.preventDefault()
    if (!futureGameSerial.trim()) return
    setIsSubmittingFuture(true)
    try {
      const res = await forceSetWinner({
        gameSerial: futureGameSerial.trim(),
        horseSerial: Number(futureSelectedHorseSerial),
        reason: futureReason.trim() || "Pre-Scheduled Round Winner"
      })

      // If a jackpot multiplier is also pre-scheduled for this round
      if (futureJackpotMultiplier && futureJackpotMultiplier !== 'N') {
        await forceJackpot({
          gameSerial: futureGameSerial.trim(),
          multiplier: futureJackpotMultiplier,
          reason: futureReason.trim() || "Pre-Scheduled Jackpot Round"
        })
      }

      setActionNotice(res?.message || `Future Round #${futureGameSerial} pre-configured (Horse #${futureSelectedHorseSerial}${futureJackpotMultiplier !== 'N' ? ` + ${futureJackpotMultiplier} Jackpot` : ''})`)
      setTimeout(() => setActionNotice(null), 5000)
      setFutureModalOpen(false)
      setFutureGameSerial("")
      setFutureJackpotMultiplier("N")
      setFutureReason("VIP Round Selection")
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmittingFuture(false)
    }
  }

  // Handler: Clear / Revert Override
  const handleClearOverride = async (serial) => {
    const target = serial || currentRace.gameSerial
    const res = await clearForcedWinner(target)
    setActionNotice(res?.message || `Override cancelled for Round #${target}. Reverted to Smart Risk Engine.`)
    setTimeout(() => setActionNotice(null), 5000)
  }

  // Handler: Extend Time
  const handleExtendTime = async (seconds) => {
    const res = await extendRaceTime(seconds)
    setActionNotice(res?.message || `Added +${seconds}s to Live Race #${currentRace.gameSerial}`)
    setTimeout(() => setActionNotice(null), 4000)
  }

  const handleExportHistory = () => {
    const formatted = matchesHistory.map(m => ({
      raceSerial: m.gameSerial,
      distance: m.distance,
      startedAt: m.startedAt,
      finishedAt: m.finishedAt,
      winnerNumber: m.winnerHorse?.number,
      winnerName: m.winnerHorse?.name,
      odds: m.jackpot,
      totalBets: m.totalBets,
      totalPayout: m.totalPayout,
      ggr: m.ggr,
      status: m.status,
      seedHash: m.seedHash
    }))
    exportToCSV(formatted, `turf_races_history_${Date.now()}.csv`)
  }

  const smartPick = currentRace.smartRecommendedWinner
  const isCurrentRaceForced = currentRace.forcedWinner && String(currentRace.forcedWinner.gameSerial) === String(currentRace.gameSerial)
  const currentForcedHorseSerial = isCurrentRaceForced ? currentRace.forcedWinner.horseSerial : null
  const visibleStageRemaining = Math.max(0, Math.ceil(currentRace.stage === 'BETTING_OPEN'
    ? currentRace.stageRemaining + (settings?.lockWindow || 5)
    : currentRace.stageRemaining))

  return (
    <div className="p-4 sm:p-6 lg:p-7 flex flex-col gap-4 max-w-[1440px] mx-auto">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Sparkles size={18} className="text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-emerald-400/60 hover:text-emerald-300 text-xs">Dismiss</button>
        </div>
      )}

      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-wide text-ink">Live Race Control</h2>
          <p className="text-xs text-mute">Monitor the round, choose a runner, or use a quick admin action.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-surface border border-line rounded-2xl p-1 shadow-sm shrink-0">
          <button
            onClick={() => setActiveTab("monitor")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === "monitor"
              ? "bg-primary text-white shadow-glow-primary"
              : "text-mute hover:text-ink"
              }`}
          >
            <Flag size={15} />
            <span>Monitor</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === "history"
              ? "bg-primary text-white shadow-glow-primary"
              : "text-mute hover:text-ink"
              }`}
          >
            <History size={15} />
            <span>History ({matchesHistory.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "monitor" ? (
        <div className="space-y-4">
          {/* Status + Note Banner */}
          <div className={`rounded-2xl border shadow-card overflow-hidden transition-all ${isCurrentRaceForced
            ? 'border-amber-500/40 bg-amber-500/8'
            : 'border-line bg-surface'
            }`}>
            {/* Top row: status + controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCurrentRaceForced ? 'bg-amber-500/20 text-amber-500' : 'bg-turf/15 text-turf'
                  }`}>
                  {isCurrentRaceForced ? <Crown size={18} /> : <Cpu size={18} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-sm text-ink">
                      {isCurrentRaceForced ? `Override: Horse #${currentForcedHorseSerial} (${currentRace.forcedWinner.horseName})` : 'Auto selection active'}
                    </span>
                    <Badge tone={isCurrentRaceForced ? 'amber' : 'turf'} size="sm">
                      {isCurrentRaceForced ? 'Manual' : 'Auto'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-mute mt-0.5">
                    Race #{currentRace.gameSerial} · {currentRace.stage.replace(/_/g, ' ')} · {visibleStageRemaining}s remaining
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {isCurrentRaceForced && (
                  <button onClick={() => handleClearOverride()} className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface2 border border-line text-xs font-semibold text-danger transition-colors">
                    Clear Override
                  </button>
                )}
                <button
                  onClick={() => { setFutureGameSerial(String((Number(currentRace.gameSerial) + 1) || 20260921008)); setFutureModalOpen(true) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-glow-primary transition-all"
                >
                  <Calendar size={13} /><span>Schedule</span>
                </button>
                <button onClick={() => handleExtendTime(10)} className="px-3 py-1.5 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-xs font-semibold text-ink transition-colors">+10s</button>
                <button onClick={forceNextStage} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-glow-primary">
                  <SkipForward size={13} /> Next
                </button>
                <button onClick={() => setVoidConfirmOpen(true)} className="p-1.5 rounded-xl bg-danger/10 border border-danger/25 text-danger" title="Void round">
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Note input row */}
            <div className="px-4 py-2.5 border-t border-line/50 bg-surface2/40 flex items-center gap-3">
              <span className="text-[11px] font-semibold text-mute uppercase tracking-wider shrink-0">Note</span>
              <input
                type="text"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add an admin note for this round..."
                className="flex-1 bg-transparent outline-none text-xs text-ink placeholder:text-mute/60 font-medium"
              />
              {adminNote && (
                <button onClick={() => setAdminNote('')} className="text-[11px] text-mute hover:text-danger transition-colors shrink-0">Clear</button>
              )}
            </div>
          </div>

          {/* JACKPOT CONTROL SYSTEM (3 MODES) */}
          {(() => {
            const isTimeActive = (scheduledJackpot?.type === 'time_duration' || scheduledJackpot?.type === 'time') && scheduledJackpot?.secondsRemaining > 0
            const isRoundActive = (scheduledJackpot?.type === 'consecutive_rounds' || scheduledJackpot?.type === 'round') && scheduledJackpot?.roundsRemaining > 0
            const isStandingActive = scheduledJackpot?.type === 'standing' && scheduledJackpot?.multiplier && scheduledJackpot?.multiplier !== '1X' && scheduledJackpot?.multiplier !== 'N'
            const isJackpotActive = isTimeActive || isRoundActive || isStandingActive || (jackpot?.isJackpot && jackpot?.multiplierLabel !== '1X' && jackpot?.multiplierLabel !== 'N')

            return (
              <div className={`rounded-2xl border transition-all shadow-card overflow-hidden ${isTimeActive
                ? 'border-blue-500/60 ring-2 ring-blue-500/30 bg-gradient-to-br from-blue-500/10 via-slate-900/40 to-surface shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                : isRoundActive
                  ? 'border-amber-500/60 ring-2 ring-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900/40 to-surface shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                  : isStandingActive
                    ? 'border-emerald-500/60 ring-2 ring-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-slate-900/40 to-surface shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                    : isJackpotActive
                      ? 'border-amber-500/60 ring-2 ring-amber-500/30 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-surface shadow-glow-gold'
                      : 'border-line bg-surface'
                }`}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-line/60">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${isTimeActive
                      ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                      : isRoundActive
                        ? 'bg-amber-500 text-slate-950 shadow-glow-gold'
                        : isStandingActive
                          ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                          : isJackpotActive
                            ? 'bg-amber-500 text-slate-950 shadow-glow-gold'
                            : 'bg-surface2 border border-line text-mute'
                      }`}>
                      <Coins size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-sm font-bold text-ink tracking-wide">Jackpot Control System</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 transition-all ${isTimeActive
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                          : isRoundActive
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                            : isStandingActive
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                              : isJackpotActive
                                ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-glow-gold'
                                : 'bg-surface2 text-mute border-line'
                          }`}>
                          <span className={`w-2 h-2 rounded-full ${isTimeActive ? 'bg-blue-400 animate-ping' :
                            isRoundActive || isJackpotActive ? 'bg-amber-400 animate-ping' :
                              isStandingActive ? 'bg-emerald-400 animate-ping' :
                                'bg-mute/40'
                            }`} />
                          <span className="flex items-center gap-1">
                            {isTimeActive ? (
                              <>
                                <Timer size={11} className="text-blue-400" />
                                <span>{scheduledJackpot.multiplier} DURATION ({scheduledJackpot.secondsRemaining}s)</span>
                              </>
                            ) : isRoundActive ? (
                              <>
                                <Layers size={11} className="text-amber-400" />
                                <span>{scheduledJackpot.multiplier} CONSECUTIVE ({scheduledJackpot.roundsRemaining}/{scheduledJackpot.initialRounds} RDS)</span>
                              </>
                            ) : isStandingActive ? (
                              <>
                                <Zap size={11} className="text-emerald-400" />
                                <span>{scheduledJackpot.multiplier} CONTINUOUS STANDING</span>
                              </>
                            ) : isJackpotActive ? (
                              <>
                                <Flame size={11} className="text-amber-500" />
                                <span>{jackpot.multiplierLabel} ACTIVE</span>
                              </>
                            ) : (
                              <span>1X Standard (Jackpot OFF)</span>
                            )}
                          </span>
                        </span>
                      </div>
                      <p className="text-[11px] text-mute mt-0.5">Round #{currentRace.gameSerial} • API: <span className="font-mono text-primary font-bold">POST /api/admin/races/jackpot</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(isTimeActive || isRoundActive || isStandingActive || isJackpotActive) && (
                      <button
                        onClick={async () => {
                          await clearForcedJackpot(currentRace.gameSerial)
                          setActionNotice("Jackpot reset to 1X Standard payout.")
                          setTimeout(() => setActionNotice(null), 4000)
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-danger/10 hover:bg-danger/20 border border-danger/30 text-xs font-bold text-danger transition-all focus-ring"
                      >
                        <RotateCcw size={13} />
                        <span>Turn OFF / 1X</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setTempJackpotConfig({
                          mode: jackpotConfig?.mode || 'PROBABILITY',
                          targetMultiplier: jackpotConfig?.targetMultiplier || 'RANDOM',
                          intervalRounds: jackpotConfig?.intervalRounds || 5,
                          intervalSeconds: jackpotConfig?.intervalSeconds || 180,
                          probabilityPercent: jackpotConfig?.probabilityPercent || 5,
                          allowedMultipliers: jackpotConfig?.allowedMultipliers || [2, 3, 4],
                          enabled: jackpotConfig?.enabled ?? true
                        })
                        setJackpotConfigModalOpen(true)
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-xs font-semibold text-ink transition-colors focus-ring"
                    >
                      <Sparkles size={13} className="text-amber-500" />
                      <span>Auto Rules</span>
                    </button>
                  </div>
                </div>

                {/* 🌟 ACTIVE STATUS NOTIFICATION BANNERS 🌟 */}
                {/* Feature C: Time Duration Mode Banner */}
                {isTimeActive && (
                  <div className="px-5 py-2.5 bg-blue-500/15 dark:bg-blue-500/20 border-b border-blue-500/30 flex items-center justify-between text-xs animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600 dark:bg-blue-500"></span>
                      </span>
                      <span className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                        <Timer size={14} className="text-blue-700 dark:text-blue-400 shrink-0" />
                        <span>⏱️ Feature C Active: All rounds for next <span className="font-mono text-blue-950 dark:text-white font-black text-sm bg-blue-500/20 dark:bg-blue-500/30 px-1.5 py-0.5 rounded border border-blue-500/40">{scheduledJackpot.secondsRemaining}s</span> ({Math.floor(scheduledJackpot.secondsRemaining / 60)}m {scheduledJackpot.secondsRemaining % 60}s) have <span className="text-blue-950 dark:text-amber-300 font-black bg-blue-500/20 dark:bg-amber-500/20 px-2 py-0.5 rounded border border-blue-500/30 dark:border-amber-500/30">{scheduledJackpot.multiplier} Jackpot</span>!</span>
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        await cancelScheduledJackpot(currentRace.gameSerial)
                        setActionNotice("Time duration mode cancelled. Reverted to 1X.")
                        setTimeout(() => setActionNotice(null), 3000)
                      }}
                      className="text-[11px] font-bold text-blue-950 dark:text-blue-200 hover:text-white hover:bg-blue-600 bg-blue-500/20 dark:bg-blue-600/30 px-2.5 py-1 rounded-lg border border-blue-500/40 dark:border-blue-400/30 transition-all flex items-center gap-1 shadow-xs"
                    >
                      <XCircle size={12} />
                      <span>Cancel Duration</span>
                    </button>
                  </div>
                )}

                {/* Feature B: Consecutive Rounds Mode Banner */}
                {isRoundActive && (
                  <div className="px-5 py-2.5 bg-amber-500/20 dark:bg-amber-500/20 border-b border-amber-500/40 flex items-center justify-between text-xs animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600 dark:bg-amber-500"></span>
                      </span>
                      <span className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                        <Layers size={14} className="text-amber-700 dark:text-amber-400 shrink-0" />
                        <span>🔥 Feature B Active: Next <span className="font-mono text-amber-950 dark:text-white font-black text-sm bg-amber-500/30 dark:bg-amber-500/30 px-1.5 py-0.5 rounded border border-amber-600/40 dark:border-amber-500/40">{scheduledJackpot.roundsRemaining}</span> round(s) continuous jackpot (Round {scheduledJackpot.initialRounds - scheduledJackpot.roundsRemaining + 1} of {scheduledJackpot.initialRounds}) ➔ <span className="text-amber-950 dark:text-amber-300 font-black bg-amber-500/30 dark:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-600/40 dark:border-amber-500/30">{scheduledJackpot.multiplier} Multiplier</span>!</span>
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        await cancelScheduledJackpot(currentRace.gameSerial)
                        setActionNotice("Consecutive rounds mode cancelled. Reverted to 1X.")
                        setTimeout(() => setActionNotice(null), 3000)
                      }}
                      className="text-[11px] font-bold text-amber-950 dark:text-amber-200 hover:text-white hover:bg-amber-600 bg-amber-500/25 dark:bg-amber-600/30 px-2.5 py-1 rounded-lg border border-amber-600/40 dark:border-amber-400/30 transition-all flex items-center gap-1 shadow-xs"
                    >
                      <XCircle size={12} />
                      <span>Cancel Rounds</span>
                    </button>
                  </div>
                )}

                {/* Feature A: Continuous Standing Mode Banner */}
                {isStandingActive && !isTimeActive && !isRoundActive && (
                  <div className="px-5 py-2.5 bg-emerald-500/15 dark:bg-emerald-500/20 border-b border-emerald-500/30 flex items-center justify-between text-xs animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600 dark:bg-emerald-500"></span>
                      </span>
                      <span className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                        <Zap size={14} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                        <span>🔘 Feature A Active: Continuous Standing Jackpot <span className="text-emerald-950 dark:text-amber-300 font-black bg-emerald-500/20 dark:bg-amber-500/20 px-2 py-0.5 rounded border border-emerald-500/30 dark:border-amber-500/30">{scheduledJackpot.multiplier}</span> applied on every round until changed or turned OFF!</span>
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        await clearForcedJackpot(currentRace.gameSerial)
                        setActionNotice("Continuous standing mode turned OFF. Reverted to 1X.")
                        setTimeout(() => setActionNotice(null), 3000)
                      }}
                      className="text-[11px] font-bold text-emerald-950 dark:text-emerald-200 hover:text-white hover:bg-emerald-600 bg-emerald-500/20 dark:bg-emerald-600/30 px-2.5 py-1 rounded-lg border border-emerald-500/40 dark:border-emerald-400/30 transition-all flex items-center gap-1 shadow-xs"
                    >
                      <XCircle size={12} />
                      <span>Turn OFF</span>
                    </button>
                  </div>
                )}

                {/* Mode description header */}
                <div className="px-5 py-2.5 bg-surface2/50 border-b border-line/40 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={13} className="text-amber-500" />
                    <span>🔘 Feature A: Continuous Standing Mode (Select Button to Keep ON)</span>
                  </span>
                  <span className="text-[10px] text-mute font-mono">POST /api/admin/races/jackpot</span>
                </div>

                {/* Direct Multiplier tiles (Feature A: Standing Mode) */}
                <div className="p-4 grid grid-cols-5 gap-2.5">
                  {[
                    { slot: '1X', label: '1X', sub: 'Standard (OFF)', formula: 'Bet × Odds × 1', isRandom: false },
                    { slot: '2X', label: '2X', sub: 'Continuous', formula: 'Bet × Odds × 2', isRandom: false },
                    { slot: '3X', label: '3X', sub: 'Continuous', formula: 'Bet × Odds × 3', isRandom: false },
                    { slot: '4X', label: '4X', sub: 'Continuous', formula: 'Bet × Odds × 4', isRandom: false },
                    { slot: 'RANDOM', label: 'Random', sub: 'Continuous 2/3/4X', formula: 'Dynamic Round Payout', isRandom: true },
                  ].map(({ slot, label, sub, formula, isRandom }) => {
                    const isTileActive = !isTimeActive && !isRoundActive && (
                      slot === '1X'
                        ? (!isStandingActive && (!jackpot.isJackpot || jackpot.multiplierLabel === '1X' || jackpot.multiplierLabel === 'N'))
                        : isStandingActive
                          ? scheduledJackpot.multiplier === slot
                          : (jackpot.multiplierLabel === slot)
                    )

                    return (
                      <button
                        key={slot}
                        onClick={() => handleSetLiveJackpot(slot)}
                        disabled={jackpotLoading}
                        className={`relative flex flex-col items-center justify-center gap-1 py-3.5 px-2 rounded-xl border text-center transition-all focus-ring disabled:opacity-60 ${isTileActive
                          ? slot === '1X'
                            ? 'bg-primary/20 border-primary ring-2 ring-primary/60 shadow-glow-primary'
                            : 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-[1.02]'
                          : 'bg-surface2 hover:bg-surface3 border-line hover:border-primary/40 opacity-85 hover:opacity-100'
                          }`}
                      >
                        {isRandom ? (
                          <div className="flex flex-col items-center gap-0.5 my-0.5">
                            <Dices size={20} className={isTileActive ? 'text-amber-400' : 'text-primary'} />
                            <span className="text-[11px] font-black uppercase tracking-wider text-ink">Random</span>
                          </div>
                        ) : (
                          <span className={`font-display text-xl font-black ${isTileActive
                            ? slot === '1X' ? 'text-primary' : 'text-amber-400'
                            : 'text-ink'
                            }`}>{label}</span>
                        )}
                        <span className="text-[10px] text-mute font-medium">{sub}</span>
                        <span className="text-[9px] font-mono text-mute/70 mt-0.5">{formula}</span>
                        {isTileActive && (
                          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* 🎯 CUSTOM INPUT BOXES (Feature B: Consecutive Rounds & Feature C: Time Duration) 🎯 */}
                <div className="p-4 border-t border-line/40 bg-surface2/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={13} className="text-amber-500" />
                      <span>Consecutive Rounds (Feature B) & Time Duration (Feature C)</span>
                    </span>
                    <span className="text-[10px] text-mute font-mono">POST /api/admin/races/jackpot</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* 1. Feature C: Time Duration Mode */}
                    <div className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 shadow-xs transition-all relative overflow-hidden ${isTimeActive
                      ? 'border-blue-500 ring-2 ring-blue-500/60 shadow-[0_0_25px_rgba(59,130,246,0.3)] bg-gradient-to-br from-blue-500/20 via-blue-900/10 to-surface'
                      : 'bg-surface border-line'
                      }`}>
                      {/* Active indicator top bar */}
                      {isTimeActive && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500">
                          <div
                            className="h-full bg-blue-300 transition-all duration-1000"
                            style={{
                              width: `${Math.min(100, Math.max(0, (((scheduledJackpot.initialSeconds - scheduledJackpot.secondsRemaining) / (scheduledJackpot.initialSeconds || 1)) * 100)))}%`
                            }}
                          />
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${isTimeActive
                            ? 'bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                            : 'bg-blue-500/10 text-blue-500'
                            }`}>
                            <Timer size={15} />
                          </div>
                          <div>
                            <h4 className="font-display text-xs font-bold text-ink flex items-center gap-1.5">
                              <span>⏱️ Feature C: Time Duration Mode</span>
                              {isTimeActive && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-500 text-white animate-pulse">
                                  ACTIVE
                                </span>
                              )}
                            </h4>
                            <p className="text-[10px] text-mute">Continuous jackpot for all rounds in next N seconds</p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-all flex items-center gap-1 ${isTimeActive
                          ? 'bg-blue-500 text-white border-blue-400 font-black shadow-sm'
                          : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          }`}>
                          {isTimeActive ? (
                            <>
                              <Timer size={10} />
                              <span>{scheduledJackpot.secondsRemaining}s remaining</span>
                            </>
                          ) : (
                            'durationSeconds'
                          )}
                        </span>
                      </div>

                      {/* Active Countdown Visual Banner */}
                      {isTimeActive && (
                        <div className="p-2.5 rounded-lg bg-blue-500/20 dark:bg-blue-500/20 border border-blue-500/40 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping" />
                            <span className="text-xs text-blue-950 dark:text-blue-200 font-bold flex items-center gap-1.5">
                              <Timer size={13} className="text-blue-700 dark:text-blue-400" />
                              <span>Duration Countdown: <span className="text-blue-950 dark:text-white font-mono font-black bg-blue-500/20 dark:bg-blue-500/40 px-1.5 py-0.5 rounded border border-blue-500/40">{scheduledJackpot.secondsRemaining}s</span></span>
                            </span>
                          </div>
                          <span className="text-[11px] font-mono font-black text-blue-950 dark:text-amber-300 bg-blue-500/25 dark:bg-amber-500/20 px-2 py-0.5 rounded border border-blue-500/40 dark:border-amber-500/30 shadow-xs">
                            ➔ {scheduledJackpot.multiplier}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Seconds input */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-mute uppercase">Type Seconds</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="5"
                              max="86400"
                              step="10"
                              value={customTimeSeconds}
                              onChange={(e) => setCustomTimeSeconds(Math.max(1, Number(e.target.value)))}
                              placeholder="e.g. 180"
                              className="w-full bg-surface2 border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink font-mono font-bold outline-none focus:border-primary pr-8"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-mute font-bold">
                              sec
                            </span>
                          </div>
                        </div>

                        {/* Multiplier dropdown */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-mute uppercase">Multiplier</label>
                          <select
                            value={customTimeMultiplier}
                            onChange={(e) => setCustomTimeMultiplier(e.target.value)}
                            className="w-full bg-surface2 border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink font-bold outline-none focus:border-primary cursor-pointer"
                          >
                            <option value="2X">2X (Double)</option>
                            <option value="3X">3X (Triple)</option>
                            <option value="4X">4X (Mega)</option>
                            <option value="RANDOM">Random (2X/3X/4X each round)</option>
                          </select>
                        </div>
                      </div>

                      {/* Apply / Cancel Button */}
                      {isTimeActive ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleApplyTimeJackpot}
                            disabled={isApplyingTime}
                            className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <Timer size={13} />
                            <span>{isApplyingTime ? 'Updating...' : 'Update Timer'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await cancelScheduledJackpot(currentRace.gameSerial)
                              setActionNotice("Time duration mode cancelled. Reverted to 1X.")
                              setTimeout(() => setActionNotice(null), 3000)
                            }}
                            className="px-3 py-2 rounded-lg bg-danger/15 hover:bg-danger/25 border border-danger/30 text-danger text-xs font-bold transition-all flex items-center gap-1"
                            title="Cancel Timer"
                          >
                            <XCircle size={13} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleApplyTimeJackpot}
                          disabled={isApplyingTime || !customTimeSeconds || customTimeSeconds <= 0}
                          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <Timer size={13} />
                          <span>{isApplyingTime ? 'Activating Duration...' : `Activate Duration (${customTimeSeconds}s)`}</span>
                        </button>
                      )}
                    </div>

                    {/* 2. Feature B: Consecutive Rounds Mode */}
                    <div className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 shadow-xs transition-all relative overflow-hidden ${isRoundActive
                      ? 'border-amber-500 ring-2 ring-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.3)] bg-gradient-to-br from-amber-500/20 via-amber-900/10 to-surface'
                      : 'bg-surface border-line'
                      }`}>
                      {/* Active indicator top bar */}
                      {isRoundActive && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500">
                          <div
                            className="h-full bg-amber-300 transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(0, (((scheduledJackpot.initialRounds - scheduledJackpot.roundsRemaining) / (scheduledJackpot.initialRounds || 1)) * 100)))}%`
                            }}
                          />
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${isRoundActive
                            ? 'bg-amber-500 text-slate-950 shadow-glow-gold'
                            : 'bg-amber-500/10 text-amber-500'
                            }`}>
                            <Layers size={15} />
                          </div>
                          <div>
                            <h4 className="font-display text-xs font-bold text-ink flex items-center gap-1.5">
                              <span>🔢 Feature B: Consecutive Rounds Mode</span>
                              {isRoundActive && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-slate-950 animate-pulse">
                                  ACTIVE
                                </span>
                              )}
                            </h4>
                            <p className="text-[10px] text-mute">Continuous jackpot for next N consecutive rounds</p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-all flex items-center gap-1 ${isRoundActive
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                          {isRoundActive ? (
                            <>
                              <Layers size={10} />
                              <span>{scheduledJackpot.roundsRemaining} rds left</span>
                            </>
                          ) : (
                            'rounds'
                          )}
                        </span>
                      </div>

                      {/* Active Rounds Visual Banner */}
                      {isRoundActive && (
                        <div className="p-2.5 rounded-lg bg-amber-500/20 dark:bg-amber-500/20 border border-amber-500/40 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400 animate-ping" />
                            <span className="text-xs text-amber-950 dark:text-amber-200 font-bold flex items-center gap-1.5">
                              <Layers size={13} className="text-amber-700 dark:text-amber-400" />
                              <span>Rounds Sequence: <span className="text-amber-950 dark:text-white font-mono font-black bg-amber-500/30 dark:bg-amber-500/40 px-1.5 py-0.5 rounded border border-amber-600/40 dark:border-amber-500/40">{scheduledJackpot.roundsRemaining}</span> of {scheduledJackpot.initialRounds} rounds left</span>
                            </span>
                          </div>
                          <span className="text-[11px] font-mono font-black text-amber-950 dark:text-amber-300 bg-amber-500/30 dark:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-600/40 dark:border-amber-500/30 shadow-xs">
                            ➔ {scheduledJackpot.multiplier}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Rounds count input */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-mute uppercase">Type Rounds</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              max="1000"
                              step="1"
                              value={customRoundCount}
                              onChange={(e) => setCustomRoundCount(Math.max(1, Number(e.target.value)))}
                              placeholder="e.g. 5"
                              className="w-full bg-surface2 border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink font-mono font-bold outline-none focus:border-primary pr-10"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-mute font-bold">
                              rds
                            </span>
                          </div>
                        </div>

                        {/* Multiplier dropdown */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-mute uppercase">Multiplier</label>
                          <select
                            value={customRoundMultiplier}
                            onChange={(e) => setCustomRoundMultiplier(e.target.value)}
                            className="w-full bg-surface2 border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink font-bold outline-none focus:border-primary cursor-pointer"
                          >
                            <option value="2X">2X (Double)</option>
                            <option value="3X">3X (Triple)</option>
                            <option value="4X">4X (Mega)</option>
                            <option value="RANDOM">Random (2X/3X/4X each round)</option>
                          </select>
                        </div>
                      </div>

                      {/* Apply / Cancel Button */}
                      {isRoundActive ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleApplyRoundJackpot}
                            disabled={isApplyingRounds}
                            className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 shadow-glow-gold"
                          >
                            <Layers size={13} />
                            <span>{isApplyingRounds ? 'Updating...' : 'Update Rounds'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await cancelScheduledJackpot(currentRace.gameSerial)
                              setActionNotice("Consecutive rounds mode cancelled. Reverted to 1X.")
                              setTimeout(() => setActionNotice(null), 3000)
                            }}
                            className="px-3 py-2 rounded-lg bg-danger/15 hover:bg-danger/25 border border-danger/30 text-danger text-xs font-bold transition-all flex items-center gap-1"
                            title="Cancel Rounds Mode"
                          >
                            <XCircle size={13} />
                            <span>Cancel</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyRoundJackpot}
                          disabled={isApplyingRounds || !customRoundCount || customRoundCount <= 0}
                          className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 shadow-glow-gold disabled:opacity-50"
                        >
                          <Layers size={13} />
                          <span>{isApplyingRounds ? 'Activating Consecutive...' : `Activate Consecutive (${customRoundCount} Rounds)`}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Formula bar */}
                <div className="px-5 py-3 border-t border-line/40 flex items-center justify-between text-xs bg-surface2/50">
                  <span className="text-mute font-semibold">Settlement:</span>
                  <span className="font-mono text-primary font-bold">
                    Payout = Bet × Odds × {jackpot.isJackpot ? `${jackpot.jackpotMultiplier}` : '1'}
                  </span>
                  <span className="text-mute font-mono text-[11px]">
                    e.g. ₹500 × 10x × {jackpot.isJackpot ? jackpot.multiplierLabel : '1X'} = <span className="text-turf font-bold">₹{((500 * 10) * (jackpot.isJackpot ? jackpot.jackpotMultiplier : 1)).toLocaleString()}</span>
                  </span>
                </div>
              </div>
            )
          })()}

          {/* The track is the single source of live timing and race status. */}
          <LiveRaceTrack />

          {/* 🏁 LIVE RUNNERS INTERACTIVE WINNER SELECTION GRID 🏁 */}
          <div className="bg-surface border border-line rounded-2xl p-4 shadow-card space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line/60">
              <div>
                <div className="flex items-center gap-2">
                  <Flame size={18} className="text-amber-500" />
                  <h3 className="font-display text-base font-bold text-ink">Runner Selection</h3>
                </div>
                <p className="text-xs text-mute mt-0.5">
                  Click any runner to force them as winner for Race #{currentRace.gameSerial}.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-mute">Total Active Pot:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-gold text-sm num">
                  ₹{(Number(currentRace.totalPot) || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Grid of 12 Horses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {horses.map((horse) => {
                const isWinner = isCurrentRaceForced && (currentForcedHorseSerial === horse.number || currentForcedHorseSerial === horse.id)
                const isSmartPick = !isCurrentRaceForced && smartPick?.id === horse.id
                const horsePot = currentRace.potDistribution?.[horse.id] || 0
                const projectedPayout = Math.round(horsePot * (Number(horse.odds) || 2.0))

                return (
                  <div
                    key={horse.id}
                    className={`relative p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 ${isWinner
                      ? "bg-amber-500/15 border-amber-500/50 shadow-glow-gold scale-[1.02]"
                      : isSmartPick
                        ? "bg-turf/10 border-turf/40"
                        : "bg-surface2/60 hover:bg-surface2 border-line hover:border-primary/40"
                      }`}
                  >
                    {/* Header: Number, Name, Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm font-display shrink-0"
                          style={{ backgroundColor: horse.color || '#3B82F6' }}
                        >
                          #{horse.number}
                        </div>
                        <div>
                          <div className="font-bold text-ink text-xs line-clamp-1">{horse.name}</div>
                          <div className="text-[10px] text-mute font-mono">{horse.jockey || "Jockey Pro"}</div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono font-bold text-xs text-amber-600 dark:text-gold px-1.5 py-0.5 rounded bg-surface border border-line">
                          {horse.odds}x
                        </span>
                        {isWinner && (
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Crown size={10} /> FORCED
                          </span>
                        )}
                        {isSmartPick && (
                          <span className="text-[10px] font-bold text-turf bg-turf/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Sparkles size={10} /> SMART
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Financial Stats: Pot & Payout */}
                    <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-surface2 border border-line text-[11px]">
                      <div>
                        <div className="text-[9px] text-mute font-semibold uppercase">Bet Pot</div>
                        <div className="font-mono font-bold text-ink num">₹{horsePot.toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-mute font-semibold uppercase">Payout</div>
                        <div className="font-mono font-bold text-turf num">₹{projectedPayout.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Winner Selection Button */}
                    <div>
                      {isWinner ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled
                            className="flex-1 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Crown size={13} /> Active Winner
                          </button>
                          <button
                            onClick={() => handleClearOverride()}
                            className="px-2 py-1.5 rounded-xl bg-surface hover:bg-surface3 border border-line text-xs font-semibold text-danger hover:text-danger-hover"
                            title="Revert to auto mode"
                          >
                            Clear
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmLiveWinnerTarget(horse)}
                          className="w-full py-1.5 rounded-xl bg-surface hover:bg-primary hover:text-white border border-line text-xs font-bold text-ink transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                        >
                          <Crown size={13} className="text-amber-500" />
                          <span>Make Live Winner</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Future override queue — scheduling lives in the top control strip. */}
          <div className="p-4 rounded-2xl bg-surface border border-line shadow-card space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                <div>
                  <h4 className="font-display text-sm font-bold text-ink">Future winner queue</h4>
                  <p className="text-[11px] text-mute">Pre-configured rounds appear here.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchScheduledWinners()}
                  disabled={scheduledWinnersLoading}
                  className="p-1.5 rounded-lg bg-surface2 text-mute hover:text-ink transition-colors"
                  title="Refresh scheduled queue"
                >
                  <RefreshCw size={13} className={scheduledWinnersLoading ? "animate-spin text-primary" : ""} />
                </button>
              </div>
            </div>

            {scheduledWinners.length === 0 ? (
              <div className="p-4 text-center text-xs text-mute bg-surface2/50 rounded-xl border border-line">
                No future winner is scheduled. This queue is empty.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-mute uppercase tracking-wider border-b border-line pb-2 font-semibold">
                      <th className="py-2.5">Game Serial #</th>
                      <th className="py-2.5">Guaranteed Horse</th>
                      <th className="py-2.5">Admin Reason / Remark</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {scheduledWinners.map((sw) => (
                      <tr key={sw.id || sw.gameSerial} className="hover:bg-surface2/40">
                        <td className="py-2.5 font-mono font-bold text-primary">#{sw.gameSerial}</td>
                        <td className="py-2.5 font-bold text-amber-600 dark:text-gold">
                          Horse #{sw.horseSerial} ({sw.horseName || `Runner #${sw.horseSerial}`})
                        </td>
                        <td className="py-2.5 text-mute">{sw.reason || "Scheduled Override"}</td>
                        <td className="py-2.5">
                          <Badge tone={sw.status === "PENDING" ? "amber" : "turf"} size="sm">
                            {sw.status || "PENDING"}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleClearOverride(sw.gameSerial)}
                            className="p-1 rounded text-mute hover:text-danger transition-colors"
                            title="Cancel scheduled override"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Tab 2: Matches & Results History */
        <div className="space-y-4">
          {/* History Search & Export Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-line rounded-2xl p-3 shadow-card">
            <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3 py-2 text-xs w-full sm:w-72">
              <Search size={15} className="text-mute shrink-0" />
              <input
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search race serial, winner name..."
                className="bg-transparent outline-none text-ink placeholder:text-mute w-full"
              />
            </div>

            <button
              onClick={handleExportHistory}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-xs font-semibold text-ink transition-colors focus-ring"
            >
              <Download size={15} />
              <span>Export CSV Ledger</span>
            </button>
          </div>

          {/* Matches Table */}
          <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider font-semibold text-mute border-b border-line bg-surface2/50">
                    <th className="px-5 py-3.5">Race Serial</th>
                    <th className="px-5 py-3.5">Track Distance</th>
                    <th className="px-5 py-3.5">Timestamps</th>
                    <th className="px-5 py-3.5">Winner Horse</th>
                    <th className="px-5 py-3.5">Odds</th>
                    <th className="px-5 py-3.5">Total Bets</th>
                    <th className="px-5 py-3.5">Total Payout</th>
                    <th className="px-5 py-3.5">GGR Profit</th>
                    <th className="px-5 py-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-mute">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <History size={24} className="text-mute opacity-60" />
                          <span className="font-semibold text-xs">No settled rounds found from API.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((match) => (
                      <tr key={match.id || match.gameSerial} className="hover:bg-surface2/40 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-ink">
                          #{match.gameSerial}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-mute font-mono">{match.distance || '1000M'}</td>
                        <td className="px-5 py-3.5 text-xs text-mute font-mono">
                          {match.startedAt || '-'} → {match.finishedAt || match.endedAt || '-'}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={resolveImageUrl(match.winnerHorse?.avatar || match.winnerHorse?.imageUrl)}
                              alt=""
                              className="w-7 h-7 rounded-lg object-cover border border-line"
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150&auto=format&fit=crop&q=80'
                              }}
                            />
                            <div
                              className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: match.winnerHorse?.color || '#3B82F6' }}
                            >
                              {match.winnerHorse?.number || '#'}
                            </div>
                            <span className="font-bold text-ink">{match.winnerHorse?.name || 'Winner'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge tone="gold" size="sm">
                            {match.jackpot || `${match.winnerHorse?.odds || 2.0}x`}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 font-mono num text-ink font-semibold">
                          ₹{(Number(match.totalBets) || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 font-mono num text-turf font-semibold">
                          ₹{(Number(match.totalPayout) || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`font-mono text-xs font-bold ${(Number(match.ggr) || 0) >= 0 ? "text-turf" : "text-danger"
                              }`}
                          >
                            {(Number(match.ggr) || 0) >= 0 ? `+₹${(Number(match.ggr) || 0).toLocaleString()}` : `-₹${Math.abs(Number(match.ggr) || 0).toLocaleString()}`}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => setSelectedRound(match)}
                            className="p-1.5 rounded-lg text-mute hover:text-primary hover:bg-primary/10 transition-colors"
                            title="View finish times & audit hash"
                          >
                            <Eye size={16} />
                          </button>
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

      {/* 🎯 POPUP: LIVE RACE 1-CLICK WINNER CONFIRMATION DIALOG 🎯 */}
      <ConfirmDialog
        open={!!confirmLiveWinnerTarget}
        onClose={() => setConfirmLiveWinnerTarget(null)}
        onConfirm={handleConfirmLiveWinner}
        title={`Set Horse #${confirmLiveWinnerTarget?.number} (${confirmLiveWinnerTarget?.name}) as Live Winner?`}
        description={`Set Horse #${confirmLiveWinnerTarget?.number} "${confirmLiveWinnerTarget?.name}" (${confirmLiveWinnerTarget?.odds}x) as the guaranteed winner for Live Race #${currentRace.gameSerial}? This cannot be undone once the race settles.`}
        confirmLabel={isSubmittingLivePick ? "Confirming..." : "Confirm Winner"}
        confirmTone="primary"
      />

      {/* 📅 MODAL: SCHEDULE FUTURE GAME WINNER 📅 */}
      <Modal
        open={futureModalOpen}
        onClose={() => setFutureModalOpen(false)}
        title="Schedule Future Game Winner"
        subtitle="Specify a future Game Serial number and select the predetermined winner"
        footer={
          <>
            <button
              onClick={() => setFutureModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-mute hover:text-ink hover:bg-surface2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleScheduleFutureWinner}
              disabled={isSubmittingFuture || !futureGameSerial.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white transition-all shadow-glow-primary hover:brightness-110 disabled:opacity-50"
            >
              {isSubmittingFuture ? "Scheduling..." : "Save Future Schedule"}
            </button>
          </>
        }
      >
        <form onSubmit={handleScheduleFutureWinner} className="space-y-4 text-xs">
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">
              Future Game Serial # *
            </span>
            <input
              type="text"
              required
              value={futureGameSerial}
              onChange={(e) => setFutureGameSerial(e.target.value)}
              placeholder="e.g. 20260921008"
              className="bg-surface2 border border-line rounded-xl px-3 py-2 text-sm text-ink font-mono font-bold outline-none focus:border-primary"
            />
            <span className="text-[11px] text-mute">
              Enter the future match serial (Current Live Serial is #{currentRace.gameSerial}).
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">
              Select Guaranteed Winner Horse
            </span>
            <select
              value={futureSelectedHorseSerial}
              onChange={(e) => setFutureSelectedHorseSerial(Number(e.target.value))}
              className="bg-surface2 border border-line rounded-xl px-3 py-2.5 text-xs text-ink outline-none focus:border-primary"
            >
              {horses.map((h) => (
                <option key={h.id} value={h.number}>
                  Horse #{h.number} — {h.name} ({h.odds}x Odds)
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">
              Pre-Schedule Jackpot Multiplier (Slots: ['N', '2X', '3X', '4X'])
            </span>
            <select
              value={futureJackpotMultiplier}
              onChange={(e) => setFutureJackpotMultiplier(e.target.value)}
              className="bg-surface2 border border-line rounded-xl px-3 py-2.5 text-xs text-ink outline-none focus:border-primary font-bold"
            >
              <option value="N">N (Nothing / Standard 1X Payout)</option>
              <option value="2X">2X (Double Payout Multiplier)</option>
              <option value="3X">3X (Triple Payout Multiplier)</option>
              <option value="4X">4X (Mega 4X Payout Multiplier)</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">
              Reason / Admin Note
            </span>
            <input
              value={futureReason}
              onChange={(e) => setFutureReason(e.target.value)}
              placeholder="e.g. VIP Round Override / Special 4X Event"
              className="bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink outline-none focus:border-primary"
            />
          </label>
        </form>
      </Modal>

      {/* ⚙️ MODAL: ADMIN JACKPOT CONTROL MODES CONFIGURATION (POST /api/admin/jackpot/config & /mode) ⚙️ */}
      <Modal
        open={jackpotConfigModalOpen}
        onClose={() => setJackpotConfigModalOpen(false)}
        title="Admin Jackpot Control Modes"
        subtitle="Configure automated jackpot trigger rules or direct round multipliers"
        footer={
          <>
            <button
              onClick={() => setJackpotConfigModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-mute hover:text-ink hover:bg-surface2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveJackpotConfig}
              disabled={isSavingJackpotConfig}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white transition-all shadow-glow-primary hover:brightness-110 disabled:opacity-50"
            >
              {isSavingJackpotConfig ? "Saving Config..." : "Save Jackpot Mode"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveJackpotConfig} className="space-y-4 text-xs">
          {/* Mode Selection Tabs */}
          <div>
            <span className="font-semibold text-mute uppercase tracking-wider text-[11px] block mb-2">
              Select Trigger Mode:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'EVERY_ROUND', name: 'Every Round', Icon: Zap, desc: 'Auto jackpot every race' },
                { id: 'ROUND_INTERVAL', name: 'Round Interval', Icon: Layers, desc: 'e.g. Every 5th race' },
                { id: 'TIME_INTERVAL', name: 'Time Interval', Icon: Timer, desc: 'e.g. Every 180 seconds' },
                { id: 'PROBABILITY', name: 'Auto Chance %', Icon: Dices, desc: 'Random % chance per race' },
                { id: 'MANUAL', name: 'Manual / Direct', Icon: Sliders, desc: 'Single round force only' },
                { id: 'OFF', name: 'Disabled', Icon: CircleOff, desc: 'Standard 1X payouts only' },
              ].map(({ id, name, Icon, desc }) => {
                const isSelected = tempJackpotConfig.mode === id
                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => setTempJackpotConfig({ ...tempJackpotConfig, mode: id })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-ink font-bold shadow-sm ring-1 ring-amber-400/50'
                      : 'bg-surface2 border-line text-mute hover:text-ink hover:bg-surface3'
                      }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                      <Icon size={14} className={isSelected ? 'text-amber-500' : 'text-mute'} />
                      <span>{name}</span>
                    </div>
                    <div className="text-[10px] text-mute mt-1 leading-tight">{desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mode-Specific Settings Fields */}
          {tempJackpotConfig.mode === 'EVERY_ROUND' && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <Zap size={13} className="text-amber-500" />
                <span>Every Round Mode Active</span>
              </span>
              <span className="text-[11px] text-mute block">
                Every single race will automatically feature an active Jackpot multiplier.
              </span>
            </div>
          )}

          {tempJackpotConfig.mode === 'ROUND_INTERVAL' && (
            <label className="flex flex-col gap-1.5 p-3 rounded-xl bg-surface2 border border-line">
              <div className="flex justify-between font-semibold text-mute">
                <span className="uppercase tracking-wider text-[11px]">Round Interval (Trigger every X races)</span>
                <span className="text-ink font-mono font-bold">{tempJackpotConfig.intervalRounds || 5} Races</span>
              </div>
              <input
                type="number"
                min="1"
                max="100"
                value={tempJackpotConfig.intervalRounds || 5}
                onChange={(e) => setTempJackpotConfig({ ...tempJackpotConfig, intervalRounds: Math.max(1, Number(e.target.value)) })}
                className="bg-surface border border-line rounded-xl px-3 py-2 text-sm text-ink font-mono font-bold outline-none focus:border-primary"
              />
              <span className="text-[11px] text-mute">
                e.g. Set to 5 ➔ Jackpot triggers on 5th, 10th, 15th, 20th round automatically.
              </span>
            </label>
          )}

          {tempJackpotConfig.mode === 'TIME_INTERVAL' && (
            <label className="flex flex-col gap-1.5 p-3 rounded-xl bg-surface2 border border-line">
              <div className="flex justify-between font-semibold text-mute">
                <span className="uppercase tracking-wider text-[11px]">Time Interval (Seconds)</span>
                <span className="text-ink font-mono font-bold">{tempJackpotConfig.intervalSeconds || 180}s ({Math.round((tempJackpotConfig.intervalSeconds || 180) / 60)} min)</span>
              </div>
              <input
                type="number"
                min="30"
                max="7200"
                step="30"
                value={tempJackpotConfig.intervalSeconds || 180}
                onChange={(e) => setTempJackpotConfig({ ...tempJackpotConfig, intervalSeconds: Math.max(10, Number(e.target.value)) })}
                className="bg-surface border border-line rounded-xl px-3 py-2 text-sm text-ink font-mono font-bold outline-none focus:border-primary"
              />
              <span className="text-[11px] text-mute">
                e.g. Set to 180s ➔ As soon as 180s elapse, the very next race activates a Jackpot.
              </span>
            </label>
          )}

          {tempJackpotConfig.mode === 'PROBABILITY' && (
            <label className="flex flex-col gap-1.5 p-3 rounded-xl bg-surface2 border border-line">
              <div className="flex justify-between font-semibold text-mute">
                <span className="uppercase tracking-wider text-[11px]">Auto-Trigger Probability (%)</span>
                <span className="text-ink font-mono font-bold">{tempJackpotConfig.probabilityPercent}%</span>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={tempJackpotConfig.probabilityPercent}
                onChange={(e) => setTempJackpotConfig({ ...tempJackpotConfig, probabilityPercent: Number(e.target.value) })}
                className="bg-surface border border-line rounded-xl px-3 py-2 text-sm text-ink font-mono font-bold outline-none focus:border-primary"
              />
              <span className="text-[11px] text-mute">
                e.g. 5% means roughly 1 out of 20 races will randomly trigger a Jackpot.
              </span>
            </label>
          )}

          {/* Target Multiplier Option */}
          {tempJackpotConfig.mode !== 'OFF' && tempJackpotConfig.mode !== 'MANUAL' && (
            <div>
              <span className="font-semibold text-mute uppercase tracking-wider text-[11px] block mb-2">
                Triggered Multiplier Value:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'RANDOM', label: '🎲 RANDOM', sub: 'Pick 2X/3X/4X' },
                  { value: 2, label: '2X', sub: 'Double Payout' },
                  { value: 3, label: '3X', sub: 'Triple Payout' },
                  { value: 4, label: '4X', sub: 'Mega 4X' },
                ].map((item) => {
                  const isSelected = String(tempJackpotConfig.targetMultiplier) === String(item.value)
                  return (
                    <button
                      type="button"
                      key={item.value}
                      onClick={() => setTempJackpotConfig({ ...tempJackpotConfig, targetMultiplier: item.value })}
                      className={`p-2.5 rounded-xl border text-center transition-all ${isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-500 font-bold shadow-sm'
                        : 'bg-surface2 border-line text-mute hover:text-ink'
                        }`}
                    >
                      <div className="font-display text-sm">{item.label}</div>
                      <div className="text-[9px] mt-0.5 text-mute">{item.sub}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Round Details Drawer */}
      <Drawer
        open={!!selectedRound}
        onClose={() => setSelectedRound(null)}
        title={`Round Audit #${selectedRound?.gameSerial}`}
        subtitle={`Settled at ${selectedRound?.finishedAt}`}
      >
        {selectedRound && (
          <div className="space-y-6 text-xs">
            {/* Winner Card */}
            <div className="p-4 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={resolveImageUrl(selectedRound.winnerHorse?.avatar)}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover border border-gold/40"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150&auto=format&fit=crop&q=80'
                  }}
                />
                <div>
                  <div className="text-[11px] text-mute uppercase font-bold tracking-wider">Champion Runner</div>
                  <div className="font-display text-base font-bold text-amber-600 dark:text-gold">
                    #{selectedRound.winnerHorse?.number} {selectedRound.winnerHorse?.name}
                  </div>
                  <div className="text-[11px] font-mono text-mute">Payout Odds: {selectedRound.jackpot}</div>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-surface2 border border-line text-center">
                <div className="text-[10px] text-mute font-bold uppercase">Total Bets</div>
                <div className="font-display text-sm font-bold text-ink mt-0.5 num">₹{(Number(selectedRound.totalBets) || 0).toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-surface2 border border-line text-center">
                <div className="text-[10px] text-mute font-bold uppercase">Total Payout</div>
                <div className="font-display text-sm font-bold text-turf mt-0.5 num">₹{(Number(selectedRound.totalPayout) || 0).toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-surface2 border border-line text-center">
                <div className="text-[10px] text-mute font-bold uppercase">GGR</div>
                <div className="font-display text-sm font-bold text-ink mt-0.5 num">₹{(Number(selectedRound.ggr) || 0).toLocaleString()}</div>
              </div>
            </div>

            {/* Provably Fair Seed Hash */}
            <div className="p-4 rounded-2xl bg-surface2/60 border border-line space-y-1.5">
              <div className="flex items-center gap-1.5 text-mute font-bold text-[11px] uppercase tracking-wider">
                <ShieldCheck size={14} className="text-turf" />
                <span>Provably-Fair Cryptographic Hash</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface font-mono text-[11px] text-ink break-all border border-line select-all">
                {selectedRound.seedHash}
              </div>
            </div>

            {/* Finish Order */}
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold text-mute tracking-wider">Finish Order & Timings</span>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {selectedRound.finishOrder?.map((pos) => (
                  <div
                    key={pos.rank}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-surface2 border border-line text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-mute w-5">#{pos.rank}</span>
                      <span className="text-ink font-semibold">Horse #{pos.number} ({pos.name})</span>
                    </div>
                    <div className="flex items-center gap-3 text-mute">
                      <span>{pos.time}</span>
                      <span className="w-12 text-right">{pos.gap}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Void Confirmation Dialog */}
      <ConfirmDialog
        open={voidConfirmOpen}
        onClose={() => setVoidConfirmOpen(false)}
        onConfirm={() => {
          voidCurrentRound()
          setVoidConfirmOpen(false)
          setActionNotice(`Round #${currentRace.gameSerial} voided. All bets refunded.`)
          setTimeout(() => setActionNotice(null), 4000)
        }}
        title="Void Current Live Round?"
        description={`Are you sure you want to void Race #${currentRace.gameSerial}? All active live bets placed by users in this round will be instantly refunded to their wallets.`}
        confirmLabel="Void & Refund Bets"
        confirmTone="danger"
      />
    </div>
  )
}
