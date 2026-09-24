import React, { useState, useEffect, useMemo } from 'react'
import {
  Crown, Play, Square, FastForward, Trophy, Zap, Shield, RefreshCw,
  Users, DollarSign, Activity, Radio, Clock, Eye, AlertCircle,
  TrendingUp, CheckCircle2, ChevronRight, Flame, Volume2, VolumeX,
  Sliders, Plus, XCircle, Wifi, WifiOff, Loader2
} from 'lucide-react'
import { useHorseRaceSocket } from '../hooks/useHorseRaceSocket.js'
import { useGameEngine } from '../hooks/useGameEngine.js'
import { resolveImageUrl } from '../utils/imageUrl.js'
import { sound } from '../utils/audio.js'

// Master Vibrant Color Palette for Dynamic Horses (1 to 12)
const COLOR_THEMES = [
  { color: '#EF4444', border: 'border-red-500/40', text: 'text-red-500', barBg: 'bg-red-500', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]' },
  { color: '#3B82F6', border: 'border-blue-500/40', text: 'text-blue-500', barBg: 'bg-blue-500', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]' },
  { color: '#10B981', border: 'border-emerald-500/40', text: 'text-emerald-500', barBg: 'bg-emerald-500', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]' },
  { color: '#EAB308', border: 'border-yellow-500/40', text: 'text-yellow-500', barBg: 'bg-yellow-500', glow: 'shadow-[0_0_15px_rgba(234,179,8,0.5)]' },
  { color: '#A855F7', border: 'border-purple-500/40', text: 'text-purple-500', barBg: 'bg-purple-500', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]' },
  { color: '#EC4899', border: 'border-pink-500/40', text: 'text-pink-500', barBg: 'bg-pink-500', glow: 'shadow-[0_0_15px_rgba(236,72,153,0.5)]' },
  { color: '#06B6D4', border: 'border-cyan-500/40', text: 'text-cyan-500', barBg: 'bg-cyan-500', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.5)]' },
  { color: '#F97316', border: 'border-orange-500/40', text: 'text-orange-500', barBg: 'bg-orange-500', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)]' },
  { color: '#14B8A6', border: 'border-teal-500/40', text: 'text-teal-500', barBg: 'bg-teal-500', glow: 'shadow-[0_0_15px_rgba(20,184,166,0.5)]' },
  { color: '#6366F1', border: 'border-indigo-500/40', text: 'text-indigo-500', barBg: 'bg-indigo-500', glow: 'shadow-[0_0_15px_rgba(99,102,241,0.5)]' },
  { color: '#84CC16', border: 'border-lime-500/40', text: 'text-lime-500', barBg: 'bg-lime-500', glow: 'shadow-[0_0_15px_rgba(132,204,22,0.5)]' },
  { color: '#E11D48', border: 'border-rose-500/40', text: 'text-rose-500', barBg: 'bg-rose-500', glow: 'shadow-[0_0_15px_rgba(225,29,72,0.5)]' },
]

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&auto=format&fit=crop&q=80'

