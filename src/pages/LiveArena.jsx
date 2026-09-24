import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Crown, Play, Square, FastForward, Trophy, Zap, Shield, RefreshCw,
  Users, DollarSign, Activity, Radio, Clock, Eye, AlertCircle,
  TrendingUp, CheckCircle2, ChevronRight, Flame, Volume2, VolumeX,
  Sliders, Plus, XCircle
} from 'lucide-react'
import { useHorseRaceSocket } from '../hooks/useHorseRaceSocket.js'
import { useGameEngine } from '../hooks/useGameEngine.js'
import { sound } from '../utils/audio.js'

// Pre-defined 5 Horses matching the exact visual theme
const ARENA_HORSES = [
  {
    id: 1,
    number: 1,
    name: 'Thunder Bolt',
    jockey: 'R. Moore',
    color: '#ef4444', // Red
    colorName: 'Red',
    bgLight: 'rgba(239, 68, 68, 0.15)',
    border: 'border-red-500/40',
    text: 'text-red-500',
    barBg: 'bg-red-500',
    glow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]',
    defaultOdds: 2.5,
    avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&auto=format&fit=crop&q=80',
    initialPool: 12450,
  },
  {
    id: 2,
    number: 2,
    name: 'Silver Arrow',
    jockey: 'W. Buick',
    color: '#3b82f6', // Blue
    colorName: 'Blue',
    bgLight: 'rgba(59, 130, 246, 0.15)',
    border: 'border-blue-500/40',
    text: 'text-blue-500',
    barBg: 'bg-blue-500',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]',
    defaultOdds: 3.0,
    avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
    initialPool: 9200,
  },
  {
    id: 3,
    number: 3,
    name: 'Royal Star',
    jockey: 'L. Dettori',
    color: '#10b981', // Green
    colorName: 'Green',
    bgLight: 'rgba(16, 185, 129, 0.15)',
    border: 'border-emerald-500/40',
    text: 'text-emerald-500',
    barBg: 'bg-emerald-500',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]',
    defaultOdds: 4.2,
    avatar: 'https://images.unsplash.com/photo-1598974357801-cbca100e65d3?w=400&auto=format&fit=crop&q=80',
    initialPool: 6300,
  },
  {
    id: 4,
    number: 4,
    name: 'Midnight King',
    jockey: 'C. Soumillon',
    color: '#eab308', // Yellow
    colorName: 'Yellow',
    bgLight: 'rgba(234, 179, 8, 0.15)',
    border: 'border-yellow-500/40',
    text: 'text-yellow-500',
    barBg: 'bg-yellow-500',
    glow: 'shadow-[0_0_15px_rgba(234,179,8,0.5)]',
    defaultOdds: 6.5,
    avatar: 'https://images.unsplash.com/photo-1566251037378-5e04e3bec343?w=400&auto=format&fit=crop&q=80',
    initialPool: 3150,
  },
  {
    id: 5,
    number: 5,
    name: 'Lucky Charm',
    jockey: 'J. McDonald',
    color: '#a855f7', // Purple
    colorName: 'Purple',
    bgLight: 'rgba(168, 85, 247, 0.15)',
    border: 'border-purple-500/40',
    text: 'text-purple-500',
    barBg: 'bg-purple-500',
    glow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]',
    defaultOdds: 8.0,
    avatar: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=400&auto=format&fit=crop&q=80',
    initialPool: 1950,
  },
]

const INITIAL_RECENT_BETS = [
  { id: 'b1', user: 'AmitPro', horseNum: 2, amount: 500, time: '14:25:31', avatar: '👨‍💼' },
  { id: 'b2', user: 'SoniaQueen', horseNum: 1, amount: 1000, time: '14:25:30', avatar: '👩‍🦰' },
  { id: 'b3', user: 'RacingKing', horseNum: 3, amount: 300, time: '14:25:29', avatar: '👑' },
  { id: 'b4', user: 'User786', horseNum: 5, amount: 750, time: '14:25:28', avatar: '🚀' },
  { id: 'b5', user: 'BetMaster', horseNum: 4, amount: 200, time: '14:25:27', avatar: '🎯' },
  { id: 'b6', user: 'PlayNow', horseNum: 1, amount: 600, time: '14:25:26', avatar: '🔥' },
  { id: 'b7', user: 'NehaPlay', horseNum: 3, amount: 1000, time: '14:25:24', avatar: '💃' },
  { id: 'b8', user: 'CryptoBet', horseNum: 2, amount: 250, time: '14:25:22', avatar: '🪙' },
]

