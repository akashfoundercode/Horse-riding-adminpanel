import { useState } from 'react'
import {
  Settings as SettingsIcon,
  Timer,
  Sliders,
  Percent,
  CheckCircle2,
  Activity,
  ShieldCheck,
  Server,
  Database,
  Radio,
  Coins
} from 'lucide-react'
import { useGameEngine } from '../hooks/useGameEngine.js'
import Badge from '../components/Badge.jsx'

export default function Settings() {
  const { settings, setSettings, jackpotConfig, updateJackpotConfig } = useGameEngine()

  const [form, setForm] = useState(settings)
  const [jpConfig, setJpConfig] = useState(jackpotConfig || { enabled: true, probabilityPercent: 2, allowedMultipliers: [2, 3, 4] })
  const [denominations, setDenominations] = useState("5, 10, 50, 100, 500, 1000, 5000")
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSettings(form)
    try {
      if (updateJackpotConfig) {
        await updateJackpotConfig(jpConfig)
      }
    } catch (err) {
      console.error(err)
    }
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  // Calculate total cycle time
  const totalCycleSeconds = Math.round(
    Number(form.bettingWindow) +
    Number(form.lockWindow) +
    Number(form.countdown) +
    Number(form.runDuration) +
    Number(form.finishingDuration) +
    Number(form.resultDuration) +
    Number(form.delayNext)
  )
  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-wide text-ink">
            Settings
          </h2>
          <p className="text-xs text-mute">
            Race lifecycle timers, bet limits, and engine parameters.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-glow-primary transition-all focus-ring shrink-0"
        >
          <CheckCircle2 size={16} />
          <span>Save Configuration</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-turf/10 border border-turf/30 text-turf flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <CheckCircle2 size={18} />
            <span>Configuration saved. Changes apply on the next round.</span>
          </div>
        </div>
      )}

      {/* Total Cycle Summary Card */}
      <div className="bg-surface border border-line rounded-2xl p-5 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Timer size={22} />
          </div>
          <div>
            <div className="text-xs font-bold text-mute uppercase tracking-wider">Total Round Loop Duration</div>
            <div className="font-display text-2xl font-bold text-ink num">
              {totalCycleSeconds} Seconds (~{(totalCycleSeconds / 60).toFixed(1)} min / race)
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-turf/10 text-turf border border-turf/30 font-semibold">
            Betting: {form.bettingWindow}s
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-gold border border-amber-500/30 font-semibold">
            Countdown: {form.countdown}s
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/30 font-semibold">
            Running: {form.runDuration}s
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-gold/10 text-amber-600 dark:text-gold border border-gold/30 font-semibold">
            Result: {form.resultDuration}s
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Race Timing Controls */}
        <div className="bg-surface border border-line rounded-2xl p-6 shadow-card space-y-5">
          <div className="flex items-center gap-2.5 border-b border-line pb-4">
            <Timer size={20} className="text-primary" />
            <div>
              <h3 className="font-display text-base font-bold text-ink tracking-wide">
                1. Race Timing (Seconds)
              </h3>
              <p className="text-xs text-mute">Duration of each lifecycle stage</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Betting Window */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-mute uppercase text-[11px]">Betting Window</span>
                <div className="flex items-center gap-1">
                  <input type="number" min="10" max="120" value={form.bettingWindow} onChange={(e) => setForm({ ...form, bettingWindow: Number(e.target.value) })} className="w-14 text-right text-xs font-mono bg-surface2 border border-line rounded px-1.5 py-0.5 text-ink" />
                  <span className="text-mute text-xs">s</span>
                </div>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                value={form.bettingWindow}
                onChange={(e) => setForm({ ...form, bettingWindow: Number(e.target.value) })}
                className="w-full"
              />
              <p className="text-[11px] text-mute">Default: 35s. User places bets across 12 horses.</p>
            </div>

            {/* Lock Window */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-mute uppercase text-[11px]">Betting Lock Buffer</span>
                <div className="flex items-center gap-1">
                  <input type="number" min="2" max="15" value={form.lockWindow} onChange={(e) => setForm({ ...form, lockWindow: Number(e.target.value) })} className="w-14 text-right text-xs font-mono bg-surface2 border border-line rounded px-1.5 py-0.5 text-ink" />
                  <span className="text-mute text-xs">s</span>
                </div>
              </div>
              <input
                type="range"
                min="2"
                max="15"
                value={form.lockWindow}
                onChange={(e) => setForm({ ...form, lockWindow: Number(e.target.value) })}
                className="w-full"
              />
              <p className="text-[11px] text-mute">Default: 5s. Bets locked & seed confirmed.</p>
            </div>

            {/* Countdown Duration */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-mute uppercase text-[11px]">Countdown Animation</span>
                <div className="flex items-center gap-1">
                  <input type="number" min="3" max="10" value={form.countdown} onChange={(e) => setForm({ ...form, countdown: Number(e.target.value) })} className="w-14 text-right text-xs font-mono bg-surface2 border border-line rounded px-1.5 py-0.5 text-ink" />
                  <span className="text-mute text-xs">s</span>
                </div>
              </div>
              <input
                type="range"
                min="3"
                max="10"
                value={form.countdown}
                onChange={(e) => setForm({ ...form, countdown: Number(e.target.value) })}
                className="w-full"
              />
              <p className="text-[11px] text-mute">Default: 4s (3, 2, 1, GO gate opening).</p>
            </div>

            {/* Race Running Duration */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-mute uppercase text-[11px]">Race Running (1000M)</span>
                <div className="flex items-center gap-1">
                  <input type="number" min="10" max="45" value={form.runDuration} onChange={(e) => setForm({ ...form, runDuration: Number(e.target.value) })} className="w-14 text-right text-xs font-mono bg-surface2 border border-line rounded px-1.5 py-0.5 text-ink" />
                  <span className="text-mute text-xs">s</span>
                </div>
              </div>
              <input
                type="range"
                min="10"
                max="45"
                value={form.runDuration}
                onChange={(e) => setForm({ ...form, runDuration: Number(e.target.value) })}
                className="w-full"
              />
              <p className="text-[11px] text-mute">Default: 20s.</p>
            </div>

            {/* Result Display Duration */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-mute uppercase text-[11px]">Result Showcase</span>
                <div className="flex items-center gap-1">
                  <input type="number" min="3" max="15" value={form.resultDuration} onChange={(e) => setForm({ ...form, resultDuration: Number(e.target.value) })} className="w-14 text-right text-xs font-mono bg-surface2 border border-line rounded px-1.5 py-0.5 text-ink" />
                  <span className="text-mute text-xs">s</span>
                </div>
              </div>
              <input
                type="range"
                min="3"
                max="15"
                value={form.resultDuration}
                onChange={(e) => setForm({ ...form, resultDuration: Number(e.target.value) })}
                className="w-full"
              />
              <p className="text-[11px] text-mute">Default: 5s. Payout credit.</p>
            </div>

            {/* Delay Before Next */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-mute uppercase text-[11px]">Delay Before Next Race</span>
                <div className="flex items-center gap-1">
                  <input type="number" min="1" max="10" value={form.delayNext} onChange={(e) => setForm({ ...form, delayNext: Number(e.target.value) })} className="w-14 text-right text-xs font-mono bg-surface2 border border-line rounded px-1.5 py-0.5 text-ink" />
                  <span className="text-mute text-xs">s</span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={form.delayNext}
                onChange={(e) => setForm({ ...form, delayNext: Number(e.target.value) })}
                className="w-full"
              />
              <p className="text-[11px] text-mute">Default: 2s.</p>
            </div>
          </div>
        </div>

        {/* 2. Betting Multipliers, Limits & Coin Chips */}
        <div className="bg-surface border border-line rounded-2xl p-6 shadow-card space-y-5">
          <div className="flex items-center gap-2.5 border-b border-line pb-4">
            <Coins size={20} className="text-amber-500" />
            <div>
              <h3 className="font-display text-base font-bold text-ink tracking-wide">
                2. Bet Limits & Coin Chips
              </h3>
              <p className="text-xs text-mute">Denominations and platform risk boundaries</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">
                Min Bet (₹)
              </span>
              <input
                type="number"
                value={form.minBet}
                onChange={(e) => setForm({ ...form, minBet: Number(e.target.value) })}
                className="bg-surface2 border border-line rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-primary font-mono"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">
                Max Bet (₹)
              </span>
              <input
                type="number"
                value={form.maxBet}
                onChange={(e) => setForm({ ...form, maxBet: Number(e.target.value) })}
                className="bg-surface2 border border-line rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-primary font-mono"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">
                House Edge (%)
              </span>
              <input
                type="number"
                step="0.5"
                value={form.houseEdgePercent}
                onChange={(e) => setForm({ ...form, houseEdgePercent: Number(e.target.value) })}
                className="bg-surface2 border border-line rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-primary font-mono"
              />
            </label>
          </div>

          {/* Multi-coin chips */}
          <div className="pt-2">
            <span className="font-semibold text-mute uppercase tracking-wider text-[11px] block mb-2">
              Coin Chips (comma separated)
            </span>
            <input
              value={denominations}
              onChange={(e) => setDenominations(e.target.value)}
              className="bg-surface2 border border-line rounded-xl px-3 py-2.5 text-sm text-ink outline-none focus:border-primary w-full font-mono"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {denominations.split(",").map(d => d.trim()).filter(Boolean).map(chip => (
                <span
                  key={chip}
                  className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-gold border border-amber-500/30 text-xs font-bold font-mono shadow-sm"
                >
                  ₹{chip}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Jackpot System Configuration (Strictly Slots ['N', '2X', '3X', '4X']) */}
        <div className="bg-surface border border-line rounded-2xl p-6 shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-sm">
                🎰
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-ink tracking-wide">
                  3. Jackpot Multiplier System
                </h3>
                <p className="text-xs text-mute">4 fixed slots (N, 2X, 3X, 4X) & auto-trigger probability</p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-bold text-ink">Auto-Trigger</span>
              <input
                type="checkbox"
                checked={jpConfig.enabled}
                onChange={(e) => setJpConfig({ ...jpConfig, enabled: e.target.checked })}
                className="w-4 h-4 text-primary rounded accent-primary cursor-pointer"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">
                Auto-Trigger Probability (% per round)
              </span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={jpConfig.probabilityPercent}
                onChange={(e) => setJpConfig({ ...jpConfig, probabilityPercent: Number(e.target.value) })}
                className="bg-surface2 border border-line rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-primary font-mono"
              />
              <span className="text-[11px] text-mute">Recommended: 2% (Rare excitement trigger)</span>
            </label>

            <div>
              <span className="font-semibold text-mute uppercase tracking-wider text-[11px] block mb-1.5">
                Allowed Multipliers
              </span>
              <div className="flex gap-2">
                {[2, 3, 4].map((mult) => {
                  const isAllowed = jpConfig.allowedMultipliers.includes(mult)
                  return (
                    <button
                      type="button"
                      key={mult}
                      onClick={() => {
                        const current = jpConfig.allowedMultipliers
                        const next = isAllowed
                          ? current.filter(m => m !== mult)
                          : [...current, mult].sort((a, b) => a - b)
                        setJpConfig({ ...jpConfig, allowedMultipliers: next })
                      }}
                      className={`flex-1 py-2 rounded-xl border text-center font-bold text-xs transition-all ${isAllowed
                          ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-sm'
                          : 'bg-surface2 border-line text-mute opacity-50'
                        }`}
                    >
                      {mult}X Multiplier
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Track Settings & Live Diagnostics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Track Presets */}
          <div className="bg-surface border border-line rounded-2xl p-6 shadow-card space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Sliders size={18} className="text-violet-500" />
              <h3 className="font-display text-base font-bold text-ink tracking-wide">Track Presets</h3>
            </div>

            <div className="space-y-4 text-xs">
              <label className="flex flex-col gap-1.5">
                <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">
                  Default Track Distance
                </span>
                <select
                  value={form.trackDistance}
                  onChange={(e) => setForm({ ...form, trackDistance: e.target.value })}
                  className="bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink outline-none focus:border-primary"
                >
                  <option value="1000M">1000M (Standard Royal Stadium)</option>
                  <option value="800M">800M (Sprint Derby)</option>
                  <option value="1200M">1200M (Endurance Classic)</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-semibold text-mute uppercase tracking-wider text-[11px]">
                  Track Surface Preset
                </span>
                <select
                  value={form.surfaceCondition}
                  onChange={(e) => setForm({ ...form, surfaceCondition: e.target.value })}
                  className="bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink outline-none focus:border-primary"
                >
                  <option value="Firm Turf">Firm Turf (Fast pace)</option>
                  <option value="Good Turf">Good Turf (Balanced)</option>
                  <option value="Wet Turf">Wet Turf (Variable lead)</option>
                </select>
              </label>
            </div>
          </div>

          {/* Engine Health & Diagnostics */}
          <div className="bg-surface border border-line rounded-2xl p-6 shadow-card space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Activity size={18} className="text-turf" />
              <h3 className="font-display text-base font-bold text-ink tracking-wide">
                Engine Health
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface2 border border-line">
                <div className="flex items-center gap-2">
                  <Database size={15} className="text-primary" />
                  <span className="font-semibold text-ink">PostgreSQL Atomic DB</span>
                </div>
                <Badge tone="turf" size="sm" dot>Connected (9ms)</Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface2 border border-line">
                <div className="flex items-center gap-2">
                  <Server size={15} className="text-amber-500" />
                  <span className="font-semibold text-ink">Redis Global PubSub Stream</span>
                </div>
                <Badge tone="turf" size="sm" dot>Active (2ms)</Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface2 border border-line">
                <div className="flex items-center gap-2">
                  <Radio size={15} className="text-violet-500" />
                  <span className="font-semibold text-ink">Multi-Device WebSocket Cluster</span>
                </div>
                <Badge tone="turf" size="sm" dot>Synced (100% SLA)</Badge>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
