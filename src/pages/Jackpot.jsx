import { useState, useEffect, useCallback } from 'react'
import {
  Zap, RefreshCw, Trash2, CheckCircle2, AlertCircle,
  Clock, Repeat, Percent, ToggleLeft, ChevronDown, Calendar
} from 'lucide-react'
import { raceControlApi } from '../services/raceControlApi.js'
import { socketService } from '../services/socket.js'

// ─── helpers ────────────────────────────────────────────────────────────────
const MULTIPLIER_OPTS = [2, 3, 4, 'RANDOM']

const modeLabel = (cfg) => {
  if (!cfg) return '—'
  switch (cfg.mode) {
    case 'EVERY_ROUND':    return `Every round → ${cfg.targetMultiplier === 'RANDOM' ? 'Random' : cfg.targetMultiplier + 'X'}`
    case 'ROUND_INTERVAL': return `Every ${cfg.intervalRounds} rounds → ${cfg.targetMultiplier === 'RANDOM' ? 'Random' : cfg.targetMultiplier + 'X'}`
    case 'TIME_INTERVAL':  return `Every ${cfg.intervalSeconds}s → ${cfg.targetMultiplier === 'RANDOM' ? 'Random' : cfg.targetMultiplier + 'X'}`
    case 'PROBABILITY':    return `${cfg.probabilityPercent}% chance per round → ${cfg.targetMultiplier === 'RANDOM' ? 'Random' : cfg.targetMultiplier + 'X'}`
    case 'DISABLED':       return 'Disabled (manual only)'
    default:               return cfg.mode || '—'
  }
}

const multiplierBadge = (m) => {
  if (!m || m === 'N' || m === 1) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-surface3 text-mute">N — Standard</span>
  const colors = { '2X': 'bg-blue-500/15 text-blue-400', '3X': 'bg-amber-500/15 text-amber-400', '4X': 'bg-rose-500/15 text-rose-400' }
  const label = typeof m === 'number' ? `${m}X` : m
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors[label] || 'bg-primary/15 text-primary'}`}>{label}</span>
}

const Toast = ({ msg, type }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border animate-slide-in
    ${type === 'error' ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-turf/10 border-turf/30 text-turf'}`}>
    {type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
    {msg}
  </div>
)