const INITIAL_RUNNING_BETS = [
  { id: 1, time: '14:25:12', user: 'Rohan123', avatar: '👤', horseNum: 1, horseName: 'Thunder Bolt', amount: 500, potentialWin: 1250 },
  { id: 2, time: '14:25:14', user: 'NehaPlay', avatar: '👩', horseNum: 3, horseName: 'Royal Star', amount: 1000, potentialWin: 4200 },
  { id: 3, time: '14:25:16', user: 'AlphaUser', avatar: '🤠', horseNum: 2, horseName: 'Silver Arrow', amount: 200, potentialWin: 600 },
  { id: 4, time: '14:25:17', user: 'KingBet', avatar: '👑', horseNum: 4, horseName: 'Midnight King', amount: 750, potentialWin: 4875 },
  { id: 5, time: '14:25:19', user: 'LuckyWin', avatar: '🍀', horseNum: 1, horseName: 'Thunder Bolt', amount: 300, potentialWin: 750 },
  { id: 6, time: '14:25:21', user: 'PlayerOne', avatar: '🎮', horseNum: 5, horseName: 'Lucky Charm', amount: 1200, potentialWin: 9600 },
  { id: 7, time: '14:25:23', user: 'Dream11', avatar: '⭐', horseNum: 3, horseName: 'Royal Star', amount: 400, potentialWin: 1680 },
  { id: 8, time: '14:25:26', user: 'Vikram177', avatar: '🦁', horseNum: 2, horseName: 'Silver Arrow', amount: 600, potentialWin: 1800 },
  { id: 9, time: '14:25:28', user: 'CashMaster', avatar: '💰', horseNum: 4, horseName: 'Midnight King', amount: 250, potentialWin: 1625 },
  { id: 10, time: '14:25:30', user: 'BetaUser', avatar: '🕶️', horseNum: 1, horseName: 'Thunder Bolt', amount: 1000, potentialWin: 2500 },
]

