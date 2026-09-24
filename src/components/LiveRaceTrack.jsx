import { useState } from 'react'
import {
  Flag,
  Zap,
  Trophy,
  Timer,
  Radio,
  Flame,
  Sparkles,
  Eye,
  Maximize2,
  Coins,
  Lock,
} from 'lucide-react'
import { useGameEngine } from '../hooks/useGameEngine.js'
import { resolveImageUrl } from '../utils/imageUrl.js'

export default function LiveRaceTrack() {
  const { currentRace, socketStatus, settings, horses, forcedWinner, manualWinnerId, scheduledWinners } = useGameEngine()
  const {
    stage,
    stageRemaining,
    stageElapsed,
    horsePositions,
    winner,
    gameSerial,
    leader: socketLeader,
    countdown,
    jackpot,
  } = currentRace

  // Detect if any horse is forced for this round (admin override / scheduled / manual)
  const activeForcedSerial =
    forcedWinner?.horseSerial ||
    forcedWinner?.horseId ||
    manualWinnerId ||
    scheduledWinners?.find((s) => String(s.gameSerial) === String(gameSerial))?.horseSerial

  const forcedTargetStr = activeForcedSerial ? String(activeForcedSerial) : null
  const isForcedMatch = (h) =>
    forcedTargetStr &&
    (String(h.number) === forcedTargetStr ||
      String(h.id) === forcedTargetStr ||
      String(h.serialNumber) === forcedTargetStr)

  // Match live horse positions with master horse database to get the latest custom avatar images
  let enrichedHorses = horsePositions.map((hp) => {
    const master = horses.find(
      (m) =>
        String(m.number) === String(hp.number) ||
        String(m.id) === String(hp.id) ||
        String(m.serialNumber) === String(hp.number)
    )
    return {
      ...hp,
      name: master?.name || hp.name,
      color: master?.color || hp.color || '#3B82F6',
      avatar: resolveImageUrl(master?.imageUrl || master?.image_url || master?.avatar || hp.avatar),
      odds: master?.odds || hp.odds || 3.5,
    }
  })

  // 🔥 ABSOLUTE FORCED OVERRIDE: If a horse is forced, it is strictly ahead of all others
  if (forcedTargetStr && (stage === 'RUNNING' || stage === 'FINISHING')) {
    const otherHorses = enrichedHorses.filter((h) => !isForcedMatch(h))
    const maxOtherDist = otherHorses.reduce((max, h) => Math.max(max, Number(h.distance) || 0), 0)

    enrichedHorses = enrichedHorses.map((hp) => {
      if (isForcedMatch(hp)) {
        const leadAdvantage = stage === 'FINISHING' ? 35 : stageElapsed >= 15 ? 28 : stageElapsed >= 10 ? 20 : 14
        const guaranteedDist = Math.min(1000, Math.max(Number(hp.distance) || 0, maxOtherDist + leadAdvantage))
        return {
          ...hp,
          distance: guaranteedDist,
          currentDistanceM: guaranteedDist,
          rank: 1,
          currentRank: 1,
          status: 'LEADING',
          sprint: true,
          speed: Math.max(Number(hp.speed) || 60, 68),
          speedKmh: Math.max(Number(hp.speedKmh) || 60, 68),
        }
      } else {
        const forcedHorse = enrichedHorses.find(isForcedMatch)
        const forcedDist = forcedHorse ? Math.max(Number(forcedHorse.distance) || 0, maxOtherDist + 14) : 1000
        const clampedDist = Math.min(Number(hp.distance) || 0, Math.max(0, forcedDist - 10))
        return {
          ...hp,
          distance: clampedDist,
          currentDistanceM: clampedDist,
          status: 'CONTENDING',
        }
      }
    })
  }

  // Sort horse positions by distance for leader ranking
  const sortedHorses = [...enrichedHorses].sort((a, b) => {
    if (forcedTargetStr) {
      if (isForcedMatch(a)) return -1
      if (isForcedMatch(b)) return 1
    }
    return b.distance - a.distance
  })
  const top3 = sortedHorses.slice(0, 3)

  const leaderHorse = sortedHorses[0]
  const leader = forcedTargetStr && leaderHorse
    ? {
      serialNumber: leaderHorse.number,
      name: leaderHorse.name,
      distanceCovered: `${Math.round(leaderHorse.distance)}M`,
    }
    : socketLeader
      ? {
        serialNumber: socketLeader.serialNumber,
        name: socketLeader.name,
        distanceCovered: socketLeader.distanceCovered,
      }
      : leaderHorse
        ? {
          serialNumber: leaderHorse.number,
          name: leaderHorse.name,
          distanceCovered: `${Math.round(leaderHorse.distance)}M`,
        }
        : null

  // 20-second Running Progress Calculation
  const runDuration = settings.runDuration || 20
  const runningProgressPercent =
    stage === 'RUNNING'
      ? (typeof currentRace.progressRatio === 'number'
        ? Math.min(100, Math.max(0, currentRace.progressRatio * 100))
        : Math.min(100, Math.max(0, (stageElapsed / runDuration) * 100)))
      : stage === 'FINISHING' || stage === 'RESULT'
        ? 100
        : 0

  const displayElapsed = typeof currentRace.elapsedSec === 'number'
    ? Number(currentRace.elapsedSec).toFixed(1)
    : `${stageElapsed}.0`

  // Track Milestone Zones
  const getMilestoneText = () => {
    if (stage !== 'RUNNING') return null
    if (stageElapsed <= 5) return { label: "🚀 Starting Gate Breakout (0M – 250M)", color: "text-blue-400" }
    if (stageElapsed <= 10) return { label: "⚔️ Midfield Speed Pack (250M – 500M)", color: "text-indigo-400" }
    if (stageElapsed <= 15) return { label: "🌀 Final Turn Position Jockeying (500M – 750M)", color: "text-amber-400" }
    return { label: "🔥 Final 250M Full Sprint to Finish! (750M – 1000M)", color: "text-red-400" }
  }

  const currentMilestone = getMilestoneText()
  // The engine uses 35s open + 5s lock, but admins should see one continuous
  // 40-second betting clock rather than two disconnected counters.
  const bettingCycleRemaining = Math.max(0, Math.ceil(stage === 'BETTING_OPEN'
    ? stageRemaining + (settings.lockWindow || 5)
    : stageRemaining))

  return (
    <div className="bg-surface border border-line rounded-2xl p-4 overflow-hidden shadow-card flex flex-col gap-3">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-sm">
            <Flag size={21} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base tracking-wide text-ink font-bold">Royal Turf Racecourse</h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 num font-mono">
                Round #{gameSerial}
              </span>
              {jackpot?.isJackpot && jackpot?.multiplierLabel !== 'N' && (
                <span className="flex items-center gap-1.5 text-xs font-black px-2.5 py-0.5 rounded-lg bg-amber-500 text-slate-950 border border-amber-400 shadow-glow-gold animate-bounce">
                  <Coins size={13} />
                  <span>{jackpot.multiplierLabel} JACKPOT</span>
                </span>
              )}
            </div>
            <p className="text-xs text-mute mt-0.5">
              1000m flat sprint · live steward feed
            </p>
          </div>
        </div>

        {/* Stage Status Badge */}
        <div className="flex items-center gap-2.5">
          {stage === 'BETTING_OPEN' && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-turf/15 border border-turf/40 text-turf shadow-glow-turf">
              <span className="w-2.5 h-2.5 rounded-full bg-turf live-dot" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Betting open · {bettingCycleRemaining}s remaining
              </span>
            </div>
          )}

          {stage === 'BETTING_CLOSED' && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-500/20 border border-red-500/50 text-red-500 animate-pulse">
              <Lock size={13} className="text-red-500" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Bets closed · {bettingCycleRemaining}s
              </span>
            </div>
          )}

          {stage === 'COUNTDOWN' && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-500 animate-bounce">
              <Zap size={15} />
              <span className="text-xs font-black uppercase tracking-wider">
                ⚡ Gate Release: {countdown !== null && countdown !== undefined ? countdown : stageRemaining}s (3..2..1 GO!)
              </span>
            </div>
          )}

          {stage === 'RUNNING' && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-turf/15 border border-turf/40 text-turf shadow-glow-turf">
              <span className="w-2.5 h-2.5 rounded-full bg-turf live-dot" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Live 20s Run: {stageElapsed}s / {runDuration}s ({Math.max(0, runDuration - stageElapsed)}s left)
              </span>
            </div>
          )}

          {stage === 'FINISHING' && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary/20 border border-primary/40 text-primary animate-pulse">
              <Flag size={15} />
              <span className="text-xs font-bold uppercase tracking-wider">Photo Finish Line Cross!</span>
            </div>
          )}

          {stage === 'RESULT' && winner && (
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gold/25 border border-gold/50 text-amber-600 dark:text-gold shadow-glow-gold animate-pulse">
              <img
                src={resolveImageUrl(winner.avatar || winner.imageUrl)}
                alt={winner.name}
                className="w-7 h-7 rounded-lg object-cover border border-amber-400 shadow-sm"
              />
              <Trophy size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">
                WINNER: #{winner.number} {winner.name} ({winner.odds}x)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Running-only race HUD */}
      {stage === 'RUNNING' && (
        <div className="bg-surface2/80 dark:bg-surface2/50 border border-line rounded-xl p-3.5 flex flex-col gap-2.5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2 font-bold">
              <Flame size={16} className="text-red-500 animate-pulse" />
              <span className={currentMilestone?.color || "text-ink"}>
                {currentMilestone?.label}
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-mute">Race clock:</span>
              <span className="text-ink font-bold text-sm">{displayElapsed}s / {runDuration}.0s</span>
              <span className="text-turf font-bold">({runningProgressPercent.toFixed(0)}%)</span>
            </div>
          </div>

          {/* 20-Second Progress Bar */}
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500 rounded-full transition-all duration-300 ease-linear shadow-sm"
              style={{ width: `${runningProgressPercent}%` }}
            />
          </div>

          {/* Live Top 3 Leader Podium with Master Horse Images */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {top3.map((h, idx) => (
              <div
                key={h.id}
                className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs ${idx === 0
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-gold font-bold shadow-sm"
                  : idx === 1
                    ? "bg-slate-200/50 dark:bg-slate-800/50 border-line text-ink font-semibold"
                    : "bg-surface border-line text-mute"
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center font-bold text-[10px] ${idx === 0
                      ? "bg-amber-500 text-slate-950"
                      : idx === 1
                        ? "bg-slate-400 text-white"
                        : "bg-amber-700 text-white"
                      }`}
                  >
                    {idx + 1}
                  </span>
                  {/* Master Horse Avatar */}
                  <img
                    src={h.avatar}
                    alt={h.name}
                    className="w-5 h-5 rounded-md object-cover border border-line shadow-xs"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150&auto=format&fit=crop&q=80'
                    }}
                  />
                  <span className="truncate">#{h.number} {h.name}</span>
                </div>
                <div className="font-mono text-[11px] shrink-0 font-bold">
                  {Math.round(h.distance)}M ({h.speed || 58} km/h)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1000M Stadium Track Field - 100% Fit to Screen (No screen overflow) */}
      <div className="racecourse-track relative w-full rounded-2xl p-3 sm:p-4 overflow-hidden shadow-inner select-none">
        <div className="racecourse-stand absolute inset-x-0 top-0 h-16 pointer-events-none" />
        <div className="racecourse-rail racecourse-rail-top absolute left-3 right-3 sm:left-4 sm:right-4 top-[72px] pointer-events-none" />
        <div className="racecourse-rail racecourse-rail-bottom absolute left-3 right-3 sm:left-4 sm:right-4 bottom-3 pointer-events-none" />

        {/* Distance Markers Header: Cleanly fits inside visible screen (0M, 250M, 500M, 750M, 1000M Finish) */}
        <div className="relative h-9 mb-2.5 flex items-center justify-between text-[11px] font-mono font-bold text-emerald-200/90 border-b border-white/15 px-2 z-20">
          <div className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded border border-white/15">
            <Flag size={12} className="text-emerald-400" />
            <span>0M Gate (0s)</span>
          </div>
          <div className="hidden sm:block text-emerald-300/70">250M (5s)</div>
          <div className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded border border-emerald-400/30 text-emerald-300">
            <Flag size={12} className="text-emerald-400" />
            <span>500M Halfway (10s)</span>
          </div>
          <div className="hidden sm:block text-red-300/70">750M (15s)</div>
          <div className="flex items-center gap-1.5 bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded font-black shadow-glow-gold text-xs">
            <Flag size={13} />
            <span>1000M FINISH (20s)</span>
          </div>
        </div>

        {/* 12 Individual Lanes strictly contained within the screen (Height enhanced) */}
        <div className="flex flex-col gap-2 sm:gap-2.5 relative z-20">
          {enrichedHorses.map((horse) => {
            // Horses immediately return to starting gates (0M) when race finishes, not waiting for next race
            const isRaceActive = stage === 'RUNNING' || stage === 'FINISHING'
            const distanceClamped = isRaceActive ? Math.min(1000, Math.max(0, horse.distance)) : 0
            const lanePercent = (distanceClamped / 1000) * 100

            const isWinner = stage === 'RESULT' && (winner ? (String(winner.id) === String(horse.id) || String(winner.number) === String(horse.number)) : isForcedMatch(horse))
            const isLeader = isRaceActive && ((forcedTargetStr && isForcedMatch(horse)) || leader?.serialNumber === horse.number) && distanceClamped > 30

            return (
              <div
                key={horse.id}
                className={`racecourse-lane relative h-15 sm:h-16 md:h-17 rounded-xl flex items-center px-2.5 sm:px-3.5 transition-colors border shadow-xs ${isWinner
                  ? 'bg-amber-500/25 border-amber-400 shadow-glow-gold'
                  : isLeader
                    ? 'bg-blue-600/20 border-blue-400/50'
                    : 'border-emerald-950/50 hover:bg-black/25'
                  }`}
              >
                {/* 1. Left Fixed Gate Stall & Master Horse Avatar + Label (Responsive) */}
                <div className="w-16 sm:w-32 md:w-36 shrink-0 flex items-center gap-2 sm:gap-2.5 z-20">
                  <div
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-md border border-white/30 shrink-0 font-display"
                    style={{ backgroundColor: horse.color || '#3B82F6' }}
                  >
                    {horse.number}
                  </div>
                  {/* Master Horse Image in Stall */}
                  <img
                    src={horse.avatar}
                    alt={horse.name}
                    className="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-lg object-cover object-center border border-white/20 shrink-0 shadow-sm"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150&auto=format&fit=crop&q=80'
                    }}
                  />
                  <span className="hidden sm:inline text-xs font-bold text-white truncate max-w-[65px] sm:max-w-[80px]" title={horse.name}>
                    {horse.name.split(' ')[0]}
                  </span>
                </div>

                {/* 2. Middle Running Track: Fits 100% inside container, horses sprint from 0% to 100% */}
                <div className="relative flex-1 h-full mx-1 sm:mx-3 overflow-visible flex items-center">
                  {/* Track Distance Guide Lines */}
                  <div className="absolute inset-x-0 h-px bg-white/10" />
                  <div className="absolute left-[25%] inset-y-0 w-px border-l border-dashed border-white/10" />
                  <div className="absolute left-[50%] inset-y-0 w-px border-l border-dashed border-white/20" />
                  <div className="absolute left-[75%] inset-y-0 w-px border-l border-dashed border-white/10" />

                  {/* Left 0M Starting Gate Bar */}
                  <div className="absolute left-0 inset-y-0 w-1.5 bg-white/40 border-r border-white/20 z-10 rounded-l-sm" />

                  {/* Right 1000M Checkered Finish Line Beam */}
                  <div
                    className="absolute right-0 inset-y-0 w-3.5 bg-[repeating-conic-gradient(#000_0%_25%,#fff_0%_50%)] bg-[length:6px_6px] border-l-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)] z-20 rounded-r-sm opacity-95"
                    title="1000M Finish Line"
                  />

                  {/* Horse Galloping Marker with Live Master Image Avatar (Fully Responsive & Perfectly Bounded) */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 transition-all duration-100 ease-linear flex items-center gap-1.5 sm:gap-2 z-30"
                    style={{
                      left: `calc(20px + ${(lanePercent / 100)} * (100% - 40px))`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {/* Big Visible Runner Badge with Real Photo */}
                    <div
                      className={`relative flex items-center justify-center rounded-xl shadow-2xl border-2 transition-transform ${stage === 'RUNNING' || horse.sprint ? 'animate-gallop' : ''
                        } ${horse.sprint ? 'scale-115' : 'scale-100 sm:scale-105'} ${isWinner
                          ? 'animate-bounce border-amber-300 ring-4 ring-amber-400/60 bg-amber-500'
                          : 'border-white/90 bg-slate-900'
                        }`}
                      style={{
                        borderColor: horse.color || '#3B82F6',
                        boxShadow: isLeader ? `0 0 16px ${horse.color || '#3B82F6'}` : undefined
                      }}
                    >
                      {/* Real Master Horse Photo Running on Track (Enhanced Height & Size) */}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center">
                        <img
                          src={horse.avatar}
                          alt={horse.name}
                          className="w-full h-full object-cover object-center"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150&auto=format&fit=crop&q=80'
                          }}
                        />
                      </div>

                      {/* Mini Gate Number Tag on Runner */}
                      <div
                        className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md border border-white/40"
                        style={{ backgroundColor: horse.color || '#3B82F6' }}
                      >
                        {horse.number}
                      </div>

                      {/* Sprint Fire Icon */}
                      {horse.sprint && (
                        <span className="absolute -left-3 text-xs drop-shadow flex items-center justify-center">
                          <Flame size={14} className="text-amber-400 animate-pulse" />
                        </span>
                      )}
                    </div>

                    {/* Rank Badge on Horse (P1, P2, P3...) */}
                    {(stage === 'RUNNING' || stage === 'FINISHING' || stage === 'RESULT') && (
                      <span
                        className={`text-[9px] sm:text-[11px] font-black px-1.5 sm:px-2 py-0.5 rounded-md font-mono shadow-md ${horse.rank === 1
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : horse.rank === 2
                            ? 'bg-slate-200 text-slate-900 font-bold'
                            : horse.rank === 3
                              ? 'bg-amber-700 text-white font-bold'
                              : 'bg-black/80 text-slate-300 border border-white/20'
                          }`}
                      >
                        P{horse.rank}
                      </span>
                    )}

                    {/* Speedometer bubble on top runners */}
                    {stage === 'RUNNING' && horse.rank <= 2 && (
                      <span className="hidden md:inline text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-black/85 text-emerald-300 border border-emerald-500/30 shadow-sm">
                        {horse.speed || 58}km/h
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Right Finish Line & Stats (Responsive) */}
                <div className="w-16 sm:w-28 md:w-32 shrink-0 flex items-center justify-end gap-1.5 sm:gap-2 z-20">
                  <span className="text-emerald-300 font-bold text-[10px] sm:text-xs font-mono bg-black/40 px-2 py-1 rounded-md border border-white/10">
                    {Math.round(distanceClamped)}M
                  </span>
                  <span className="hidden sm:inline text-amber-400 font-bold text-xs font-mono bg-black/40 px-2 py-1 rounded-md border border-white/10">
                    {horse.odds}x
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Real-time Gate Countdown Overlay (3..2..1..GO!) */}
        {stage === 'COUNTDOWN' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center z-40 animate-fade-in pointer-events-none select-none">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-amber-500 via-red-500 to-rose-600 border-2 border-amber-300 shadow-glow-gold flex items-center justify-center animate-ping-once transform scale-110">
              <span className="font-display text-5xl sm:text-6xl font-black text-white drop-shadow-lg">
                {countdown !== null && countdown !== undefined
                  ? (countdown === 0 ? "GO!" : countdown)
                  : (stageRemaining >= 3 ? "3" : stageRemaining === 2 ? "2" : stageRemaining === 1 ? "1" : "GO!")
                }
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 px-4 py-1.5 rounded-xl bg-black/70 border border-amber-400/40 text-amber-300 font-display font-bold text-xs sm:text-sm tracking-wider uppercase">
              <Zap size={16} className="text-amber-400 animate-bounce" />
              <span>GATES RELEASING &bull; 1000M SPRINT READY!</span>
            </div>
          </div>
        )}

        {/* 5-Second Bets Locked Prep Notice */}
        {stage === 'BETTING_CLOSED' && (
          <div className="absolute top-12 inset-x-4 bg-amber-500/90 text-slate-950 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center justify-between z-30 shadow-lg border border-amber-300/60 animate-slide-in pointer-events-none">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider">
              <Lock size={14} />
              <span>BETTING WINDOW CLOSED</span>
              <span className="hidden sm:inline font-semibold text-slate-900">&bull; All 12 Stalls Loading</span>
            </div>
            <div className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-slate-950 text-amber-400 border border-amber-400/40">
              {stageRemaining}s to Start
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