export default function LiveArena() {
  const { scheduleWinner, setJackpot } = useGameEngine()
  const {
    socketStatus,
    raceState,
    countdown,
    liveTrack,
    liveJackpot,
    liveBetPool,
    liveLedgerBet,
    liveSnapshot,
    requestLiveSnapshot,
    emit
  } = useHorseRaceSocket()

  // 100% Live Server State (Zero Mock/Static Data)
  const [raceNumber, setRaceNumber] = useState(null)
  const [racePhase, setRacePhase] = useState('CONNECTING')
  const [timerSeconds, setTimerSeconds] = useState(null)
  const [trackName, setTrackName] = useState('Royal Turf')
  const [trackDistance, setTrackDistance] = useState('1200m')
  const [weatherCondition, setWeatherCondition] = useState('☀️ Sunny')
  
  // Dynamic Horses Array strictly populated from Live Socket Snapshot
  const [horses, setHorses] = useState([])
  
  // Real per-horse pool values from Socket
  const [horsePools, setHorsePools] = useState({})

  // Selected guaranteed winner & jackpot multiplier
  const [scheduledWinnerId, setScheduledWinnerId] = useState(null)
  const [jackpotMultiplier, setJackpotMultiplier] = useState('1X')

  // Live real bet lists
  const [totalUsersCount, setTotalUsersCount] = useState(0)
  const [runningBets, setRunningBets] = useState([])
  const [recentBets, setRecentBets] = useState([])

  // Live track positions from Socket (0 to 100%)
  const [horsePositions, setHorsePositions] = useState({})
  const [raceProgress, setRaceProgress] = useState(0)

  // UI preferences
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showControlDrawer, setShowControlDrawer] = useState(true)
  const [actionNotice, setActionNotice] = useState(null)
  const [hasReceivedSnapshot, setHasReceivedSnapshot] = useState(false)

  // 1. Request Live Race Snapshot on Mount and on Socket Connect
  useEffect(() => {
    requestLiveSnapshot()
  }, [requestLiveSnapshot, socketStatus?.connected])

  // 2. Process Live Snapshot (`admin:live_race_snapshot`)
  useEffect(() => {
    if (!liveSnapshot) return
    console.log('⚡ [LiveArena Socket] Received snapshot:', liveSnapshot)
    setHasReceivedSnapshot(true)

    // Race Number / Serial
    const rNum = liveSnapshot.raceNumber || liveSnapshot.gameSerial || liveSnapshot.raceId || liveSnapshot.id || liveSnapshot.roundNumber
    if (rNum) setRaceNumber(rNum)

    // Status / Stage
    const rawStage = liveSnapshot.stage || liveSnapshot.status || liveSnapshot.state
    if (rawStage) {
      const s = String(rawStage).toUpperCase()
      if (s.includes('BET')) setRacePhase('BETTING_OPEN')
      else if (s.includes('COUNT')) setRacePhase('COUNTDOWN')
      else if (s.includes('RUN')) setRacePhase('RUNNING')
      else if (s.includes('FINISH') || s.includes('RESULT')) setRacePhase('FINISHED')
      else setRacePhase(s)
    }

    // Timer
    if (liveSnapshot.timer !== undefined || liveSnapshot.countdown !== undefined) {
      setTimerSeconds(Number(liveSnapshot.timer || liveSnapshot.countdown || 0))
    }

    // Track Specs
    if (liveSnapshot.track || liveSnapshot.trackName) setTrackName(liveSnapshot.track || liveSnapshot.trackName)
    if (liveSnapshot.distance) setTrackDistance(String(liveSnapshot.distance).includes('m') ? liveSnapshot.distance : `${liveSnapshot.distance}m`)
    if (liveSnapshot.weather) setWeatherCondition(liveSnapshot.weather)

    // Dynamic Horses List from Backend
    const rawHorses = liveSnapshot.horses || liveSnapshot.runners || liveSnapshot.horseList
    if (Array.isArray(rawHorses) && rawHorses.length > 0) {
      const mapped = rawHorses.map((h, idx) => {
        const theme = COLOR_THEMES[idx % COLOR_THEMES.length]
        const rawImg = h.imageUrl || h.horseImageUrl || h.image || h.avatar
        const horseNum = Number(h.number || h.horseNumber || (idx + 1))
        const horseId = h.id || h.horseId || horseNum

        return {
          id: horseId,
          number: horseNum,
          name: h.name || h.horseName || `Horse #${horseNum}`,
          odds: Number(h.odds || h.multiplier || 2.5),
          avatar: rawImg ? resolveImageUrl(rawImg) : DEFAULT_AVATAR,
          jockey: h.jockey || h.jockeyName || `Jockey #${horseNum}`,
          color: h.color || theme.color,
          border: theme.border,
          text: theme.text,
          barBg: theme.barBg,
          glow: theme.glow,
        }
      })
      setHorses(mapped)

      // Initialize default horse positions to 0% if empty
      setHorsePositions(prev => {
        const next = { ...prev }
        mapped.forEach(h => {
          if (next[h.id] === undefined && next[h.number] === undefined) {
            next[h.id] = 0
            next[h.number] = 0
          }
        })
        return next
      })
    }

    // Live Pools
    const poolsData = liveSnapshot.betPool || liveSnapshot.horsePools || liveSnapshot.pools || liveSnapshot.poolTotals
    if (poolsData && typeof poolsData === 'object') {
      setHorsePools(poolsData)
    }

    // Live Bets Table
    const liveBetsArr = liveSnapshot.liveBets || liveSnapshot.bets || liveSnapshot.currentBets
    if (Array.isArray(liveBetsArr)) {
      setRunningBets(liveBetsArr.map((b, idx) => ({
        id: b.id || b._id || `snap-b-${idx}`,
        time: b.time || b.timestamp || (b.createdAt ? new Date(b.createdAt).toTimeString().split(' ')[0] : '--:--'),
        user: b.user || b.username || b.playerName || `User_${idx + 1}`,
        avatar: b.avatar || '👤',
        horseNum: Number(b.horseNumber || b.horseId || 1),
        horseName: b.horseName || `Horse #${b.horseNumber || 1}`,
        amount: Number(b.amount || b.betAmount || 0),
        potentialWin: Number(b.potentialWin || b.potential_win || (b.amount * (b.odds || 2.5)))
      })))
    }

    // Recent Bets Feed
    const recentBetsArr = liveSnapshot.recentBets || liveSnapshot.recent_bets
    if (Array.isArray(recentBetsArr)) {
      setRecentBets(recentBetsArr.map((rb, idx) => ({
        id: rb.id || rb._id || `snap-rb-${idx}`,
        user: rb.user || rb.username || rb.playerName || `User_${idx + 1}`,
        avatar: rb.avatar || '⚡',
        horseNum: Number(rb.horseNumber || rb.horseId || 1),
        amount: Number(rb.amount || rb.betAmount || 0),
        time: rb.time || rb.timestamp || '--:--'
      })))
    }

    // Active Users Count
    if (liveSnapshot.totalUsers !== undefined || liveSnapshot.activeUsers !== undefined) {
      setTotalUsersCount(Number(liveSnapshot.totalUsers || liveSnapshot.activeUsers || 0))
    }

    // Jackpot
    if (liveSnapshot.jackpot) {
      const jVal = String(liveSnapshot.jackpot.multiplier || (liveSnapshot.jackpot.active ? '2X' : '1X'))
      setJackpotMultiplier(jVal.toUpperCase().includes('X') ? jVal.toUpperCase() : `${jVal}X`)
    }
  }, [liveSnapshot])

  // 3. Handle Live Bet Influx Stream (`admin:bet_live`)
  useEffect(() => {
    if (!liveLedgerBet) return
    const b = liveLedgerBet
    const hNum = Number(b.horseNumber || b.horseId || b.horseNum || 1)
    const hObj = horses.find(h => h.number === hNum || h.id === hNum)
    const amount = Number(b.amount || b.betAmount || 0)
    const time = b.time || b.timestamp || new Date().toTimeString().split(' ')[0]
    const user = b.user || b.username || b.playerName || 'LivePlayer'
    const potential = Number(b.potentialWin || b.potential_win || Math.round(amount * (hObj?.odds || 2.5)))

    // Update real pool
    setHorsePools(prev => ({
      ...prev,
      [hNum]: (Number(prev[hNum]) || 0) + amount,
      ...(hObj?.id ? { [hObj.id]: (Number(prev[hObj.id]) || 0) + amount } : {})
    }))

    // Prepend to Live Bets Table
    setRunningBets(prev => [{
      id: b.id || b._id || Date.now(),
      time,
      user,
      avatar: b.avatar || '👤',
      horseNum: hNum,
      horseName: hObj?.name || b.horseName || `Horse #${hNum}`,
      amount,
      potentialWin: potential
    }, ...prev.slice(0, 24)])

    // Prepend to Recent Bets Feed
    setRecentBets(prev => [{
      id: 'rec-' + (b.id || Date.now()),
      user,
      horseNum: hNum,
      amount,
      time,
      avatar: b.avatar || '⚡'
    }, ...prev.slice(0, 15)])

    if (soundEnabled) sound.playCash()
  }, [liveLedgerBet, horses, soundEnabled])

  // 4. Handle Real Bet Pool Updates (`admin:bet_pool_update`)
  useEffect(() => {
    if (!liveBetPool) return
    if (typeof liveBetPool === 'object') {
      const poolsObj = liveBetPool.pools || liveBetPool.horsePools || liveBetPool
      setHorsePools(prev => ({ ...prev, ...poolsObj }))
      if (liveBetPool.totalUsers !== undefined) setTotalUsersCount(Number(liveBetPool.totalUsers))
    }
  }, [liveBetPool])

  // 5. Handle Live Horse Positions & Progress (`race:track_update`)
  useEffect(() => {
    if (!liveTrack) return
    if (liveTrack.progress !== undefined) setRaceProgress(Number(liveTrack.progress))
    
    if (liveTrack.positions && typeof liveTrack.positions === 'object') {
      setHorsePositions(prev => ({ ...prev, ...liveTrack.positions }))
    } else if (Array.isArray(liveTrack.horses)) {
      const posMap = {}
      liveTrack.horses.forEach(h => {
        const id = h.id || h.horseId || h.number
        posMap[id] = Number(h.position || h.progress || 0)
        if (h.number) posMap[h.number] = Number(h.position || h.progress || 0)
      })
      setHorsePositions(posMap)
    }
  }, [liveTrack])

  // 6. Handle Race Stage / State Changes (`race:state_changed`)
  useEffect(() => {
    if (!raceState) return
    const raw = typeof raceState === 'string' ? raceState : (raceState.state || raceState.status || '')
    const s = String(raw).toUpperCase()
    if (s.includes('BET')) setRacePhase('BETTING_OPEN')
    else if (s.includes('COUNT')) setRacePhase('COUNTDOWN')
    else if (s.includes('RUN')) {
      setRacePhase('RUNNING')
      if (soundEnabled) sound.playRaceStart()
    }
    else if (s.includes('FINISH') || s.includes('RESULT')) {
      setRacePhase('FINISHED')
      if (soundEnabled) sound.playWinner()
    } else {
      setRacePhase(s)
    }

    if (raceState.timer !== undefined) setTimerSeconds(Number(raceState.timer))
    if (raceState.countdown !== undefined) setTimerSeconds(Number(raceState.countdown))
    if (raceState.raceNumber || raceState.gameSerial) setRaceNumber(raceState.raceNumber || raceState.gameSerial)
  }, [raceState, soundEnabled])

  // 7. Handle Countdown Ticks (`race:countdown_tick`)
  useEffect(() => {
    if (countdown !== null && countdown !== undefined) {
      setTimerSeconds(countdown)
    }
  }, [countdown])

  // 8. Handle Jackpot Updates (`admin:jackpot_updated`)
  useEffect(() => {
    if (!liveJackpot) return
    const mult = String(liveJackpot.multiplier || (liveJackpot.active ? '2X' : '1X'))
    setJackpotMultiplier(mult.toUpperCase().includes('X') ? mult.toUpperCase() : `${mult}X`)
  }, [liveJackpot])

  // Audio Mute toggle
  useEffect(() => {
    sound.setMuted(!soundEnabled)
  }, [soundEnabled])

  // Calculate Real Total Bet Amount and Percentages
  const totalBetAmount = useMemo(() => {
    return Object.values(horsePools).reduce((acc, val) => acc + (Number(val) || 0), 0)
  }, [horsePools])

  const horsePercentages = useMemo(() => {
    const total = totalBetAmount || 0
    const p = {}
    horses.forEach((h) => {
      const val = Number(horsePools[h.id]) || Number(horsePools[h.number]) || 0
      p[h.id] = total > 0 ? Math.round((val / total) * 100) : 0
    })
    return p
  }, [horses, horsePools, totalBetAmount])

  // Set Guaranteed Winner Action (Emits `admin:schedule_winner`)
  const handleSelectWinner = async (horseId) => {
    setScheduledWinnerId(horseId)
    const target = horses.find(h => h.id === horseId || h.number === horseId) || horses[0]
    sound.playClick()
    try {
      emit('admin:schedule_winner', {
        horseNumber: target?.number || horseId,
        horseName: target?.name,
        horseId: target?.id || horseId,
        raceId: raceNumber
      })
      await scheduleWinner(target?.name || `Horse #${horseId}`)
      setActionNotice(`👑 Guaranteed Winner: #${target?.number || horseId} ${target?.name || ''}`)
    } catch (e) {
      setActionNotice(`👑 Winner set to #${target?.number || horseId}`)
    }
    setTimeout(() => setActionNotice(null), 3500)
  }

  // Set Jackpot Multiplier Action (Emits `admin:set_jackpot` or `admin:clear_jackpot`)
  const handleSetJackpot = async (mult) => {
    setJackpotMultiplier(mult)
    sound.playClick()
    try {
      if (mult === '1X' || mult === 'OFF') {
        emit('admin:clear_jackpot', {})
        await setJackpot('1X')
        setActionNotice(`Jackpot turned OFF (Standard 1X)`)
      } else {
        const val = mult === 'RANDOM' ? 'RANDOM' : (parseInt(mult, 10) || 2)
        emit('admin:set_jackpot', { multiplier: val })
        await setJackpot(mult)
        setActionNotice(`🔥 Jackpot Multiplier set to ${mult}`)
      }
    } catch (e) {
      setActionNotice(`🔥 Jackpot updated to ${mult}`)
    }
    setTimeout(() => setActionNotice(null), 3500)
  }

  // End Race Action
  const handleEndRace = () => {
    sound.playWinner()
    emit('admin:end_race', { raceNumber, winnerId: scheduledWinnerId })
    const winnerHorse = horses.find(h => h.id === scheduledWinnerId || h.number === scheduledWinnerId)
    setActionNotice(`🏁 Race Ended! Emitted admin:end_race to server`)
    setTimeout(() => setActionNotice(null), 4000)
  }

  // Manual Snapshot Refresh
  const handleRefreshSnapshot = () => {
    sound.playClick()
    requestLiveSnapshot()
    setActionNotice('⚡ Requested fresh snapshot from backend (admin:live_race_snapshot:get)')
    setTimeout(() => setActionNotice(null), 2500)
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans p-3 md:p-6 space-y-4 select-none">
      
      {/* Toast Alert */}
      {actionNotice && (
        <div className="fixed top-5 right-5 z-50 bg-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce border border-amber-300">
          <Flame size={18} className="text-red-700 animate-pulse" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. TOP HEADER BAR (Exact match with reference UI)            */}
      {/* ============================================================ */}
      <header className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-3 md:p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <Crown size={26} className="fill-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base md:text-xl font-black tracking-wider text-white flex items-center gap-2">
                DERBY CASINO ARENA
              </h1>
              <p className="text-[11px] md:text-xs font-bold text-amber-400 tracking-widest uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Horse Racing Live Socket Stream
              </p>
            </div>
          </div>

          {/* Race Number & LIVE Badge */}
          <div className="flex items-center gap-2 bg-[#1e293b]/90 border border-slate-700 px-3.5 py-1.5 rounded-xl">
            <span className="text-xs md:text-sm font-bold text-slate-300">
              Race # <span className="text-white font-mono font-black">{raceNumber !== null ? raceNumber : '---'}</span>
            </span>
            <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider shadow-[0_0_10px_rgba(220,38,38,0.7)] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              LIVE
            </span>
          </div>

          {/* Timer: Time Left To Bet */}
          <div className="flex items-center gap-3 bg-[#1e1528] border border-red-500/40 px-4 py-1.5 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <div className="text-lg md:text-2xl font-mono font-black text-red-500 tracking-wider">
              {timerSeconds !== null ? `00:${timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}` : '--:--'}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400 leading-tight">
              Time Left<br /><span className="text-red-400">To Bet</span>
            </div>
          </div>

          {/* Track Specs Badges */}
          <div className="hidden xl:flex items-center gap-4 bg-[#1e293b]/60 border border-slate-700/60 px-4 py-2 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Track</span>
              <span className="font-bold text-white">{trackName}</span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Distance</span>
              <span className="font-bold text-white">{trackDistance}</span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Weather</span>
              <span className="font-bold text-amber-300">{weatherCondition}</span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Status</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {racePhase.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2">
            
            {/* Snapshot Refresh Button */}
            <button
              type="button"
              onClick={handleRefreshSnapshot}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
              title="Request Fresh Live Snapshot (admin:live_race_snapshot:get)"
            >
              <RefreshCw size={17} className="hover:rotate-180 transition-transform duration-500" />
            </button>

            {/* Socket Status indicator */}
            <div
              className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold ${
                socketStatus?.connected
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              }`}
              title={`Socket Server: ${socketStatus?.url || 'https://horseracing.siberiancrane.tech'}`}
            >
              {socketStatus?.connected ? (
                <>
                  <Wifi size={14} />
                  <span className="hidden sm:inline">Live Socket</span>
                </>
              ) : (
                <>
                  <WifiOff size={14} />
                  <span className="hidden sm:inline">Connecting...</span>
                </>
              )}
            </div>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
              title={soundEnabled ? 'Mute SFX' : 'Unmute SFX'}
            >
              {soundEnabled ? <Volume2 size={17} className="text-amber-400" /> : <VolumeX size={17} />}
            </button>

            {/* Admin Hub Toggle */}
            <button
              type="button"
              onClick={() => setShowControlDrawer(!showControlDrawer)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
            >
              <Sliders size={15} className="text-cyan-400" />
              <span className="hidden sm:inline">Admin Hub</span>
            </button>

            {/* End Race Button */}
            <button
              type="button"
              onClick={handleEndRace}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-95 text-white text-xs md:text-sm font-black transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)] border border-red-400/30"
            >
              End Race
            </button>

          </div>

        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. ALL-IN-ONE ADMIN CONTROL HUB                              */}
      {/* ============================================================ */}
      {showControlDrawer && (
        <div className="bg-gradient-to-r from-[#111827] via-[#0f172a] to-[#1e1b4b] border border-amber-500/40 rounded-2xl p-4 shadow-2xl relative overflow-hidden space-y-3">
          
          {/* Row 1: Guaranteed Winner Picker */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Crown size={14} /> Guaranteed Winner:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {horses.length > 0 ? (
                  horses.map((h) => {
                    const isPicked = scheduledWinnerId === h.id || scheduledWinnerId === h.number
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => handleSelectWinner(h.id)}
                        style={{ backgroundColor: isPicked ? h.color : 'rgba(30,41,59,0.8)' }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all border ${
                          isPicked
                            ? 'text-white shadow-[0_0_12px_rgba(255,255,255,0.4)] border-white scale-105'
                            : 'text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        #{h.number} <span className="hidden md:inline">{h.name.split(' ')[0]}</span>
                      </button>
                    )
                  })
                ) : (
                  <span className="text-xs text-slate-500 italic">Waiting for horses list from socket...</span>
                )}
              </div>
            </div>

            {/* Jackpot Multiplier Controller (Socket admin:set_jackpot) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Flame size={14} className="text-amber-400" /> Jackpot:
              </span>
              <div className="flex items-center gap-1">
                {['1X', '2X', '3X', '4X', 'RANDOM'].map((mult) => {
                  const active = jackpotMultiplier === mult || (mult === '1X' && (jackpotMultiplier === 'OFF' || jackpotMultiplier === '1X'))
                  return (
                    <button
                      key={mult}
                      type="button"
                      onClick={() => handleSetJackpot(mult)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                        active
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-glow-gold scale-105'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                    >
                      {mult}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Row 2: Live Socket Flow Triggers */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => emit('admin:start_betting', { raceNumber })}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold transition-all border border-emerald-500"
              >
                Open Betting Window
              </button>

              <button
                type="button"
                onClick={() => emit('admin:start_race', { raceNumber })}
                className="px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white font-bold transition-all border border-blue-500"
              >
                Start Race
              </button>
            </div>

            <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
              <span>Socket Server: <span className="text-emerald-400">https://horseracing.siberiancrane.tech</span></span>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* 3. CINEMATIC HORSE RUNNING TRACK ARENA                       */}
      {/* ============================================================ */}
      <div className="relative w-full min-h-[300px] md:min-h-[420px] rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-[#1c381c]">
        
        {/* Realistic Stadium Grass & Crowd Backdrop */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-65 filter saturate-125"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-transparent to-slate-900/60" />

        {/* Stadium Branding Tag */}
        <div className="absolute top-3 right-5 z-20 bg-black/60 backdrop-blur-sm border border-amber-500/30 px-3 py-1 rounded-lg text-right hidden sm:block">
          <div className="text-[11px] font-black text-amber-400 tracking-wider flex items-center gap-1.5 justify-end">
            <Crown size={12} /> DERBY CASINO
          </div>
          <div className="text-[9px] font-bold text-slate-300">LIVE SOCKET ARENA</div>
        </div>

        {/* Race Lanes */}
        <div className="absolute inset-0 flex flex-col justify-evenly py-2 px-4 md:px-6 z-10 overflow-y-auto">
          {horses.length > 0 ? (
            horses.map((horse) => {
              const position = horsePositions[horse.id] !== undefined ? horsePositions[horse.id] : (horsePositions[horse.number] || 0)
              const isWinnerHorse = scheduledWinnerId === horse.id || scheduledWinnerId === horse.number

              return (
                <div key={horse.id} className="relative w-full h-7 md:h-8 border-b border-white/10 flex items-center">
                  
                  {/* Lane Railing Marker */}
                  <div className="absolute left-0 text-[9px] md:text-[10px] font-black text-white/50 font-mono">
                    L{horse.number}
                  </div>

                  {/* Animated Horse Runner on the Track */}
                  <div
                    className="absolute transition-all duration-200 ease-out flex items-center gap-1.5 group cursor-pointer"
                    style={{ left: `${Math.min(Math.max(position, 1), 92)}%` }}
                    onClick={() => handleSelectWinner(horse.id)}
                  >
                    {/* Floating Runner Tag */}
                    <div
                      style={{ backgroundColor: horse.color }}
                      className="flex items-center gap-1 text-white text-[9px] md:text-[11px] font-black px-1.5 py-0.5 rounded shadow-lg border border-white/40 whitespace-nowrap"
                    >
                      <span>{horse.number}</span>
                      <span className="hidden md:inline font-semibold">{horse.name}</span>
                    </div>

                    {/* Horse Silhouette / Jockey */}
                    <div className="relative text-xl md:text-2xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] transform -scale-x-100">
                      🏇
                      {isWinnerHorse && (
                        <Crown size={12} className="absolute -top-2.5 left-0.5 text-amber-400 fill-amber-400 animate-bounce" />
                      )}
                    </div>
                  </div>

                </div>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2">
              <Loader2 className="animate-spin text-amber-400" size={32} />
              <span className="text-xs font-semibold">Connecting to live race stream & horses...</span>
            </div>
          )}
        </div>

      </div>

      {/* ============================================================ */}
      {/* 4. HORSE ODDS CARDS GRID (Live from Snapshot)                */}
      {/* ============================================================ */}
      {horses.length > 0 ? (
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${horses.length > 6 ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-3`}>
          {horses.map((horse) => {
            const sharePercent = horsePercentages[horse.id] || 0
            const isWinner = scheduledWinnerId === horse.id || scheduledWinnerId === horse.number

            return (
              <div
                key={horse.id}
                onClick={() => handleSelectWinner(horse.id)}
                className={`relative bg-[#0f172a] border rounded-2xl p-2.5 flex flex-col justify-between transition-all duration-200 cursor-pointer group hover:scale-[1.02] ${
                  isWinner
                    ? `${horse.border} ${horse.glow} ring-2 ring-amber-400`
                    : 'border-slate-800 hover:border-slate-600'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      style={{ backgroundColor: horse.color }}
                      className="w-5 h-5 rounded-md flex items-center justify-center text-white font-black text-xs shadow-md shrink-0"
                    >
                      {horse.number}
                    </div>
                    <span className="font-extrabold text-xs text-white tracking-wide truncate">
                      {horse.name}
                    </span>
                  </div>
                  {isWinner && (
                    <Crown size={13} className="text-amber-400 fill-amber-400 shrink-0" title="Guaranteed Winner" />
                  )}
                </div>

                {/* Horse Portrait & Odds Box */}
                <div className="flex items-center justify-between gap-2 my-1">
                  <div className="w-11 h-11 md:w-13 md:h-13 rounded-xl overflow-hidden border border-slate-700 bg-slate-800/80 shrink-0">
                    <img
                      src={horse.avatar}
                      alt={horse.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = DEFAULT_AVATAR
                      }}
                    />
                  </div>

                  <div className="text-right">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Odds</div>
                    <div className="text-base md:text-lg font-mono font-black text-white">
                      {Number(horse.odds).toFixed(1)}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 font-mono">
                      {sharePercent}%
                    </div>
                  </div>
                </div>

                {/* Colored Progress Percentage Bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                  <div
                    style={{ width: `${sharePercent}%`, backgroundColor: horse.color }}
                    className="h-full rounded-full transition-all duration-500"
                  />
                </div>

              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
          Loading horses cards from server...
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. THREE-COLUMN STATS: LIVE BETS, POOL BARS, RECENT FEED     */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* COLUMN 1: LIVE BETS (Running Table) - 5 Cols */}
        <div className="lg:col-span-5 bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs md:text-sm font-extrabold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                LIVE BETS <span className="text-slate-400 font-normal">({racePhase.replace('_', ' ')})</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400 font-bold">
                {runningBets.length} Bets Placed
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
              {runningBets.length > 0 ? (
                <table className="w-full text-left text-[11px] md:text-xs">
                  <thead className="sticky top-0 bg-[#0f172a] z-10">
                    <tr className="text-slate-400 border-b border-slate-800 pb-2 font-semibold">
                      <th className="py-1.5 px-1 font-mono">#</th>
                      <th className="py-1.5 px-1">Time</th>
                      <th className="py-1.5 px-1">User</th>
                      <th className="py-1.5 px-1">Horse</th>
                      <th className="py-1.5 px-1 text-right">Amount</th>
                      <th className="py-1.5 px-1 text-right text-amber-400">Potential Win</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {runningBets.map((bet, idx) => {
                      const hInfo = horses.find(h => h.number === bet.horseNum || h.id === bet.horseNum)
                      return (
                        <tr key={bet.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2 px-1 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-1 font-mono text-slate-300">{bet.time}</td>
                          <td className="py-2 px-1 font-medium text-white flex items-center gap-1.5">
                            <span>{bet.avatar}</span>
                            <span className="truncate max-w-[85px]">{bet.user}</span>
                          </td>
                          <td className="py-2 px-1">
                            <span className="flex items-center gap-1">
                              <span
                                style={{ backgroundColor: hInfo?.color || '#3b82f6' }}
                                className="w-4 h-4 rounded text-[9px] font-black text-white flex items-center justify-center"
                              >
                                {bet.horseNum}
                              </span>
                              <span className="text-slate-300 truncate max-w-[80px] font-medium hidden sm:inline">
                                {bet.horseName}
                              </span>
                            </span>
                          </td>
                          <td className="py-2 px-1 text-right font-mono font-bold text-white">
                            ₹{Number(bet.amount).toLocaleString()}
                          </td>
                          <td className="py-2 px-1 text-right font-mono font-bold text-amber-400">
                            ₹{Number(bet.potentialWin).toLocaleString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <Activity size={24} className="mx-auto mb-2 opacity-40 text-slate-400" />
                  <span>No live bets placed for this round yet.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2: TOTAL BETS ON EACH HORSE - 4 Cols */}
        <div className="lg:col-span-4 bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-xs md:text-sm font-extrabold text-white mb-3 tracking-wide flex items-center justify-between">
              <span>TOTAL BETS ON EACH HORSE</span>
              <span className="text-[10px] text-amber-400 font-mono">{horses.length} Runners</span>
            </h2>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {horses.length > 0 ? (
                horses.map((h) => {
                  const amount = Number(horsePools[h.id] || horsePools[h.number] || 0)
                  const percent = horsePercentages[h.id] || 0
                  return (
                    <div key={h.id} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div
                            style={{ backgroundColor: h.color }}
                            className="w-4 h-4 rounded text-[9px] font-black text-white flex items-center justify-center shadow"
                          >
                            {h.number}
                          </div>
                          <span className="font-bold text-slate-200 truncate max-w-[130px]">{h.name}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-white text-[11px]">₹ {amount.toLocaleString()}</span>
                          <span className="text-slate-400 text-[10px] w-7 text-right">{percent}%</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          style={{ width: `${percent}%`, backgroundColor: h.color }}
                          className="h-full rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Loading per-horse pool distributions...
                </div>
              )}
            </div>
          </div>

          {/* Bottom Summary Stats */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Bets</div>
              <div className="text-lg md:text-xl font-mono font-black text-amber-400">
                ₹ {totalBetAmount.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Users</div>
              <div className="text-lg md:text-xl font-mono font-black text-white flex items-center gap-1.5 justify-end">
                <Users size={18} className="text-cyan-400" />
                {totalUsersCount}
              </div>
            </div>
          </div>

        </div>

        {/* COLUMN 3: RECENT BETS (Live Feed) - 3 Cols */}
        <div className="lg:col-span-3 bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs md:text-sm font-extrabold text-white flex items-center gap-1.5">
                <Activity size={16} className="text-cyan-400" />
                RECENT BETS <span className="text-slate-400 text-[10px] font-normal">(Live Feed)</span>
              </h2>
            </div>

            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              {recentBets.length > 0 ? (
                recentBets.map((rb) => {
                  const hInfo = horses.find(h => h.number === rb.horseNum || h.id === rb.horseNum)
                  return (
                    <div
                      key={rb.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-850/60 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{rb.avatar}</span>
                        <div>
                          <div className="font-bold text-white text-[11px] truncate max-w-[90px]">{rb.user}</div>
                          <div className="text-[9px] text-slate-400 font-mono">{rb.time}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          style={{ backgroundColor: hInfo?.color || '#3b82f6' }}
                          className="w-5 h-5 rounded text-[10px] font-black text-white flex items-center justify-center shadow"
                        >
                          {rb.horseNum}
                        </div>
                        <span className="font-mono font-bold text-emerald-400 text-xs">
                          ₹{Number(rb.amount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <Activity size={24} className="mx-auto mb-2 opacity-40 text-slate-400" />
                  <span>Waiting for live bet stream...</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 6. BOTTOM RACE PROGRESS BAR                                  */}
      {/* ============================================================ */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-4">
          
          <div className="flex items-center gap-2 font-black text-xs md:text-sm text-white tracking-wider whitespace-nowrap">
            <span>🏁 RACE PROGRESS</span>
          </div>

          <div className="relative flex-1 w-full flex flex-col justify-center py-2">
            
            {/* The Track Line */}
            <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-visible border border-slate-700">
              
              {/* Green Progress Fill */}
              <div
                style={{ width: `${raceProgress}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-lime-400 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-all duration-300"
              />

              {/* Mini Running Horses */}
              {horses.map((h) => {
                const miniPos = horsePositions[h.id] !== undefined ? horsePositions[h.id] : (horsePositions[h.number] || 0)
                return (
                  <div
                    key={h.id}
                    className="absolute -top-3.5 transition-all duration-200 ease-out transform -translate-x-1/2"
                    style={{ left: `${Math.min(Math.max(miniPos, 1), 98)}%` }}
                    title={`#${h.number} ${h.name}`}
                  >
                    <div
                      style={{ color: h.color }}
                      className="text-xs md:text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] filter"
                    >
                      🏇
                    </div>
                  </div>
                )
              })}

            </div>

            {/* Distance Markers */}
            <div className="flex justify-between text-[10px] font-bold text-slate-500 mt-2 font-mono">
              <span>Start</span>
              <span>400m</span>
              <span>800m</span>
              <span>1000m</span>
              <span className="text-amber-400 font-bold">{trackDistance} Finish</span>
            </div>

          </div>

        </div>
      </div>

    </div>
  )
}