// ─── Tab 1: Automation Config ────────────────────────────────────────────────
function AutomationTab({ onToast, onRefresh }) {
  const [mode, setMode] = useState('PROBABILITY')
  const [intervalRounds, setIntervalRounds] = useState(5)
  const [intervalSeconds, setIntervalSeconds] = useState(180)
  const [probabilityPercent, setProbabilityPercent] = useState(10)
  const [targetMultiplier, setTargetMultiplier] = useState('RANDOM')
  const [saving, setSaving] = useState(false)

  // Load current config on mount
  useEffect(() => {
    raceControlApi.getJackpotConfig().then((d) => {
      const c = d?.config || d
      if (c?.mode) setMode(c.mode)
      if (c?.intervalRounds) setIntervalRounds(c.intervalRounds)
      if (c?.intervalSeconds) setIntervalSeconds(c.intervalSeconds)
      if (c?.probabilityPercent) setProbabilityPercent(c.probabilityPercent)
      if (c?.targetMultiplier) setTargetMultiplier(c.targetMultiplier)
    }).catch(() => {})
  }, [])

  const buildPayload = () => {
    const base = { mode, targetMultiplier }
    if (mode === 'ROUND_INTERVAL') return { ...base, intervalRounds: Number(intervalRounds) }
    if (mode === 'TIME_INTERVAL')  return { ...base, intervalSeconds: Number(intervalSeconds) }
    if (mode === 'PROBABILITY')    return { ...base, probabilityPercent: Number(probabilityPercent) }
    return base
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await raceControlApi.updateJackpotConfig(buildPayload())
      onToast('Configuration saved', 'success')
      onRefresh()
    } catch (e) {
      onToast(e.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const modes = [
    { value: 'EVERY_ROUND',    label: 'Every Round',         icon: Repeat },
    { value: 'ROUND_INTERVAL', label: 'Every N Rounds',      icon: Repeat },
    { value: 'TIME_INTERVAL',  label: 'Every X Seconds',     icon: Clock },
    { value: 'PROBABILITY',    label: 'Random Probability %', icon: Percent },
    { value: 'DISABLED',       label: 'Disabled',            icon: ToggleLeft },
  ]

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-mute uppercase tracking-wider">Trigger Mode</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {modes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all
                ${mode === value
                  ? 'bg-primary text-white border-primary shadow-glow-primary'
                  : 'bg-surface2 border-line text-mute hover:text-ink hover:border-primary/40'}`}
            >
              <Icon size={14} className="shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic inputs */}
      {mode === 'ROUND_INTERVAL' && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-mute uppercase tracking-wider">Interval (rounds)</label>
          <input
            type="number" min="1" max="100" value={intervalRounds}
            onChange={(e) => setIntervalRounds(e.target.value)}
            className="w-full bg-surface2 border border-line rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-primary"
            placeholder="e.g. 5"
          />
        </div>
      )}
      {mode === 'TIME_INTERVAL' && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-mute uppercase tracking-wider">Interval (seconds)</label>
          <input
            type="number" min="30" max="86400" value={intervalSeconds}
            onChange={(e) => setIntervalSeconds(e.target.value)}
            className="w-full bg-surface2 border border-line rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-primary"
            placeholder="e.g. 180"
          />
        </div>
      )}
      {mode === 'PROBABILITY' && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-mute uppercase tracking-wider">Probability per round (%)</label>
          <div className="flex items-center gap-3">
            <input
              type="range" min="1" max="100" value={probabilityPercent}
              onChange={(e) => setProbabilityPercent(e.target.value)}
              className="flex-1"
            />
            <input
              type="number" min="1" max="100" value={probabilityPercent}
              onChange={(e) => setProbabilityPercent(e.target.value)}
              className="w-16 bg-surface2 border border-line rounded-lg px-2 py-1.5 text-sm text-ink text-center focus:outline-none focus:border-primary"
            />
            <span className="text-sm text-mute">%</span>
          </div>
        </div>
      )}

      {/* Multiplier */}
      {mode !== 'DISABLED' && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-mute uppercase tracking-wider">Target Multiplier</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="1"
              step="1"
              value={targetMultiplier === 'RANDOM' ? '' : targetMultiplier}
              onChange={(e) => setTargetMultiplier(e.target.value === '' ? 'RANDOM' : Number(e.target.value))}
              placeholder="e.g. 2, 3, 4, 10…"
              className="flex-1 bg-surface2 border border-line rounded-xl px-4 py-2.5 text-sm text-ink font-mono focus:outline-none focus:border-primary"
            />
            <button
              onClick={() => setTargetMultiplier('RANDOM')}
              className={`px-4 py-2.5 rounded-xl border text-sm font-bold transition-all shrink-0
                ${targetMultiplier === 'RANDOM'
                  ? 'bg-primary text-white border-primary shadow-glow-primary'
                  : 'bg-surface2 border-line text-mute hover:text-ink'}`}
            >
              🎲 Random
            </button>
          </div>
          <p className="text-[11px] text-mute">Type any multiplier value, or pick Random.</p>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-glow-primary"
      >
        {saving ? 'Saving…' : 'Save Configuration'}
      </button>
    </div>
  )
}

// ─── Tab 2: Manual Override ──────────────────────────────────────────────────
function ManualTab({ currentSerial, onToast, onRefresh }) {
  const [scheduleType, setScheduleType] = useState('serial') // serial | rounds | time
  const [gameSerial, setGameSerial] = useState('')
  const [roundsAfter, setRoundsAfter] = useState(1)
  const [afterSeconds, setAfterSeconds] = useState(60)
  const [scheduledTime, setScheduledTime] = useState('')
  const [schedMult, setSchedMult] = useState(2)
  const [loading, setLoading] = useState(null) // which button is loading

  const forceNow = async (multiplier) => {
    setLoading(multiplier)
    try {
      await raceControlApi.forceJackpot({ multiplier })
      onToast(`Jackpot ${multiplier === 'RANDOM' ? 'Random' : multiplier + 'X'} forced on current race`, 'success')
      onRefresh()
    } catch (e) {
      onToast(e.message || 'Force failed', 'error')
    } finally {
      setLoading(null)
    }
  }

  const resetNow = async () => {
    setLoading('reset')
    try {
      await raceControlApi.clearForcedJackpot(currentSerial)
      onToast('Reset to standard (N)', 'success')
      onRefresh()
    } catch (e) {
      onToast(e.message || 'Reset failed', 'error')
    } finally {
      setLoading(null)
    }
  }

  const scheduleJackpot = async () => {
    setLoading('schedule')
    try {
      let payload = { multiplier: schedMult }
      if (scheduleType === 'serial')  payload.gameSerial = gameSerial
      if (scheduleType === 'rounds')  payload.roundsAfter = Number(roundsAfter)
      if (scheduleType === 'time' && scheduledTime) payload.scheduledTime = new Date(scheduledTime).toISOString()
      else if (scheduleType === 'time') payload.afterSeconds = Number(afterSeconds)
      await raceControlApi.forceJackpot(payload)
      onToast('Jackpot scheduled', 'success')
      onRefresh()
    } catch (e) {
      onToast(e.message || 'Schedule failed', 'error')
    } finally {
      setLoading(null)
    }
  }

  const quickBtns = [
    { label: '2X', value: 2, color: 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20' },
    { label: '3X', value: 3, color: 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' },
    { label: '4X', value: 4, color: 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20' },
    { label: '🎲 Random', value: 'RANDOM', color: 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20' },
  ]

  return (
    <div className="space-y-6">
      {/* Quick force current race */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-mute uppercase tracking-wider">Current Race — Instant Force</span>
          <span className="text-xs font-mono text-mute">#{currentSerial}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickBtns.map(({ label, value, color }) => (
            <button
              key={value}
              onClick={() => forceNow(value)}
              disabled={!!loading}
              className={`py-2.5 rounded-xl border text-sm font-bold transition-all disabled:opacity-50 ${color}`}
            >
              {loading === value ? '…' : `Force ${label}`}
            </button>
          ))}
        </div>
        <button
          onClick={resetNow}
          disabled={!!loading}
          className="w-full py-2.5 rounded-xl border border-line bg-surface2 text-sm font-semibold text-mute hover:text-ink hover:border-danger/40 hover:bg-danger/5 disabled:opacity-50 transition-all"
        >
          {loading === 'reset' ? 'Resetting…' : 'Reset to Normal (N)'}
        </button>
      </div>

      <div className="border-t border-line" />

      {/* Schedule future */}
      <div className="space-y-4">
        <span className="text-xs font-semibold text-mute uppercase tracking-wider">Schedule Future Jackpot</span>

        {/* Schedule type tabs */}
        <div className="flex gap-1 bg-surface2 p-1 rounded-xl">
          {[
            { value: 'serial', label: 'Game Serial' },
            { value: 'rounds', label: 'After N Rounds' },
            { value: 'time',   label: 'By Time' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setScheduleType(value)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${scheduleType === value ? 'bg-surface text-ink shadow-sm border border-line' : 'text-mute hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {scheduleType === 'serial' && (
          <input
            type="text" value={gameSerial} onChange={(e) => setGameSerial(e.target.value)}
            placeholder="e.g. 20260923050"
            className="w-full bg-surface2 border border-line rounded-xl px-4 py-2.5 text-sm text-ink font-mono focus:outline-none focus:border-primary"
          />
        )}
        {scheduleType === 'rounds' && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-mute shrink-0">After</span>
            <input
              type="number" min="1" max="100" value={roundsAfter}
              onChange={(e) => setRoundsAfter(e.target.value)}
              className="w-24 bg-surface2 border border-line rounded-xl px-3 py-2.5 text-sm text-ink text-center focus:outline-none focus:border-primary"
            />
            <span className="text-sm text-mute shrink-0">rounds</span>
          </div>
        )}
        {scheduleType === 'time' && (
          <div className="space-y-2">
            <input
              type="datetime-local" value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-primary"
            />
            <div className="flex items-center gap-2 text-xs text-mute">
              <span>or after</span>
              <input
                type="number" min="1" value={afterSeconds}
                onChange={(e) => setAfterSeconds(e.target.value)}
                className="w-20 bg-surface2 border border-line rounded-lg px-2 py-1 text-sm text-ink text-center focus:outline-none focus:border-primary"
              />
              <span>seconds</span>
            </div>
          </div>
        )}

        {/* Multiplier for schedule */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-mute uppercase tracking-wider">Multiplier</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="1"
              step="1"
              value={schedMult === 'RANDOM' ? '' : schedMult}
              onChange={(e) => setSchedMult(e.target.value === '' ? 'RANDOM' : Number(e.target.value))}
              placeholder="e.g. 2, 3, 4, 10…"
              className="flex-1 bg-surface2 border border-line rounded-xl px-4 py-2.5 text-sm text-ink font-mono focus:outline-none focus:border-primary"
            />
            <button
              onClick={() => setSchedMult('RANDOM')}
              className={`px-4 py-2.5 rounded-xl border text-sm font-bold transition-all shrink-0
                ${schedMult === 'RANDOM'
                  ? 'bg-primary text-white border-primary shadow-glow-primary'
                  : 'bg-surface2 border-line text-mute hover:text-ink'}`}
            >
              🎲 Random
            </button>
          </div>
        </div>

        <button
          onClick={scheduleJackpot}
          disabled={!!loading || (scheduleType === 'serial' && !gameSerial.trim())}
          className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-glow-primary"
        >
          {loading === 'schedule' ? 'Scheduling…' : 'Schedule Jackpot'}
        </button>
      </div>
    </div>
  )
}

// ─── Tab 3: Scheduled Table ──────────────────────────────────────────────────
function ScheduledTab({ scheduled, onCancel, cancelLoading }) {
  if (!scheduled?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-mute gap-2">
        <Calendar size={32} className="opacity-30" />
        <span className="text-sm">No scheduled jackpots</span>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line">
            {['Game Serial / Time', 'Multiplier', 'Reason', 'Status', ''].map((h) => (
              <th key={h} className="text-left text-[11px] font-semibold text-mute uppercase tracking-wider pb-3 pr-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {scheduled.map((row, i) => (
            <tr key={row.gameSerial || i} className="hover:bg-surface2/50 transition-colors">
              <td className="py-3 pr-4">
                <div className="font-mono text-xs text-ink">{row.gameSerial || '—'}</div>
                {row.scheduledTime && (
                  <div className="text-[11px] text-mute mt-0.5">
                    {new Date(row.scheduledTime).toLocaleString()}
                  </div>
                )}
              </td>
              <td className="py-3 pr-4">{multiplierBadge(row.multiplier || row.multiplierLabel)}</td>
              <td className="py-3 pr-4 text-xs text-mute max-w-[140px] truncate">{row.reason || 'Manual'}</td>
              <td className="py-3 pr-4">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold
                  ${row.status === 'PENDING' ? 'bg-amber-500/15 text-amber-400' :
                    row.status === 'APPLIED' ? 'bg-turf/15 text-turf' :
                    'bg-surface3 text-mute'}`}>
                  {row.status || 'PENDING'}
                </span>
              </td>
              <td className="py-3">
                <button
                  onClick={() => onCancel(row.gameSerial)}
                  disabled={cancelLoading === row.gameSerial}
                  className="p-1.5 rounded-lg text-mute hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-40"
                  title="Cancel"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Jackpot() {
  const [tab, setTab] = useState('automation')
  const [status, setStatus] = useState(null)
  const [scheduled, setScheduled] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelLoading, setCancelLoading] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchStatus = useCallback(async () => {
    try {
      const data = await raceControlApi.getJackpotStatus()
      setStatus(data)
      setScheduled(data?.scheduledJackpots || data?.scheduled || [])
    } catch {
      // keep stale data
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()

    // Socket: real-time updates
    const off1 = socketService.on('admin:jackpot_updated', () => fetchStatus())
    const off2 = socketService.on('admin:jackpot_config_updated', () => fetchStatus())

    return () => { off1(); off2() }
  }, [fetchStatus])

  const handleCancel = async (gameSerial) => {
    setCancelLoading(gameSerial)
    try {
      await raceControlApi.clearForcedJackpot(gameSerial)
      showToast('Jackpot cancelled', 'success')
      fetchStatus()
    } catch (e) {
      showToast(e.message || 'Cancel failed', 'error')
    } finally {
      setCancelLoading(null)
    }
  }

  const currentSerial = status?.activeRace?.gameSerial || status?.gameSerial || '—'
  const currentMultiplier = status?.activeRace?.multiplierLabel || status?.multiplierLabel || 'N'
  const config = status?.config || status?.mode ? status : null

  const tabs = [
    { id: 'automation', label: 'Automation' },
    { id: 'manual',     label: 'Manual Override' },
    { id: 'scheduled',  label: `Scheduled${scheduled.length ? ` (${scheduled.length})` : ''}` },
  ]

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header card */}
      <div className="bg-surface border border-line rounded-2xl p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-amber-400" />
              <h1 className="text-base font-bold text-ink">Jackpot Management</h1>
            </div>
            <p className="text-xs text-mute">
              {config ? modeLabel(config) : 'Loading configuration…'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[10px] text-mute uppercase tracking-wider mb-1">Active Race</div>
              {multiplierBadge(currentMultiplier)}
            </div>
            <button
              onClick={fetchStatus}
              className="p-2 rounded-xl bg-surface2 border border-line text-mute hover:text-ink hover:bg-surface3 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Live stats row */}
        {status && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Round', value: `#${currentSerial}` },
              { label: 'Next In', value: status?.nextIn ?? status?.roundsUntilNext != null ? `${status.roundsUntilNext ?? '—'} rounds` : '—' },
              { label: 'Mode', value: status?.config?.mode || status?.mode || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-surface2 rounded-xl px-3 py-2.5 text-center">
                <div className="text-[10px] text-mute uppercase tracking-wider">{label}</div>
                <div className="text-sm font-bold text-ink font-mono mt-0.5 truncate">{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
        <div className="flex border-b border-line">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors
                ${tab === id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-mute hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'automation' && (
            <AutomationTab onToast={showToast} onRefresh={fetchStatus} />
          )}
          {tab === 'manual' && (
            <ManualTab currentSerial={currentSerial} onToast={showToast} onRefresh={fetchStatus} />
          )}
          {tab === 'scheduled' && (
            <ScheduledTab scheduled={scheduled} onCancel={handleCancel} cancelLoading={cancelLoading} />
          )}
        </div>
      </div>
    </div>
  )
}