export default function LiveArena() {
  const { currentRace, scheduleWinner, setJackpot } = useGameEngine()
  const socketData = useHorseRaceSocket()

  // Race State Controls
  const [raceNumber, setRaceNumber] = useState(1025)
  const [racePhase, setRacePhase] = useState('RUNNING') // 'BETTING' | 'COUNTDOWN' | 'RUNNING' | 'FINISHED'
  const [timerSeconds, setTimerSeconds] = useState(24)
  const [scheduledWinnerId, setScheduledWinnerId] = useState(1) // Thunder Bolt
  const [jackpotMultiplier, setJackpotMultiplier] = useState('1X') // '1X', '2X', '3X', '4X', 'RANDOM'
  
  // Audio & Sound FX
  const [soundEnabled, setSoundEnabled] = useState(true)
  
  // Live Bet Pools per horse
  const [horsePools, setHorsePools] = useState({
    1: 12450,
    2: 9200,
    3: 6300,
    4: 3150,
    5: 1950,
  })
  
  const [totalUsersCount, setTotalUsersCount] = useState(24)
  const [runningBets, setRunningBets] = useState(INITIAL_RUNNING_BETS)
  const [recentBets, setRecentBets] = useState(INITIAL_RECENT_BETS)
  
  // Live Horse Running Positions (0 to 100%)
  const [horsePositions, setHorsePositions] = useState({
    1: 72,
    2: 58,
    3: 45,
    4: 64,
    5: 78,
  })

  // Race Overall Progress (0 to 100%)
  const [raceProgress, setRaceProgress] = useState(65)
  const [autoSimulate, setAutoSimulate] = useState(true)
  const [showControlDrawer, setShowControlDrawer] = useState(true)
  const [actionNotice, setActionNotice] = useState(null)

  // Calculate dynamic Total Bet Amount and Horse Pool percentages
  const totalBetAmount = useMemo(() => {
    return Object.values(horsePools).reduce((acc, val) => acc + val, 0)
  }, [horsePools])

  const horsePercentages = useMemo(() => {
    const total = totalBetAmount || 1
    const p = {}
    ARENA_HORSES.forEach((h) => {
      p[h.id] = Math.round(((horsePools[h.id] || 0) / total) * 100)
    })
    return p
  }, [horsePools, totalBetAmount])

  // Sound muting handler
  useEffect(() => {
    sound.setMuted(!soundEnabled)
  }, [soundEnabled])

  // Sync with live socket if real events arrive
  useEffect(() => {
    if (socketData?.raceState?.status) {
      const s = socketData.raceState.status.toUpperCase()
      if (s.includes('BET')) setRacePhase('BETTING')
      else if (s.includes('COUNT')) setRacePhase('COUNTDOWN')
      else if (s.includes('RUN')) setRacePhase('RUNNING')
      else if (s.includes('FINISH') || s.includes('RESULT')) setRacePhase('FINISHED')
    }
    if (socketData?.countdown !== null && socketData?.countdown !== undefined) {
      setTimerSeconds(socketData.countdown)
    }
    if (socketData?.liveJackpot) {
      setJackpotMultiplier(String(socketData.liveJackpot.multiplier || '1X'))
    }
  }, [socketData])

  // Dynamic Live Simulation Loop
  useEffect(() => {
    if (!autoSimulate) return

    const timerInterval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          // Cycle phases realistically
          setRacePhase((phase) => {
            if (phase === 'BETTING') {
              sound.playRaceStart()
              return 'RUNNING'
            }
            if (phase === 'RUNNING') {
              sound.playWinner()
              return 'FINISHED'
            }
            if (phase === 'FINISHED') {
              setRaceNumber((n) => n + 1)
              return 'BETTING'
            }
            return 'BETTING'
          })
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerInterval)
  }, [autoSimulate])

  // Horse positions and race progress animation
  useEffect(() => {
    if (!autoSimulate) return

    const moveInterval = setInterval(() => {
      if (racePhase === 'RUNNING') {
        setRaceProgress((p) => {
          const next = p >= 98 ? 10 : p + 1.2
          return Number(next.toFixed(1))
        })

        setHorsePositions((prev) => {
          const winnerBias = scheduledWinnerId || 1
          const updated = {}
          ARENA_HORSES.forEach((h) => {
            const current = prev[h.id] || 10
            // Scheduled winner has positive acceleration boost
            const speedBoost = h.id === winnerBias ? (Math.random() * 2.2 + 1.2) : (Math.random() * 1.8 + 0.8)
            let nextPos = current + speedBoost
            if (nextPos >= 96) nextPos = 5
            updated[h.id] = Number(nextPos.toFixed(1))
          })
          return updated
        })
      } else if (racePhase === 'BETTING') {
        setRaceProgress(0)
        setHorsePositions({ 1: 5, 2: 5, 3: 5, 4: 5, 5: 5 })
      }
    }, 120)

    return () => clearInterval(moveInterval)
  }, [autoSimulate, racePhase, scheduledWinnerId])

  // Simulated Live Bet Influx Stream (Every 2-4 seconds)
  useEffect(() => {
    if (!autoSimulate) return

    const betInterval = setInterval(() => {
      if (racePhase !== 'FINISHED') {
        const dummyUsers = [
          'KaranKing', 'RaviRider', 'LuckyPunter', 'DiamondBet', 'StarRacer',
          'Aman777', 'VickyFast', 'DeepakWin', 'SanjayPro', 'PoojaPlay', 'AdityaGo'
        ]
        const avatars = ['🤠', '👑', '🚀', '🔥', '💎', '🦁', '⚡', '🎯', '💰']
        const randomUser = dummyUsers[Math.floor(Math.random() * dummyUsers.length)]
        const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)]
        const targetHorseId = Math.floor(Math.random() * 5) + 1
        const horseObj = ARENA_HORSES.find((h) => h.id === targetHorseId)
        const betAmounts = [100, 200, 500, 1000, 1500, 2000, 2500, 5000]
        const randomAmount = betAmounts[Math.floor(Math.random() * betAmounts.length)]
        const now = new Date().toTimeString().split(' ')[0]
        const potential = Math.round(randomAmount * (horseObj?.defaultOdds || 2.5))

        // Update horse pools
        setHorsePools((prev) => ({
          ...prev,
          [targetHorseId]: (prev[targetHorseId] || 0) + randomAmount
        }))

        // Increment users occasionally
        setTotalUsersCount((u) => u + (Math.random() > 0.6 ? 1 : 0))

        // New Running Bet
        const newRunBet = {
          id: Date.now(),
          time: now,
          user: randomUser,
          avatar: randomAvatar,
          horseNum: targetHorseId,
          horseName: horseObj?.name || 'Horse',
          amount: randomAmount,
          potentialWin: potential
        }

        setRunningBets((prev) => [newRunBet, ...prev.slice(0, 11)])

        // New Recent Bet
        const newRecBet = {
          id: 'rb-' + Date.now(),
          user: randomUser,
          horseNum: targetHorseId,
          amount: randomAmount,
          time: now,
          avatar: randomAvatar
        }
        setRecentBets((prev) => [newRecBet, ...prev.slice(0, 8)])

        if (soundEnabled && Math.random() > 0.7) {
          sound.playCash()
        }
      }
    }, 2400)

    return () => clearInterval(betInterval)
  }, [autoSimulate, racePhase, soundEnabled])

  // Winner Schedule Handler
  const handleSelectWinner = async (horseId) => {
    setScheduledWinnerId(horseId)
    const target = ARENA_HORSES.find((h) => h.id === horseId)
    sound.playClick()
    try {
      if (socketData?.socket) {
        socketData.emit('admin:schedule_winner', {
          horseNumber: horseId,
          horseName: target?.name,
          raceId: raceNumber
        })
      }
      await scheduleWinner(target?.name || `Horse #${horseId}`)
      setActionNotice(`👑 Winner guaranteed: #${horseId} ${target?.name}`)
    } catch (e) {
      setActionNotice(`👑 Winner set to #${horseId} ${target?.name}`)
    }
    setTimeout(() => setActionNotice(null), 3500)
  }

  // Jackpot Multiplier Handler
  const handleSetJackpot = async (mult) => {
    setJackpotMultiplier(mult)
    sound.playClick()
    try {
      if (mult === '1X' || mult === 'OFF') {
        socketData.emit('admin:clear_jackpot', {})
        await setJackpot('1X')
        setActionNotice(`Jackpot turned OFF (Standard 1X)`)
      } else {
        const val = mult === 'RANDOM' ? 'RANDOM' : parseInt(mult, 10) || 2
        socketData.emit('admin:set_jackpot', { multiplier: val })
        await setJackpot(mult)
        setActionNotice(`🔥 Jackpot Multiplier set to ${mult}`)
      }
    } catch (e) {
      setActionNotice(`🔥 Jackpot updated to ${mult}`)
    }
    setTimeout(() => setActionNotice(null), 3500)
  }

  // End Race Handler
  const handleEndRace = () => {
    sound.playWinner()
    setRacePhase('FINISHED')
    setTimerSeconds(10)
    setActionNotice(`🏁 Race #${raceNumber} Completed! Winner: #${scheduledWinnerId} ${ARENA_HORSES.find(h => h.id === scheduledWinnerId)?.name}`)
    setTimeout(() => setActionNotice(null), 4000)
  }

  // Manual Bet Injector
  const handleInjectBet = (horseId, amount) => {
    const horseObj = ARENA_HORSES.find(h => h.id === horseId)
    const now = new Date().toTimeString().split(' ')[0]
    setHorsePools(prev => ({ ...prev, [horseId]: (prev[horseId] || 0) + amount }))
    setTotalUsersCount(u => u + 1)
    setRunningBets(prev => [{
      id: Date.now(),
      time: now,
      user: 'AdminTest',
      avatar: '⚡',
      horseNum: horseId,
      horseName: horseObj?.name,
      amount,
      potentialWin: Math.round(amount * (horseObj?.defaultOdds || 2.5))
    }, ...prev.slice(0, 11)])
    sound.playCash()
    setActionNotice(`+ ₹${amount.toLocaleString()} bet injected into #${horseId} ${horseObj?.name}`)
    setTimeout(() => setActionNotice(null), 2500)
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans p-3 md:p-6 space-y-4 select-none">
      
      {/* Toast Notification */}
      {actionNotice && (
        <div className="fixed top-5 right-5 z-50 bg-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce border border-amber-300">
          <Flame size={18} className="text-red-700 animate-pulse" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* TOP HEADER BAR (Exact match with reference UI)               */}
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
              <p className="text-[11px] md:text-xs font-bold text-amber-400 tracking-widest uppercase">
                Horse Racing Live
              </p>
            </div>
          </div>

          {/* Race Number & LIVE Badge */}
          <div className="flex items-center gap-2 bg-[#1e293b]/90 border border-slate-700 px-3.5 py-1.5 rounded-xl">
            <span className="text-xs md:text-sm font-bold text-slate-300">
              Race # <span className="text-white font-mono font-black">{raceNumber}</span>
            </span>
            <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider shadow-[0_0_10px_rgba(220,38,38,0.7)] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              LIVE
            </span>
          </div>

          {/* Timer: Time Left To Bet */}
          <div className="flex items-center gap-3 bg-[#1e1528] border border-red-500/40 px-4 py-1.5 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <div className="text-lg md:text-2xl font-mono font-black text-red-500 tracking-wider animate-pulse">
              00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400 leading-tight">
              Time Left<br /><span className="text-red-400">To Bet</span>
            </div>
          </div>

          {/* Track Specs Badges */}
          <div className="hidden xl:flex items-center gap-4 bg-[#1e293b]/60 border border-slate-700/60 px-4 py-2 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Track</span>
              <span className="font-bold text-white">Royal Turf</span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Distance</span>
              <span className="font-bold text-white">1200m</span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Weather</span>
              <span className="font-bold text-amber-300">☀️ Sunny</span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Status</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {racePhase}
              </span>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
              title={soundEnabled ? 'Mute SFX' : 'Unmute SFX'}
            >
              {soundEnabled ? <Volume2 size={18} className="text-amber-400" /> : <VolumeX size={18} />}
            </button>

            <button
              type="button"
              onClick={() => setShowControlDrawer(!showControlDrawer)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
            >
              <Sliders size={15} className="text-cyan-400" />
              <span className="hidden sm:inline">Admin Hub</span>
            </button>

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
      {/* FLOATING ADMIN LIVE CONTROLS DOCK (When Toggled)             */}
      {/* ============================================================ */}
      {showControlDrawer && (
        <div className="bg-gradient-to-r from-[#111827] via-[#0f172a] to-[#1e1b4b] border border-amber-500/40 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4">
            
            {/* Guaranteed Winner Picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Crown size={14} /> Winner:
              </span>
              <div className="flex items-center gap-1.5">
                {ARENA_HORSES.map((h) => {
                  const isPicked = scheduledWinnerId === h.id
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => handleSelectWinner(h.id)}
                      style={{ backgroundColor: isPicked ? h.color : 'rgba(30,41,59,0.8)' }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border ${
                        isPicked
                          ? 'text-white shadow-[0_0_12px_rgba(255,255,255,0.4)] border-white scale-105'
                          : 'text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      #{h.number} {h.name.split(' ')[0]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Jackpot Multiplier Controller */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Flame size={14} className="text-amber-400" /> Jackpot:
              </span>
              <div className="flex items-center gap-1">
                {['1X', '2X', '3X', '4X', 'RANDOM'].map((mult) => {
                  const active = jackpotMultiplier === mult
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

            {/* Phase Trigger & Quick Bet Simulator */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setRacePhase('BETTING')
                  setTimerSeconds(30)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  racePhase === 'BETTING'
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Betting (30s)
              </button>

              <button
                type="button"
                onClick={() => {
                  setRacePhase('RUNNING')
                  setTimerSeconds(20)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  racePhase === 'RUNNING'
                    ? 'bg-blue-600 text-white border-blue-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Start Race
              </button>

              <button
                type="button"
                onClick={() => handleInjectBet(scheduledWinnerId || 1, 1000)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1"
                title="Inject ₹1,000 bet to selected horse"
              >
                <Plus size={14} /> +₹1,000 Bet
              </button>

              <button
                type="button"
                onClick={() => setAutoSimulate(!autoSimulate)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  autoSimulate
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}
              >
                {autoSimulate ? '● Live Stream ON' : '○ Stream Paused'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CINEMATIC HORSE RACING TRACK STADIUM                         */}
      {/* ============================================================ */}
      <div className="relative w-full h-[220px] md:h-[300px] rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-[#1c381c]">
        
        {/* Realistic Stadium Grass & Crowd Backdrop */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-70 filter saturate-125"
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
          <div className="text-[9px] font-bold text-slate-300">SBNO ARENA</div>
        </div>

        {/* 5 Race Lanes */}
        <div className="absolute inset-0 flex flex-col justify-evenly py-2 px-6 z-10">
          {ARENA_HORSES.map((horse) => {
            const position = horsePositions[horse.id] || 10
            return (
              <div key={horse.id} className="relative w-full h-10 border-b border-white/15 flex items-center">
                
                {/* Lane Railing Marker */}
                <div className="absolute left-0 text-[10px] font-black text-white/50 font-mono">
                  L{horse.number}
                </div>

                {/* Animated Horse Runner on the Track */}
                <div
                  className="absolute transition-all duration-150 ease-linear flex items-center gap-2 group cursor-pointer"
                  style={{ left: `${Math.min(Math.max(position, 2), 92)}%` }}
                  onClick={() => handleSelectWinner(horse.id)}
                >
                  {/* Floating Runner Badge */}
                  <div
                    style={{ backgroundColor: horse.color }}
                    className="flex items-center gap-1 text-white text-[10px] md:text-xs font-black px-2 py-0.5 rounded shadow-lg border border-white/40 whitespace-nowrap animate-pulse"
                  >
                    <span>{horse.number}</span>
                    <span className="hidden sm:inline font-semibold">{horse.name}</span>
                  </div>

                  {/* Horse Silhouette / Emoji Runner */}
                  <div className="relative text-2xl md:text-3xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] transform -scale-x-100">
                    🏇
                    {scheduledWinnerId === horse.id && (
                      <Crown size={14} className="absolute -top-3 left-1 text-amber-400 fill-amber-400 animate-bounce" />
                    )}
                  </div>
                </div>

              </div>
            )
          })}
        </div>

      </div>

      {/* ============================================================ */}
      {/* 5 HORSE ODDS CARDS ROW (Exact match with reference image)    */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {ARENA_HORSES.map((horse) => {
          const sharePercent = horsePercentages[horse.id] || 20
          const isWinner = scheduledWinnerId === horse.id

          return (
            <div
              key={horse.id}
              onClick={() => handleSelectWinner(horse.id)}
              className={`relative bg-[#0f172a] border rounded-2xl p-3 flex flex-col justify-between transition-all duration-200 cursor-pointer group hover:scale-[1.02] ${
                isWinner
                  ? `${horse.border} ${horse.glow} ring-2 ring-amber-400`
                  : 'border-slate-800 hover:border-slate-600'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    style={{ backgroundColor: horse.color }}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white font-black text-xs shadow-md"
                  >
                    {horse.number}
                  </div>
                  <span className="font-extrabold text-xs md:text-sm text-white tracking-wide truncate">
                    {horse.name}
                  </span>
                </div>
                {isWinner && (
                  <Crown size={14} className="text-amber-400 fill-amber-400 shrink-0" title="Guaranteed Winner" />
                )}
              </div>

              {/* Horse Portrait & Odds Box */}
              <div className="flex items-center justify-between gap-2 my-1">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden border border-slate-700 bg-slate-800/80 shrink-0">
                  <img
                    src={horse.avatar}
                    alt={horse.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Odds</div>
                  <div className="text-lg md:text-xl font-mono font-black text-white">
                    {horse.defaultOdds.toFixed(1)}
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 font-mono">
                    {sharePercent}%
                  </div>
                </div>
              </div>

              {/* Colored Progress Percentage Bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  style={{ width: `${sharePercent}%`, backgroundColor: horse.color }}
                  className="h-full rounded-full transition-all duration-500"
                />
              </div>

            </div>
          )
        })}
      </div>

      {/* ============================================================ */}
      {/* THREE-COLUMN STATS SECTION: LIVE BETS, POOL, RECENT FEED    */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* COLUMN 1: LIVE BETS (Running) - 5 Cols */}
        <div className="lg:col-span-5 bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs md:text-sm font-extrabold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                LIVE BETS <span className="text-slate-400 font-normal">({racePhase})</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400 font-bold">
                {runningBets.length} Bets Placed
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] md:text-xs">
                <thead>
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
                  {runningBets.slice(0, 10).map((bet, idx) => {
                    const hInfo = ARENA_HORSES.find(h => h.id === bet.horseNum)
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
                          ₹{bet.amount.toLocaleString()}
                        </td>
                        <td className="py-2 px-1 text-right font-mono font-bold text-amber-400">
                          ₹{bet.potentialWin.toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* COLUMN 2: TOTAL BETS ON EACH HORSE - 4 Cols */}
        <div className="lg:col-span-4 bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-xs md:text-sm font-extrabold text-white mb-4 tracking-wide">
              TOTAL BETS ON EACH HORSE
            </h2>

            <div className="space-y-3.5">
              {ARENA_HORSES.map((h) => {
                const amount = horsePools[h.id] || 0
                const percent = horsePercentages[h.id] || 0
                return (
                  <div key={h.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          style={{ backgroundColor: h.color }}
                          className="w-5 h-5 rounded text-[10px] font-black text-white flex items-center justify-center shadow"
                        >
                          {h.number}
                        </div>
                        <span className="font-bold text-slate-200">{h.name}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-white">₹ {amount.toLocaleString()}</span>
                        <span className="text-slate-400 text-[11px]">{percent}%</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        style={{ width: `${percent}%`, backgroundColor: h.color }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bottom Card Summary */}
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

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {recentBets.map((rb) => {
                const hInfo = ARENA_HORSES.find(h => h.id === rb.horseNum)
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
                        ₹{rb.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* BOTTOM RACE PROGRESS BAR (Exact match with reference image)   */}
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

              {/* Mini Running Horses galloping across progress line */}
              {ARENA_HORSES.map((h) => {
                const miniPos = horsePositions[h.id] || 10
                return (
                  <div
                    key={h.id}
                    className="absolute -top-3 transition-all duration-200 ease-linear transform -translate-x-1/2"
                    style={{ left: `${miniPos}%` }}
                    title={`#${h.number} ${h.name}`}
                  >
                    <div
                      style={{ color: h.color }}
                      className="text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] filter"
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
              <span>600m</span>
              <span>1000m</span>
              <span className="text-amber-400">Finish</span>
            </div>

          </div>

        </div>
      </div>

    </div>
  )
}
