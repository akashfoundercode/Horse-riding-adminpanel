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
    if (!canForceWinner) {
      setActionNotice(forceWindowMsg)
      setTimeout(() => setActionNotice(null), 4000)
      setConfirmLiveWinnerTarget(null)
      return
    }
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

  // Force winner only allowed in first 10s of RUNNING stage
  const runElapsed = currentRace.stage === 'RUNNING'
    ? (settings?.runDuration || 20) - (currentRace.stageRemaining || 0)
    : 0
  const canForceWinner = currentRace.stage === 'RUNNING' && runElapsed <= 10
  const forceWindowMsg = currentRace.stage !== 'RUNNING'
    ? 'Winner can only be forced while the race is running.'
    : 'Force window closed — only allowed in the first 10s of the race.'

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4 max-w-[1400px] mx-auto">

      {/* Toast */}
      {actionNotice && (
        <div className="bg-turf/10 border border-turf/30 text-turf px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between animate-slide-in">
          <div className="flex items-center gap-2"><CheckCircle size={15} /><span>{actionNotice}</span></div>
          <button onClick={() => setActionNotice(null)} className="text-turf/60 hover:text-turf">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Derby Arena</h2>
          <p className="text-xs text-mute mt-0.5">Live race control, jackpot management & history</p>
        </div>
        <div className="flex bg-surface border border-line rounded-2xl p-1 shadow-sm shrink-0">
          <button
            onClick={() => setActiveTab("monitor")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === "monitor" ? "bg-primary text-white shadow-glow-primary" : "text-mute hover:text-ink"}`}
          >
            <Flag size={14} /><span>Monitor</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === "history" ? "bg-primary text-white shadow-glow-primary" : "text-mute hover:text-ink"}`}
          >
            <History size={14} /><span>History ({matchesHistory.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "monitor" ? (
        <div className="space-y-4">

          {/* ── Status Banner ── */}
          <div className={`rounded-2xl border shadow-card overflow-hidden ${isCurrentRaceForced ? 'border-amber-500/40 bg-amber-500/5' : 'border-line bg-surface'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCurrentRaceForced ? 'bg-amber-500/20 text-amber-500' : 'bg-turf/15 text-turf'}`}>
                  {isCurrentRaceForced ? <Crown size={17} /> : <Cpu size={17} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-ink">
                      {isCurrentRaceForced ? `Override: Horse #${currentForcedHorseSerial} — ${currentRace.forcedWinner?.horseName}` : 'Smart Engine Active'}
                    </span>
                    <Badge tone={isCurrentRaceForced ? 'amber' : 'turf'} size="sm">{isCurrentRaceForced ? 'Manual' : 'Auto'}</Badge>
                  </div>
                  <p className="text-[11px] text-mute mt-0.5">Race #{currentRace.gameSerial} · {currentRace.stage.replace(/_/g, ' ')} · {visibleStageRemaining}s remaining</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {isCurrentRaceForced && (
                  <button onClick={() => handleClearOverride()} className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface2 border border-line text-xs font-semibold text-danger transition-colors">Clear Override</button>
                )}
                <button onClick={() => { setFutureGameSerial(String((Number(currentRace.gameSerial) + 1))); setFutureModalOpen(true) }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-xs font-semibold text-ink transition-colors">
                  <Calendar size={13} /><span>Schedule</span>
                </button>
                <button onClick={() => handleExtendTime(10)} className="px-3 py-1.5 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-xs font-semibold text-ink transition-colors">+10s</button>
                <button onClick={forceNextStage} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-glow-primary transition-all">
                  <SkipForward size={13} /><span>Next Stage</span>
                </button>
                <button onClick={() => setVoidConfirmOpen(true)} className="p-1.5 rounded-xl bg-danger/10 border border-danger/25 text-danger hover:bg-danger/20 transition-colors" title="Void round">
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
            <div className="px-5 py-2.5 border-t border-line/50 bg-surface2/40 flex items-center gap-3">
              <span className="text-[11px] font-semibold text-mute uppercase tracking-wider shrink-0">Note</span>
              <input
                type="text" value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add an admin note for this round..."
                className="flex-1 bg-transparent outline-none text-xs text-ink placeholder:text-mute/60"
              />
              {adminNote && <button onClick={() => setAdminNote('')} className="text-[11px] text-mute hover:text-danger shrink-0">Clear</button>}
            </div>
          </div>

          {/* ── Jackpot Control ── */}
          {(() => {
            const isTimeActive = (scheduledJackpot?.type === 'time_duration' || scheduledJackpot?.type === 'time') && scheduledJackpot?.secondsRemaining > 0
            const isRoundActive = (scheduledJackpot?.type === 'consecutive_rounds' || scheduledJackpot?.type === 'round') && scheduledJackpot?.roundsRemaining > 0
            const isStandingActive = scheduledJackpot?.type === 'standing' && scheduledJackpot?.multiplier && scheduledJackpot?.multiplier !== '1X' && scheduledJackpot?.multiplier !== 'N'
            const isJackpotActive = isTimeActive || isRoundActive || isStandingActive || (jackpot?.isJackpot && jackpot?.multiplierLabel !== '1X' && jackpot?.multiplierLabel !== 'N')

            return (
              <div className={`rounded-2xl border shadow-card overflow-hidden transition-all ${
                isTimeActive ? 'border-blue-500/50 bg-blue-500/5' :
                isRoundActive ? 'border-amber-500/50 bg-amber-500/5' :
                isStandingActive ? 'border-emerald-500/50 bg-emerald-500/5' :
                isJackpotActive ? 'border-amber-500/40 bg-amber-500/5' :
                'border-line bg-surface'
              }`}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-line/60">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isTimeActive ? 'bg-blue-500 text-white' :
                      isRoundActive ? 'bg-amber-500 text-slate-950' :
                      isStandingActive ? 'bg-emerald-500 text-white' :
                      isJackpotActive ? 'bg-amber-500 text-slate-950' :
                      'bg-surface2 border border-line text-mute'
                    }`}>
                      <Coins size={17} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-ink">Jackpot Control</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                          isTimeActive ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                          isRoundActive ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                          isStandingActive ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                          isJackpotActive ? 'bg-amber-500/15 text-amber-500 border-amber-500/30' :
                          'bg-surface2 text-mute border-line'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isJackpotActive || isTimeActive || isRoundActive || isStandingActive ? 'animate-ping' : ''} ${
                            isTimeActive ? 'bg-blue-400' : isRoundActive ? 'bg-amber-400' : isStandingActive ? 'bg-emerald-400' : isJackpotActive ? 'bg-amber-400' : 'bg-mute/40'
                          }`} />
                          {isTimeActive ? `${scheduledJackpot.multiplier} · ${scheduledJackpot.secondsRemaining}s left` :
                           isRoundActive ? `${scheduledJackpot.multiplier} · ${scheduledJackpot.roundsRemaining} rounds left` :
                           isStandingActive ? `${scheduledJackpot.multiplier} Standing` :
                           isJackpotActive ? `${jackpot.multiplierLabel} Active` : '1X Standard'}
                        </span>
                      </div>
                      <p className="text-[11px] text-mute mt-0.5">Race #{currentRace.gameSerial}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(isJackpotActive || isTimeActive || isRoundActive || isStandingActive) && (
                      <button
                        onClick={async () => { await clearForcedJackpot(currentRace.gameSerial); setActionNotice("Jackpot reset to 1X."); setTimeout(() => setActionNotice(null), 3000) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-danger/10 hover:bg-danger/20 border border-danger/30 text-xs font-bold text-danger transition-all"
                      >
                        <RotateCcw size={12} /><span>Reset 1X</span>
                      </button>
                    )}
                    <button
                      onClick={() => { setTempJackpotConfig({ mode: jackpotConfig?.mode || 'PROBABILITY', targetMultiplier: jackpotConfig?.targetMultiplier || 'RANDOM', intervalRounds: jackpotConfig?.intervalRounds || 5, intervalSeconds: jackpotConfig?.intervalSeconds || 180, probabilityPercent: jackpotConfig?.probabilityPercent || 5, allowedMultipliers: jackpotConfig?.allowedMultipliers || [2,3,4], enabled: jackpotConfig?.enabled ?? true }); setJackpotConfigModalOpen(true) }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-xs font-semibold text-ink transition-colors"
                    >
                      <Sparkles size={13} className="text-amber-500" /><span>Auto Rules</span>
                    </button>
                  </div>
                </div>

                {/* Active mode banners */}
                {isTimeActive && (
                  <div className="px-5 py-2.5 bg-blue-500/10 border-b border-blue-500/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping shrink-0" />
                      <span className="font-semibold text-blue-400 flex items-center gap-1.5">
                        <Timer size={13} />
                        Duration active — <span className="font-mono font-bold">{scheduledJackpot.secondsRemaining}s</span> remaining at <span className="font-bold">{scheduledJackpot.multiplier}</span>
                      </span>
                    </div>
                    <button onClick={async () => { await cancelScheduledJackpot(currentRace.gameSerial); setActionNotice("Duration cancelled."); setTimeout(() => setActionNotice(null), 3000) }} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 font-bold transition-all">
                      <XCircle size={12} /><span>Cancel</span>
                    </button>
                  </div>
                )}
                {isRoundActive && (
                  <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                      <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                        <Layers size={13} />
                        Consecutive active — <span className="font-mono font-bold">{scheduledJackpot.roundsRemaining}/{scheduledJackpot.initialRounds}</span> rounds at <span className="font-bold">{scheduledJackpot.multiplier}</span>
                      </span>
                    </div>
                    <button onClick={async () => { await cancelScheduledJackpot(currentRace.gameSerial); setActionNotice("Consecutive rounds cancelled."); setTimeout(() => setActionNotice(null), 3000) }} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 font-bold transition-all">
                      <XCircle size={12} /><span>Cancel</span>
                    </button>
                  </div>
                )}
                {isStandingActive && !isTimeActive && !isRoundActive && (
                  <div className="px-5 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                      <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                        <Zap size={13} />
                        Standing continuous — <span className="font-bold">{scheduledJackpot.multiplier}</span> on every round until turned off
                      </span>
                    </div>
                    <button onClick={async () => { await clearForcedJackpot(currentRace.gameSerial); setActionNotice("Standing mode off."); setTimeout(() => setActionNotice(null), 3000) }} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 font-bold transition-all">
                      <XCircle size={12} /><span>Turn Off</span>
                    </button>
                  </div>
                )}

                {/* Feature A: Standing multiplier tiles */}
                <div className="p-4 border-b border-line/40">
                  <p className="text-[11px] font-semibold text-mute uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Zap size={12} className="text-amber-500" />Standing Mode — select to keep ON every round
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { slot: '1X', label: '1X', sub: 'Standard' },
                      { slot: '2X', label: '2X', sub: 'Double' },
                      { slot: '3X', label: '3X', sub: 'Triple' },
                      { slot: '4X', label: '4X', sub: 'Mega' },
                      { slot: 'RANDOM', label: '🎲', sub: 'Random' },
                    ].map(({ slot, label, sub }) => {
                      const isTileActive = !isTimeActive && !isRoundActive && (
                        slot === '1X'
                          ? (!isStandingActive && (!jackpot.isJackpot || jackpot.multiplierLabel === '1X' || jackpot.multiplierLabel === 'N'))
                          : isStandingActive ? scheduledJackpot.multiplier === slot : jackpot.multiplierLabel === slot
                      )
                      return (
                        <button
                          key={slot}
                          onClick={() => handleSetLiveJackpot(slot)}
                          disabled={jackpotLoading}
                          className={`relative flex flex-col items-center justify-center gap-1 py-3 rounded-xl border text-center transition-all disabled:opacity-60 ${
                            isTileActive
                              ? slot === '1X' ? 'bg-primary/15 border-primary ring-2 ring-primary/40' : 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 scale-[1.03]'
                              : 'bg-surface2 hover:bg-surface3 border-line hover:border-primary/40'
                          }`}
                        >
                          <span className={`font-display text-lg font-black ${isTileActive ? slot === '1X' ? 'text-primary' : 'text-amber-400' : 'text-ink'}`}>{label}</span>
                          <span className="text-[10px] text-mute">{sub}</span>
                          {isTileActive && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Feature B + C: Rounds & Time inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-line/40">

                  {/* Feature C: Time Duration */}
                  <div className={`p-4 relative overflow-hidden ${isTimeActive ? 'bg-blue-500/5' : ''}`}>
                    {isTimeActive && <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500"><div className="h-full bg-blue-300 transition-all duration-1000" style={{ width: `${Math.min(100, ((scheduledJackpot.initialSeconds - scheduledJackpot.secondsRemaining) / (scheduledJackpot.initialSeconds || 1)) * 100)}%` }} /></div>}
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${isTimeActive ? 'bg-blue-500 text-white' : 'bg-blue-500/10 text-blue-400'}`}><Timer size={14} /></div>
                      <div>
                        <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                          Time Duration
                          {isTimeActive && <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-500 text-white animate-pulse">ACTIVE</span>}
                        </div>
                        <p className="text-[10px] text-mute">Jackpot on all rounds for N seconds</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-mute uppercase">Seconds</label>
                        <div className="relative">
                          <input type="number" min="5" max="86400" step="10" value={customTimeSeconds} onChange={(e) => setCustomTimeSeconds(Math.max(1, Number(e.target.value)))} placeholder="e.g. 180" className="w-full bg-surface2 border border-line rounded-lg px-2.5 py-2 text-xs text-ink font-mono font-bold outline-none focus:border-primary pr-8" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-mute font-bold">s</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-mute uppercase">Multiplier</label>
                        <select value={customTimeMultiplier} onChange={(e) => setCustomTimeMultiplier(e.target.value)} className="w-full bg-surface2 border border-line rounded-lg px-2.5 py-2 text-xs text-ink font-bold outline-none focus:border-primary cursor-pointer">
                          <option value="2X">2X</option><option value="3X">3X</option><option value="4X">4X</option><option value="RANDOM">Random</option>
                        </select>
                      </div>
                    </div>
                    {isTimeActive ? (
                      <div className="flex gap-2">
                        <button onClick={handleApplyTimeJackpot} disabled={isApplyingTime} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
                          <Timer size={12} />{isApplyingTime ? 'Updating…' : 'Update Timer'}
                        </button>
                        <button onClick={async () => { await cancelScheduledJackpot(currentRace.gameSerial); setActionNotice("Duration cancelled."); setTimeout(() => setActionNotice(null), 3000) }} className="px-3 py-2 rounded-lg bg-danger/10 hover:bg-danger/20 border border-danger/30 text-danger text-xs font-bold transition-all">
                          <XCircle size={13} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={handleApplyTimeJackpot} disabled={isApplyingTime || !customTimeSeconds} className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
                        <Timer size={12} />{isApplyingTime ? 'Activating…' : `Activate ${customTimeSeconds}s Duration`}
                      </button>
                    )}
                  </div>

                  {/* Feature B: Consecutive Rounds */}
                  <div className={`p-4 relative overflow-hidden ${isRoundActive ? 'bg-amber-500/5' : ''}`}>
                    {isRoundActive && <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500"><div className="h-full bg-amber-300 transition-all duration-500" style={{ width: `${Math.min(100, ((scheduledJackpot.initialRounds - scheduledJackpot.roundsRemaining) / (scheduledJackpot.initialRounds || 1)) * 100)}%` }} /></div>}
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${isRoundActive ? 'bg-amber-500 text-slate-950' : 'bg-amber-500/10 text-amber-500'}`}><Layers size={14} /></div>
                      <div>
                        <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                          Consecutive Rounds
                          {isRoundActive && <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-slate-950 animate-pulse">ACTIVE — {scheduledJackpot.roundsRemaining} left</span>}
                        </div>
                        <p className="text-[10px] text-mute">Jackpot on next N consecutive rounds</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-mute uppercase">Rounds</label>
                        <div className="relative">
                          <input type="number" min="1" max="1000" step="1" value={customRoundCount} onChange={(e) => setCustomRoundCount(Math.max(1, Number(e.target.value)))} placeholder="e.g. 5" className="w-full bg-surface2 border border-line rounded-lg px-2.5 py-2 text-xs text-ink font-mono font-bold outline-none focus:border-primary pr-8" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-mute font-bold">rds</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-mute uppercase">Multiplier</label>
                        <select value={customRoundMultiplier} onChange={(e) => setCustomRoundMultiplier(e.target.value)} className="w-full bg-surface2 border border-line rounded-lg px-2.5 py-2 text-xs text-ink font-bold outline-none focus:border-primary cursor-pointer">
                          <option value="2X">2X</option><option value="3X">3X</option><option value="4X">4X</option><option value="RANDOM">Random</option>
                        </select>
                      </div>
                    </div>
                    {isRoundActive ? (
                      <div className="flex gap-2">
                        <button onClick={handleApplyRoundJackpot} disabled={isApplyingRounds} className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
                          <Layers size={12} />{isApplyingRounds ? 'Updating…' : 'Update Rounds'}
                        </button>
                        <button onClick={async () => { await cancelScheduledJackpot(currentRace.gameSerial); setActionNotice("Consecutive rounds cancelled."); setTimeout(() => setActionNotice(null), 3000) }} className="px-3 py-2 rounded-lg bg-danger/10 hover:bg-danger/20 border border-danger/30 text-danger text-xs font-bold transition-all">
                          <XCircle size={13} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={handleApplyRoundJackpot} disabled={isApplyingRounds || !customRoundCount} className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
                        <Layers size={12} />{isApplyingRounds ? 'Activating…' : `Activate ${customRoundCount} Rounds`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Formula bar */}
                <div className="px-5 py-2.5 border-t border-line/40 bg-surface2/40 flex items-center justify-between text-xs">
                  <span className="text-mute font-semibold">Settlement formula:</span>
                  <span className="font-mono text-primary font-bold">Payout = Bet × Odds × {jackpot.isJackpot ? jackpot.jackpotMultiplier : 1}</span>
                  <span className="text-mute font-mono text-[11px] hidden sm:block">e.g. ₹500 × 10x × {jackpot.isJackpot ? jackpot.multiplierLabel : '1X'} = <span className="text-turf font-bold">₹{((500 * 10) * (jackpot.isJackpot ? jackpot.jackpotMultiplier : 1)).toLocaleString()}</span></span>
                </div>
              </div>
            )
          })()}

          {/* ── Live Race Track ── */}
          <LiveRaceTrack />

          {/* ── Runner Selection Grid ── */}
          <div className="bg-surface border border-line rounded-2xl p-5 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line/60">
              <div className="flex items-center gap-2">
                <Flame size={17} className="text-amber-500" />
                <div>
                  <h3 className="font-bold text-sm text-ink">Runner Selection</h3>
                  <p className="text-[11px] text-mute">Click any runner to force as winner for Race #{currentRace.gameSerial}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-mute">Total Pot:</span>
                <span className="font-mono font-bold text-amber-500 dark:text-gold text-sm">₹{(Number(currentRace.totalPot) || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Force window status */}
            {canForceWinner ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-turf/10 border border-turf/25 text-xs font-semibold text-turf">
                <span className="w-2 h-2 rounded-full bg-turf animate-ping shrink-0" />
                Force window open — {Math.max(0, 10 - Math.round(runElapsed))}s remaining
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface2 border border-line text-xs font-medium text-mute">
                <span className="w-2 h-2 rounded-full bg-mute/40 shrink-0" />
                {forceWindowMsg}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {horses.map((horse) => {
                const isWinner = isCurrentRaceForced && (currentForcedHorseSerial === horse.number || currentForcedHorseSerial === horse.id)
                const isSmartPick = !isCurrentRaceForced && smartPick?.id === horse.id
                const horsePot = currentRace.potDistribution?.[horse.id] || 0
                const projectedPayout = Math.round(horsePot * (Number(horse.odds) || 2.0))

                return (
                  <div key={horse.id} className={`relative p-3 rounded-xl border transition-all flex flex-col gap-2 ${
                    isWinner ? 'bg-amber-500/15 border-amber-500/50 scale-[1.02]' :
                    isSmartPick ? 'bg-turf/10 border-turf/40' :
                    'bg-surface2 hover:bg-surface3 border-line hover:border-primary/40'
                  }`}>
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-[11px] shrink-0" style={{ backgroundColor: horse.color || '#3B82F6' }}>
                          #{horse.number}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-ink text-xs truncate">{horse.name}</div>
                          <div className="text-[10px] text-mute font-mono truncate">{horse.jockey || 'Jockey'}</div>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[11px] text-amber-500 dark:text-gold shrink-0">{horse.odds}x</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-surface border border-line text-[10px]">
                      <div>
                        <div className="text-mute font-semibold">Pot</div>
                        <div className="font-mono font-bold text-ink">₹{horsePot.toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-mute font-semibold">Payout</div>
                        <div className="font-mono font-bold text-turf">₹{projectedPayout.toLocaleString()}</div>
                      </div>
                    </div>

                    {isWinner ? (
                      <div className="flex gap-1">
                        <div className="flex-1 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center gap-1">
                          <Crown size={11} />Winner
                        </div>
                        <button onClick={() => handleClearOverride()} className="px-2 py-1.5 rounded-lg bg-surface hover:bg-surface3 border border-line text-[10px] font-semibold text-danger">✕</button>
                      </div>
                    ) : canForceWinner ? (
                      <button
                        onClick={() => setConfirmLiveWinnerTarget(horse)}
                        className="w-full py-1.5 rounded-lg bg-surface hover:bg-primary hover:text-white border border-line text-[10px] font-bold text-ink transition-all flex items-center justify-center gap-1 active:scale-95"
                      >
                        <Crown size={11} className="text-amber-500" />Force Win
                      </button>
                    ) : (
                      <div className="w-full py-1.5 rounded-lg bg-surface2 border border-line text-[10px] text-mute text-center font-medium cursor-not-allowed">
                        Window closed
                      </div>
                    )}

                    {isSmartPick && (
                      <span className="absolute top-1.5 right-1.5 text-[9px] font-bold text-turf bg-turf/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Sparkles size={9} />Smart
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Scheduled Winners Queue ── */}
          <div className="bg-surface border border-line rounded-2xl p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                <div>
                  <h4 className="font-bold text-sm text-ink">Future Winner Queue</h4>
                  <p className="text-[11px] text-mute">Pre-scheduled round overrides</p>
                </div>
              </div>
              <button onClick={() => fetchScheduledWinners()} disabled={scheduledWinnersLoading} className="p-1.5 rounded-lg bg-surface2 text-mute hover:text-ink transition-colors" title="Refresh">
                <RefreshCw size={13} className={scheduledWinnersLoading ? 'animate-spin text-primary' : ''} />
              </button>
            </div>

            {scheduledWinners.length === 0 ? (
              <div className="py-8 text-center text-xs text-mute bg-surface2/50 rounded-xl border border-line">No scheduled overrides</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[11px] font-semibold text-mute uppercase tracking-wider border-b border-line">
                      <th className="pb-2.5 pr-4">Game Serial</th>
                      <th className="pb-2.5 pr-4">Horse</th>
                      <th className="pb-2.5 pr-4">Reason</th>
                      <th className="pb-2.5 pr-4">Status</th>
                      <th className="pb-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {scheduledWinners.map((sw) => (
                      <tr key={sw.id || sw.gameSerial} className="hover:bg-surface2/40">
                        <td className="py-2.5 pr-4 font-mono font-bold text-primary">#{sw.gameSerial}</td>
                        <td className="py-2.5 pr-4 font-bold text-amber-500 dark:text-gold">#{sw.horseSerial} {sw.horseName || ''}</td>
                        <td className="py-2.5 pr-4 text-mute">{sw.reason || 'Scheduled Override'}</td>
                        <td className="py-2.5 pr-4"><Badge tone={sw.status === 'PENDING' ? 'amber' : 'turf'} size="sm">{sw.status || 'PENDING'}</Badge></td>
                        <td className="py-2.5 text-right">
                          <button onClick={() => handleClearOverride(sw.gameSerial)} className="p-1.5 rounded-lg text-mute hover:text-danger hover:bg-danger/10 transition-colors"><Trash2 size={13} /></button>
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
        /* ── History Tab ── */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-line rounded-2xl p-3 shadow-card">
            <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3 py-2 text-xs w-full sm:w-72">
              <Search size={14} className="text-mute shrink-0" />
              <input value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} placeholder="Search serial, winner..." className="bg-transparent outline-none text-ink placeholder:text-mute w-full" />
            </div>
            <button onClick={handleExportHistory} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface2 hover:bg-surface3 border border-line text-xs font-semibold text-ink transition-colors">
              <Download size={14} /><span>Export CSV</span>
            </button>
          </div>

          <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider font-semibold text-mute border-b border-line bg-surface2/50">
                    {['Serial', 'Distance', 'Time', 'Winner', 'Odds', 'Total Bets', 'Payout', 'GGR', ''].map(h => (
                      <th key={h} className="px-4 py-3.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filteredHistory.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-12 text-mute">
                      <div className="flex flex-col items-center gap-2"><History size={24} className="opacity-40" /><span className="text-xs">No settled rounds from API</span></div>
                    </td></tr>
                  ) : filteredHistory.map((match) => (
                    <tr key={match.id || match.gameSerial} className="hover:bg-surface2/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-ink">#{match.gameSerial}</td>
                      <td className="px-4 py-3.5 text-xs text-mute font-mono">{match.distance || '1000M'}</td>
                      <td className="px-4 py-3.5 text-xs text-mute font-mono">{match.startedAt || '—'}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <img src={resolveImageUrl(match.winnerHorse?.avatar || match.winnerHorse?.imageUrl)} alt="" className="w-7 h-7 rounded-lg object-cover border border-line" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150&auto=format&fit=crop&q=80' }} />
                          <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: match.winnerHorse?.color || '#3B82F6' }}>{match.winnerHorse?.number || '#'}</div>
                          <span className="font-bold text-ink text-xs">{match.winnerHorse?.name || 'Winner'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><Badge tone="gold" size="sm">{match.jackpot || `${match.winnerHorse?.odds || 2.0}x`}</Badge></td>
                      <td className="px-4 py-3.5 font-mono text-ink font-semibold text-xs">₹{(Number(match.totalBets) || 0).toLocaleString()}</td>
                      <td className="px-4 py-3.5 font-mono text-turf font-semibold text-xs">₹{(Number(match.totalPayout) || 0).toLocaleString()}</td>
                      <td className="px-4 py-3.5 font-mono text-xs font-bold">
                        <span className={(Number(match.ggr) || 0) >= 0 ? 'text-turf' : 'text-danger'}>
                          {(Number(match.ggr) || 0) >= 0 ? '+' : '-'}₹{Math.abs(Number(match.ggr) || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => setSelectedRound(match)} className="p-1.5 rounded-lg text-mute hover:text-primary hover:bg-primary/10 transition-colors"><Eye size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Live Winner Dialog ── */}
      <ConfirmDialog
        open={!!confirmLiveWinnerTarget}
        onClose={() => setConfirmLiveWinnerTarget(null)}
        onConfirm={handleConfirmLiveWinner}
        title={`Set Horse #${confirmLiveWinnerTarget?.number} (${confirmLiveWinnerTarget?.name}) as winner?`}
        description={`Horse #${confirmLiveWinnerTarget?.number} "${confirmLiveWinnerTarget?.name}" (${confirmLiveWinnerTarget?.odds}x) will be the guaranteed winner for Race #${currentRace.gameSerial}. This cannot be undone once the race settles.`}
        confirmLabel={isSubmittingLivePick ? 'Confirming…' : 'Confirm Winner'}
        confirmTone="primary"
      />

      {/* ── Schedule Future Winner Modal ── */}
      <Modal
        open={futureModalOpen}
        onClose={() => setFutureModalOpen(false)}
        title="Schedule Future Winner"
        subtitle="Pre-configure a winner for a future game serial"
        footer={
          <>
            <button onClick={() => setFutureModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-mute hover:text-ink hover:bg-surface2 transition-colors">Cancel</button>
            <button onClick={handleScheduleFutureWinner} disabled={isSubmittingFuture || !futureGameSerial.trim()} className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white shadow-glow-primary hover:brightness-110 disabled:opacity-50 transition-all">
              {isSubmittingFuture ? 'Scheduling…' : 'Save Schedule'}
            </button>
          </>
        }
      >
        <form onSubmit={handleScheduleFutureWinner} className="space-y-4 text-xs">
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">Future Game Serial *</span>
            <input type="text" required value={futureGameSerial} onChange={(e) => setFutureGameSerial(e.target.value)} placeholder="e.g. 20260921008" className="bg-surface2 border border-line rounded-xl px-3 py-2 text-sm text-ink font-mono font-bold outline-none focus:border-primary" />
            <span className="text-[11px] text-mute">Current live serial: #{currentRace.gameSerial}</span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">Guaranteed Winner</span>
            <select value={futureSelectedHorseSerial} onChange={(e) => setFutureSelectedHorseSerial(Number(e.target.value))} className="bg-surface2 border border-line rounded-xl px-3 py-2.5 text-xs text-ink outline-none focus:border-primary">
              {horses.map((h) => <option key={h.id} value={h.number}>#{h.number} — {h.name} ({h.odds}x)</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">Jackpot Multiplier</span>
            <select value={futureJackpotMultiplier} onChange={(e) => setFutureJackpotMultiplier(e.target.value)} className="bg-surface2 border border-line rounded-xl px-3 py-2.5 text-xs text-ink outline-none focus:border-primary font-bold">
              <option value="N">N — Standard 1X</option>
              <option value="2X">2X — Double</option>
              <option value="3X">3X — Triple</option>
              <option value="4X">4X — Mega</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">Admin Note</span>
            <input value={futureReason} onChange={(e) => setFutureReason(e.target.value)} placeholder="e.g. VIP Round Override" className="bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink outline-none focus:border-primary" />
          </label>
        </form>
      </Modal>

      {/* ── Jackpot Config Modal ── */}
      <Modal
        open={jackpotConfigModalOpen}
        onClose={() => setJackpotConfigModalOpen(false)}
        title="Jackpot Auto Rules"
        subtitle="Configure automated jackpot trigger mode"
        footer={
          <>
            <button onClick={() => setJackpotConfigModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-mute hover:text-ink hover:bg-surface2 transition-colors">Cancel</button>
            <button onClick={handleSaveJackpotConfig} disabled={isSavingJackpotConfig} className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white shadow-glow-primary hover:brightness-110 disabled:opacity-50 transition-all">
              {isSavingJackpotConfig ? 'Saving…' : 'Save Mode'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveJackpotConfig} className="space-y-4 text-xs">
          <div>
            <span className="font-semibold text-mute uppercase tracking-wider text-[11px] block mb-2">Trigger Mode</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'EVERY_ROUND', name: 'Every Round', Icon: Zap, desc: 'Auto jackpot every race' },
                { id: 'ROUND_INTERVAL', name: 'Round Interval', Icon: Layers, desc: 'e.g. Every 5th race' },
                { id: 'TIME_INTERVAL', name: 'Time Interval', Icon: Timer, desc: 'e.g. Every 180s' },
                { id: 'PROBABILITY', name: 'Probability %', Icon: Dices, desc: 'Random % per race' },
                { id: 'MANUAL', name: 'Manual Only', Icon: Sliders, desc: 'Single round force' },
                { id: 'OFF', name: 'Disabled', Icon: CircleOff, desc: 'Standard 1X only' },
              ].map(({ id, name, Icon, desc }) => {
                const isSelected = tempJackpotConfig.mode === id
                return (
                  <button type="button" key={id} onClick={() => setTempJackpotConfig({ ...tempJackpotConfig, mode: id })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${isSelected ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-400/50' : 'bg-surface2 border-line text-mute hover:text-ink hover:bg-surface3'}`}>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-ink"><Icon size={13} className={isSelected ? 'text-amber-500' : 'text-mute'} />{name}</div>
                    <div className="text-[10px] text-mute mt-1">{desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {tempJackpotConfig.mode === 'ROUND_INTERVAL' && (
            <label className="flex flex-col gap-1.5 p-3 rounded-xl bg-surface2 border border-line">
              <div className="flex justify-between font-semibold text-mute">
                <span className="uppercase tracking-wider text-[11px]">Every X races</span>
                <span className="text-ink font-mono font-bold">{tempJackpotConfig.intervalRounds || 5}</span>
              </div>
              <input type="number" min="1" max="100" value={tempJackpotConfig.intervalRounds || 5} onChange={(e) => setTempJackpotConfig({ ...tempJackpotConfig, intervalRounds: Math.max(1, Number(e.target.value)) })} className="bg-surface border border-line rounded-xl px-3 py-2 text-sm text-ink font-mono font-bold outline-none focus:border-primary" />
            </label>
          )}
          {tempJackpotConfig.mode === 'TIME_INTERVAL' && (
            <label className="flex flex-col gap-1.5 p-3 rounded-xl bg-surface2 border border-line">
              <div className="flex justify-between font-semibold text-mute">
                <span className="uppercase tracking-wider text-[11px]">Interval (seconds)</span>
                <span className="text-ink font-mono font-bold">{tempJackpotConfig.intervalSeconds || 180}s</span>
              </div>
              <input type="number" min="30" max="7200" step="30" value={tempJackpotConfig.intervalSeconds || 180} onChange={(e) => setTempJackpotConfig({ ...tempJackpotConfig, intervalSeconds: Math.max(10, Number(e.target.value)) })} className="bg-surface border border-line rounded-xl px-3 py-2 text-sm text-ink font-mono font-bold outline-none focus:border-primary" />
            </label>
          )}
          {tempJackpotConfig.mode === 'PROBABILITY' && (
            <label className="flex flex-col gap-1.5 p-3 rounded-xl bg-surface2 border border-line">
              <div className="flex justify-between font-semibold text-mute">
                <span className="uppercase tracking-wider text-[11px]">Probability per round</span>
                <span className="text-ink font-mono font-bold">{tempJackpotConfig.probabilityPercent}%</span>
              </div>
              <input type="number" min="0" max="100" step="0.5" value={tempJackpotConfig.probabilityPercent} onChange={(e) => setTempJackpotConfig({ ...tempJackpotConfig, probabilityPercent: Number(e.target.value) })} className="bg-surface border border-line rounded-xl px-3 py-2 text-sm text-ink font-mono font-bold outline-none focus:border-primary" />
            </label>
          )}

          {tempJackpotConfig.mode !== 'OFF' && tempJackpotConfig.mode !== 'MANUAL' && (
            <div>
              <span className="font-semibold text-mute uppercase tracking-wider text-[11px] block mb-2">Triggered Multiplier</span>
              <div className="grid grid-cols-4 gap-2">
                {[{ value: 'RANDOM', label: '🎲 Random' }, { value: 2, label: '2X' }, { value: 3, label: '3X' }, { value: 4, label: '4X' }].map((item) => {
                  const isSelected = String(tempJackpotConfig.targetMultiplier) === String(item.value)
                  return (
                    <button type="button" key={item.value} onClick={() => setTempJackpotConfig({ ...tempJackpotConfig, targetMultiplier: item.value })}
                      className={`p-2.5 rounded-xl border text-center transition-all ${isSelected ? 'bg-amber-500/20 border-amber-500 text-amber-500 font-bold' : 'bg-surface2 border-line text-mute hover:text-ink'}`}>
                      <div className="font-display text-sm">{item.label}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* ── Round Audit Drawer ── */}
      <Drawer open={!!selectedRound} onClose={() => setSelectedRound(null)} title={`Round Audit #${selectedRound?.gameSerial}`} subtitle={`Settled at ${selectedRound?.finishedAt}`}>
        {selectedRound && (
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-2xl bg-gold/10 border border-gold/30 flex items-center gap-3">
              <img src={resolveImageUrl(selectedRound.winnerHorse?.avatar)} alt="" className="w-12 h-12 rounded-xl object-cover border border-gold/40" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150&auto=format&fit=crop&q=80' }} />
              <div>
                <div className="text-[11px] text-mute uppercase font-bold tracking-wider">Champion</div>
                <div className="font-display text-base font-bold text-amber-500 dark:text-gold">#{selectedRound.winnerHorse?.number} {selectedRound.winnerHorse?.name}</div>
                <div className="text-[11px] font-mono text-mute">Odds: {selectedRound.jackpot}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[['Total Bets', `₹${(Number(selectedRound.totalBets)||0).toLocaleString()}`, 'text-ink'], ['Payout', `₹${(Number(selectedRound.totalPayout)||0).toLocaleString()}`, 'text-turf'], ['GGR', `₹${(Number(selectedRound.ggr)||0).toLocaleString()}`, 'text-ink']].map(([label, val, color]) => (
                <div key={label} className="p-3 rounded-xl bg-surface2 border border-line text-center">
                  <div className="text-[10px] text-mute font-bold uppercase">{label}</div>
                  <div className={`font-display text-sm font-bold mt-0.5 ${color}`}>{val}</div>
                </div>
              ))}
            </div>
            <div className="p-3.5 rounded-xl bg-surface2/60 border border-line space-y-1.5">
              <div className="flex items-center gap-1.5 text-mute font-bold text-[11px] uppercase tracking-wider"><ShieldCheck size={13} className="text-turf" />Provably-Fair Hash</div>
              <div className="p-2.5 rounded-xl bg-surface font-mono text-[11px] text-ink break-all border border-line select-all">{selectedRound.seedHash}</div>
            </div>
            {selectedRound.finishOrder?.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs uppercase font-bold text-mute tracking-wider">Finish Order</span>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {selectedRound.finishOrder.map((pos) => (
                    <div key={pos.rank} className="flex items-center justify-between p-2.5 rounded-xl bg-surface2 border border-line font-mono text-xs">
                      <div className="flex items-center gap-2"><span className="font-bold text-mute w-5">#{pos.rank}</span><span className="text-ink font-semibold">#{pos.number} {pos.name}</span></div>
                      <div className="flex items-center gap-3 text-mute"><span>{pos.time}</span><span className="w-12 text-right">{pos.gap}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ── Void Confirm ── */}
      <ConfirmDialog
        open={voidConfirmOpen}
        onClose={() => setVoidConfirmOpen(false)}
        onConfirm={() => { voidCurrentRound(); setVoidConfirmOpen(false); setActionNotice(`Race #${currentRace.gameSerial} voided. All bets refunded.`); setTimeout(() => setActionNotice(null), 4000) }}
        title="Void Current Round?"
        description={`Void Race #${currentRace.gameSerial}? All active bets will be instantly refunded.`}
        confirmLabel="Void & Refund"
        confirmTone="danger"
      />
    </div>
  )
}
