import React, { useState, useEffect, useMemo } from 'react'
import {
  Crown, Play, Square, FastForward, Trophy, Zap, Shield, RefreshCw,
  Users, DollarSign, Activity, Radio, Clock, Eye, AlertCircle,
  TrendingUp, CheckCircle2, ChevronRight, Flame, Volume2, VolumeX,
  Sliders, Plus, XCircle, Wifi, WifiOff
} from 'lucide-react'
import { useHorseRaceSocket } from '../hooks/useHorseRaceSocket.js'
import { useGameEngine } from '../hooks/useGameEngine.js'
import { resolveImageUrl } from '../utils/imageUrl.js'
import { sound } from '../utils/audio.js'

// Master 12 Horses Configuration
const DEFAULT_12_HORSES = [
  { id: 1, number: 1, name: 'Thunder Bolt', color: '#EF4444', border: 'border-red-500/40', text: 'text-red-500', barBg: 'bg-red-500', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]', odds: 2.2, avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&auto=format&fit=crop&q=80', defaultPool: 12450, jockey: 'R. Moore' },
  { id: 2, number: 2, name: 'Silver Arrow', color: '#3B82F6', border: 'border-blue-500/40', text: 'text-blue-500', barBg: 'bg-blue-500', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]', odds: 3.0, avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80', defaultPool: 9200, jockey: 'W. Buick' },
  { id: 3, number: 3, name: 'Royal Star', color: '#10B981', border: 'border-emerald-500/40', text: 'text-emerald-500', barBg: 'bg-emerald-500', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]', odds: 4.2, avatar: 'https://images.unsplash.com/photo-1598974357801-cbca100e65d3?w=400&auto=format&fit=crop&q=80', defaultPool: 6300, jockey: 'L. Dettori' },
  { id: 4, number: 4, name: 'Midnight King', color: '#EAB308', border: 'border-yellow-500/40', text: 'text-yellow-500', barBg: 'bg-yellow-500', glow: 'shadow-[0_0_15px_rgba(234,179,8,0.5)]', odds: 5.5, avatar: 'https://images.unsplash.com/photo-1566251037378-5e04e3bec343?w=400&auto=format&fit=crop&q=80', defaultPool: 4150, jockey: 'C. Soumillon' },
  { id: 5, number: 5, name: 'Lucky Charm', color: '#A855F7', border: 'border-purple-500/40', text: 'text-purple-500', barBg: 'bg-purple-500', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]', odds: 7.0, avatar: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=400&auto=format&fit=crop&q=80', defaultPool: 3200, jockey: 'J. McDonald' },
  { id: 6, number: 6, name: 'Golden Mane', color: '#EC4899', border: 'border-pink-500/40', text: 'text-pink-500', barBg: 'bg-pink-500', glow: 'shadow-[0_0_15px_rgba(236,72,153,0.5)]', odds: 8.5, avatar: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=400&auto=format&fit=crop&q=80', defaultPool: 2800, jockey: 'R. Varma' },
  { id: 7, number: 7, name: 'Desert Mirage', color: '#06B6D4', border: 'border-cyan-500/40', text: 'text-cyan-500', barBg: 'bg-cyan-500', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.5)]', odds: 10.0, avatar: 'https://images.unsplash.com/photo-1588693951525-6b9b32cfa8a6?w=400&auto=format&fit=crop&q=80', defaultPool: 2100, jockey: 'D. Rawat' },
  { id: 8, number: 8, name: 'Blaze Runner', color: '#F97316', border: 'border-orange-500/40', text: 'text-orange-500', barBg: 'bg-orange-500', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)]', odds: 12.0, avatar: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80', defaultPool: 1850, jockey: 'S. Sheikh' },
  { id: 9, number: 9, name: 'Mystic Prince', color: '#14B8A6', border: 'border-teal-500/40', text: 'text-teal-500', barBg: 'bg-teal-500', glow: 'shadow-[0_0_15px_rgba(20,184,166,0.5)]', odds: 14.5, avatar: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&auto=format&fit=crop&q=80', defaultPool: 1500, jockey: 'V. Rathore' },
  { id: 10, number: 10, name: 'Royal Sultan', color: '#6366F1', border: 'border-indigo-500/40', text: 'text-indigo-500', barBg: 'bg-indigo-500', glow: 'shadow-[0_0_15px_rgba(99,102,241,0.5)]', odds: 16.0, avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80', defaultPool: 1200, jockey: 'K. Khan' },
  { id: 11, number: 11, name: 'Wild Mustang', color: '#84CC16', border: 'border-lime-500/40', text: 'text-lime-500', barBg: 'bg-lime-500', glow: 'shadow-[0_0_15px_rgba(132,204,22,0.5)]', odds: 18.0, avatar: 'https://images.unsplash.com/photo-1598974357801-cbca100e65d3?w=400&auto=format&fit=crop&q=80', defaultPool: 950, jockey: 'A. Singh' },
  { id: 12, number: 12, name: 'Red Samurai', color: '#E11D48', border: 'border-rose-500/40', text: 'text-rose-500', barBg: 'bg-rose-500', glow: 'shadow-[0_0_15px_rgba(225,29,72,0.5)]', odds: 22.0, avatar: 'https://images.unsplash.com/photo-1566251037378-5e04e3bec343?w=400&auto=format&fit=crop&q=80', defaultPool: 800, jockey: 'H. Tanaka' },
]

const INITIAL_RECENT_BETS = [
  { id: 'b1', user: 'AmitPro', horseNum: 2, amount: 500, time: '14:25:31', avatar: '👨‍💼' },
  { id: 'b2', user: 'SoniaQueen', horseNum: 1, amount: 1000, time: '14:25:30', avatar: '👩‍🦰' },
  { id: 'b3', user: 'RacingKing', horseNum: 6, amount: 300, time: '14:25:29', avatar: '👑' },
  { id: 'b4', user: 'User786', horseNum: 12, amount: 750, time: '14:25:28', avatar: '🚀' },
  { id: 'b5', user: 'BetMaster', horseNum: 4, amount: 200, time: '14:25:27', avatar: '🎯' },
  { id: 'b6', user: 'PlayNow', horseNum: 8, amount: 600, time: '14:25:26', avatar: '🔥' },
  { id: 'b7', user: 'NehaPlay', horseNum: 3, amount: 1000, time: '14:25:24', avatar: '💃' },
  { id: 'b8', user: 'CryptoBet', horseNum: 10, amount: 250, time: '14:25:22', avatar: '🪙' },
]

const INITIAL_RUNNING_BETS = [
  { id: 1, time: '14:25:12', user: 'Rohan123', avatar: '👤', horseNum: 1, horseName: 'Thunder Bolt', amount: 500, potentialWin: 1100 },
  { id: 2, time: '14:25:14', user: 'NehaPlay', avatar: '👩', horseNum: 3, horseName: 'Royal Star', amount: 1000, potentialWin: 4200 },
  { id: 3, time: '14:25:16', user: 'AlphaUser', avatar: '🤠', horseNum: 2, horseName: 'Silver Arrow', amount: 200, potentialWin: 600 },
  { id: 4, time: '14:25:17', user: 'KingBet', avatar: '👑', horseNum: 4, horseName: 'Midnight King', amount: 750, potentialWin: 4125 },
  { id: 5, time: '14:25:19', user: 'LuckyWin', avatar: '🍀', horseNum: 6, horseName: 'Golden Mane', amount: 300, potentialWin: 2550 },
  { id: 6, time: '14:25:21', user: 'PlayerOne', avatar: '🎮', horseNum: 5, horseName: 'Lucky Charm', amount: 1200, potentialWin: 8400 },
  { id: 7, time: '14:25:23', user: 'Dream11', avatar: '⭐', horseNum: 9, horseName: 'Mystic Prince', amount: 400, potentialWin: 5800 },
  { id: 8, time: '14:25:26', user: 'Vikram177', avatar: '🦁', horseNum: 7, horseName: 'Desert Mirage', amount: 600, potentialWin: 6000 },
  { id: 9, time: '14:25:28', user: 'CashMaster', avatar: '💰', horseNum: 11, horseName: 'Wild Mustang', amount: 250, potentialWin: 4500 },
  { id: 10, time: '14:25:30', user: 'BetaUser', avatar: '🕶️', horseNum: 12, horseName: 'Red Samurai', amount: 1000, potentialWin: 22000 },
]

export default function LiveArena() {
  const { currentRace, scheduleWinner, setJackpot } = useGameEngine()
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

  // Race Metadata State
  const [raceNumber, setRaceNumber] = useState(1025)
  const [racePhase, setRacePhase] = useState('RUNNING') // 'BETTING' | 'COUNTDOWN' | 'RUNNING' | 'FINISHED'
  const [timerSeconds, setTimerSeconds] = useState(24)
  const [trackName, setTrackName] = useState('Royal Turf')
  const [trackDistance, setTrackDistance] = useState('1200m')
  const [weatherCondition, setWeatherCondition] = useState('☀️ Sunny')
  
  // All 12 Horses array rendered on UI (with imageUrl / horseImageUrl support)
  const [horses, setHorses] = useState(DEFAULT_12_HORSES)
  
  // Live Bet Pools for all 12 horses
  const [horsePools, setHorsePools] = useState({
    1: 12450, 2: 9200, 3: 6300, 4: 4150, 5: 3200, 6: 2800,
    7: 2100, 8: 1850, 9: 1500, 10: 1200, 11: 950, 12: 800
  })

  // Winner selection & Jackpot Multiplier
  const [scheduledWinnerId, setScheduledWinnerId] = useState(1)
  const [jackpotMultiplier, setJackpotMultiplier] = useState('1X')

  // Live tables
  const [totalUsersCount, setTotalUsersCount] = useState(48)
  const [runningBets, setRunningBets] = useState(INITIAL_RUNNING_BETS)
  const [recentBets, setRecentBets] = useState(INITIAL_RECENT_BETS)

  // 12 Track positions (0 to 100%)
  const [horsePositions, setHorsePositions] = useState({
    1: 76, 2: 68, 3: 54, 4: 62, 5: 71, 6: 48,
    7: 59, 8: 65, 9: 42, 10: 51, 11: 38, 12: 80
  })
  const [raceProgress, setRaceProgress] = useState(65)

  // Simulation & Audio UI toggles
  const [autoSimulate, setAutoSimulate] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showControlDrawer, setShowControlDrawer] = useState(true)
  const [actionNotice, setActionNotice] = useState(null)

  // 1. Initial Snapshot Request on Mount
  useEffect(() => {
    requestLiveSnapshot()
  }, [requestLiveSnapshot])

  // 2. Handle Backend Snapshot (`admin:live_race_snapshot`)
  useEffect(() => {
    if (!liveSnapshot) return
    console.log('⚡ [LiveArena] Received admin:live_race_snapshot:', liveSnapshot)
    
    // Race Serial / Number
    const rNum = liveSnapshot.raceNumber || liveSnapshot.gameSerial || liveSnapshot.raceId || liveSnapshot.id
    if (rNum) setRaceNumber(rNum)

    // Stage / Status
    const rawStage = liveSnapshot.stage || liveSnapshot.status || liveSnapshot.state
    if (rawStage) {
      const s = String(rawStage).toUpperCase()
      if (s.includes('BET')) setRacePhase('BETTING')
      else if (s.includes('COUNT')) setRacePhase('COUNTDOWN')
      else if (s.includes('RUN')) setRacePhase('RUNNING')
      else if (s.includes('FINISH') || s.includes('RESULT')) setRacePhase('FINISHED')
    }

    // Timer
    if (liveSnapshot.timer !== undefined || liveSnapshot.countdown !== undefined) {
      setTimerSeconds(Number(liveSnapshot.timer || liveSnapshot.countdown || 24))
    }

    // Track Specs
    if (liveSnapshot.track || liveSnapshot.trackName) setTrackName(liveSnapshot.track || liveSnapshot.trackName)
    if (liveSnapshot.distance) setTrackDistance(String(liveSnapshot.distance).includes('m') ? liveSnapshot.distance : `${liveSnapshot.distance}m`)
    if (liveSnapshot.weather) setWeatherCondition(liveSnapshot.weather)

    // Horses & Images (Support all up to 12 horses)
    if (Array.isArray(liveSnapshot.horses) && liveSnapshot.horses.length > 0) {
      const mapped = liveSnapshot.horses.map((h, idx) => {
        const theme = DEFAULT_12_HORSES[idx] || DEFAULT_12_HORSES[idx % DEFAULT_12_HORSES.length]
        const rawImg = h.imageUrl || h.horseImageUrl || h.image || h.avatar || theme.avatar
        return {
          ...theme,
          id: h.id || h.horseId || (idx + 1),
          number: h.number || h.horseNumber || (idx + 1),
          name: h.name || h.horseName || theme.name,
          odds: Number(h.odds || h.multiplier || theme.odds),
          avatar: resolveImageUrl(rawImg),
          jockey: h.jockey || theme.jockey || `Jockey #${idx + 1}`
        }
      })
      setHorses(mapped)
    }

    // Per-Horse Bet Pools
    if (liveSnapshot.betPool || liveSnapshot.horsePools || liveSnapshot.pools) {
      const p = liveSnapshot.betPool || liveSnapshot.horsePools || liveSnapshot.pools
      if (typeof p === 'object') {
        setHorsePools((prev) => ({ ...prev, ...p }))
      }
    }

    // Live Bets / Recent Bets lists
    if (Array.isArray(liveSnapshot.recentBets) && liveSnapshot.recentBets.length > 0) {
      setRecentBets(liveSnapshot.recentBets.slice(0, 10))
    }
    if (Array.isArray(liveSnapshot.liveBets) && liveSnapshot.liveBets.length > 0) {
      setRunningBets(liveSnapshot.liveBets.slice(0, 15))
    }

    // Jackpot
    if (liveSnapshot.jackpot) {
      setJackpotMultiplier(String(liveSnapshot.jackpot.multiplier || '1X'))
    }
  }, [liveSnapshot])

  // 3. Handle Live Bet Influx (`admin:bet_live`)
  useEffect(() => {
    if (!liveLedgerBet) return
    const b = liveLedgerBet
    const hNum = Number(b.horseNumber || b.horseId || b.horseNum || 1)
    const hObj = horses.find(h => h.number === hNum || h.id === hNum) || horses[0]
    const amount = Number(b.amount || b.betAmount || 500)
    const time = b.time || b.timestamp || new Date().toTimeString().split(' ')[0]
    const user = b.user || b.username || b.playerName || 'LivePlayer'
    const potential = Number(b.potentialWin || b.potential_win || Math.round(amount * (hObj?.odds || 3.0)))

    // Update pool
    setHorsePools(prev => ({
      ...prev,
      [hNum]: (prev[hNum] || 0) + amount
    }))

    // Add to running bets
    setRunningBets(prev => [{
      id: b.id || Date.now(),
      time,
      user,
      avatar: b.avatar || '👤',
      horseNum: hNum,
      horseName: hObj?.name || `Horse #${hNum}`,
      amount,
      potentialWin: potential
    }, ...prev.slice(0, 11)])

    // Add to recent feed
    setRecentBets(prev => [{
      id: 'rec-' + Date.now(),
      user,
      horseNum: hNum,
      amount,
      time,
      avatar: b.avatar || '⚡'
    }, ...prev.slice(0, 8)])

    if (soundEnabled) sound.playCash()
  }, [liveLedgerBet, horses, soundEnabled])

  // 4. Handle Bet Pool Updates (`admin:bet_pool_update`)
  useEffect(() => {
    if (!liveBetPool) return
    if (typeof liveBetPool === 'object') {
      const poolsObj = liveBetPool.pools || liveBetPool.horsePools || liveBetPool
      setHorsePools(prev => ({ ...prev, ...poolsObj }))
      if (liveBetPool.totalUsers) setTotalUsersCount(liveBetPool.totalUsers)
    }
  }, [liveBetPool])

  // 5. Handle Live Track Updates (`race:track_update`)
  useEffect(() => {
    if (!liveTrack) return
    if (liveTrack.progress !== undefined) setRaceProgress(Number(liveTrack.progress))
    if (liveTrack.positions && typeof liveTrack.positions === 'object') {
      setHorsePositions(prev => ({ ...prev, ...liveTrack.positions }))
    } else if (Array.isArray(liveTrack.horses)) {
      const posMap = {}
      liveTrack.horses.forEach(h => {
        const id = h.id || h.horseId || h.number
        posMap[id] = Number(h.position || h.progress || 10)
      })
      setHorsePositions(posMap)
    }
  }, [liveTrack])

  // 6. Handle Race State Changed (`race:state_changed`)
  useEffect(() => {
    if (!raceState) return
    const raw = typeof raceState === 'string' ? raceState : (raceState.state || raceState.status || '')
    const s = String(raw).toUpperCase()
    if (s.includes('BET')) setRacePhase('BETTING')
    else if (s.includes('COUNT')) setRacePhase('COUNTDOWN')
    else if (s.includes('RUN')) setRacePhase('RUNNING')
    else if (s.includes('FINISH') || s.includes('RESULT')) setRacePhase('FINISHED')

    if (raceState.timer !== undefined) setTimerSeconds(Number(raceState.timer))
    if (raceState.raceNumber || raceState.gameSerial) setRaceNumber(raceState.raceNumber || raceState.gameSerial)
  }, [raceState])

  // 7. Handle Jackpot Updates (`admin:jackpot_updated`)
  useEffect(() => {
    if (!liveJackpot) return
    const mult = String(liveJackpot.multiplier || (liveJackpot.active ? '2X' : '1X'))
    setJackpotMultiplier(mult.toUpperCase().includes('X') ? mult.toUpperCase() : `${mult}X`)
  }, [liveJackpot])

  // 8. Countdown Tick handler
  useEffect(() => {
    if (countdown !== null && countdown !== undefined) {
      setTimerSeconds(countdown)
    }
  }, [countdown])

  // Audio Mute toggle
  useEffect(() => {
    sound.setMuted(!soundEnabled)
  }, [soundEnabled])

  // Dynamic Total Bet Pool & Percentages for all 12 horses
  const totalBetAmount = useMemo(() => {
    return Object.values(horsePools).reduce((acc, val) => acc + (Number(val) || 0), 0)
  }, [horsePools])

  const horsePercentages = useMemo(() => {
    const total = totalBetAmount || 1
    const p = {}
    horses.forEach((h) => {
      p[h.id] = Math.round(((Number(horsePools[h.id]) || Number(horsePools[h.number]) || 0) / total) * 100)
    })
    return p
  }, [horses, horsePools, totalBetAmount])

  // Dynamic Simulation Engine
  useEffect(() => {
    if (!autoSimulate) return

    const timerInterval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
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

  // Continuous Gallop Animation for all 12 horses
  useEffect(() => {
    if (!autoSimulate) return

    const moveInterval = setInterval(() => {
      if (racePhase === 'RUNNING') {
        setRaceProgress((p) => {
          const next = p >= 98 ? 5 : p + 1.2
          return Number(next.toFixed(1))
        })

        setHorsePositions((prev) => {
          const winnerBias = scheduledWinnerId || 1
          const updated = {}
          horses.forEach((h) => {
            const current = prev[h.id] || prev[h.number] || 10
            const isWinnerHorse = h.id === winnerBias || h.number === winnerBias
            const speedBoost = isWinnerHorse ? (Math.random() * 2.3 + 1.3) : (Math.random() * 1.9 + 0.7)
            let nextPos = current + speedBoost
            if (nextPos >= 96) nextPos = 5
            updated[h.id] = Number(nextPos.toFixed(1))
            updated[h.number] = Number(nextPos.toFixed(1))
          })
          return updated
        })
      } else if (racePhase === 'BETTING') {
        setRaceProgress(0)
        const resetMap = {}
        horses.forEach((h) => {
          resetMap[h.id] = 5
          resetMap[h.number] = 5
        })
        setHorsePositions(resetMap)
      }
    }, 120)

    return () => clearInterval(moveInterval)
  }, [autoSimulate, racePhase, scheduledWinnerId, horses])

  // Live Bet Stream Generator across 12 horses
  useEffect(() => {
    if (!autoSimulate) return

    const betInterval = setInterval(() => {
      if (racePhase !== 'FINISHED') {
        const dummyUsers = [
          'KaranKing', 'RaviRider', 'LuckyPunter', 'DiamondBet', 'StarRacer',
          'Aman777', 'VickyFast', 'DeepakWin', 'SanjayPro', 'PoojaPlay', 'AdityaGo',
          'Rahul99', 'PriyaRani', 'SureshDon', 'ManojFast', 'AnkitAce'
        ]
        const avatars = ['🤠', '👑', '🚀', '🔥', '💎', '🦁', '⚡', '🎯', '💰', '🎲', '🏎️']
        const randomUser = dummyUsers[Math.floor(Math.random() * dummyUsers.length)]
        const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)]
        const targetHorse = horses[Math.floor(Math.random() * horses.length)] || horses[0]
        const targetHorseId = targetHorse.id
        const targetHorseNum = targetHorse.number
        const betAmounts = [100, 200, 500, 1000, 1500, 2000, 2500, 5000]
        const randomAmount = betAmounts[Math.floor(Math.random() * betAmounts.length)]
        const now = new Date().toTimeString().split(' ')[0]
        const potential = Math.round(randomAmount * (targetHorse?.odds || 3.0))

        setHorsePools(prev => ({
          ...prev,
          [targetHorseId]: (prev[targetHorseId] || 0) + randomAmount,
          [targetHorseNum]: (prev[targetHorseNum] || 0) + randomAmount
        }))

        setTotalUsersCount(u => u + (Math.random() > 0.6 ? 1 : 0))

        setRunningBets(prev => [{
          id: Date.now(),
          time: now,
          user: randomUser,
          avatar: randomAvatar,
          horseNum: targetHorse.number,
          horseName: targetHorse.name,
          amount: randomAmount,
          potentialWin: potential
        }, ...prev.slice(0, 11)])

        setRecentBets(prev => [{
          id: 'rb-' + Date.now(),
          user: randomUser,
          horseNum: targetHorse.number,
          amount: randomAmount,
          time: now,
          avatar: randomAvatar
        }, ...prev.slice(0, 8)])

        if (soundEnabled && Math.random() > 0.75) {
          sound.playCash()
        }
      }
    }, 2500)

    return () => clearInterval(betInterval)
  }, [autoSimulate, racePhase, soundEnabled, horses])

  // Set Guaranteed Winner Action (Emits `admin:schedule_winner`)
  const handleSelectWinner = async (horseId) => {
    setScheduledWinnerId(horseId)
    const target = horses.find(h => h.id === horseId || h.number === horseId) || horses[0]
    sound.playClick()
    try {
      emit('admin:schedule_winner', {
        horseNumber: target.number,
        horseName: target.name,
        horseId: target.id,
        raceId: raceNumber
      })
      await scheduleWinner(target.name)
      setActionNotice(`👑 Guaranteed Winner: #${target.number} ${target.name}`)
    } catch (e) {
      setActionNotice(`👑 Winner set to #${target.number} ${target.name}`)
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
    setRacePhase('FINISHED')
    setTimerSeconds(10)
    emit('admin:end_race', { raceNumber, winnerId: scheduledWinnerId })
    const winnerHorse = horses.find(h => h.id === scheduledWinnerId || h.number === scheduledWinnerId)
    setActionNotice(`🏁 Race #${raceNumber} Ended! Winner: #${winnerHorse?.number} ${winnerHorse?.name}`)
    setTimeout(() => setActionNotice(null), 4000)
  }

  // Manual Snapshot Refresh
  const handleRefreshSnapshot = () => {
    sound.playClick()
    requestLiveSnapshot()
    setActionNotice('⚡ Requested fresh snapshot from backend (admin:live_race_snapshot:get)')
    setTimeout(() => setActionNotice(null), 2500)
  }

  // Manual Bet Injector
  const handleInjectBet = (horseId, amount) => {
    const horseObj = horses.find(h => h.id === horseId || h.number === horseId) || horses[0]
    const now = new Date().toTimeString().split(' ')[0]
    setHorsePools(prev => ({
      ...prev,
      [horseObj.id]: (prev[horseObj.id] || 0) + amount,
      [horseObj.number]: (prev[horseObj.number] || 0) + amount
    }))
    setTotalUsersCount(u => u + 1)
    setRunningBets(prev => [{
      id: Date.now(),
      time: now,
      user: 'AdminConsole',
      avatar: '⚡',
      horseNum: horseObj.number,
      horseName: horseObj.name,
      amount,
      potentialWin: Math.round(amount * (horseObj.odds || 3.0))
    }, ...prev.slice(0, 11)])
    sound.playCash()
    setActionNotice(`+ ₹${amount.toLocaleString()} injected into #${horseObj.number} ${horseObj.name}`)
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
              <p className="text-[11px] md:text-xs font-bold text-amber-400 tracking-widest uppercase">
                Horse Racing Live (12 Runners)
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
                {racePhase}
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
              className={`p-2 rounded-xl border flex items-center gap-1 text-xs font-bold ${
                socketStatus?.connected
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              }`}
              title={`Socket.IO: ${socketStatus?.status || 'connecting'}`}
            >
              {socketStatus?.connected ? <Wifi size={16} /> : <WifiOff size={16} />}
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
      {/* 2. ALL-IN-ONE ADMIN CONTROL HUB (12 Runners Winner Picker)   */}
      {/* ============================================================ */}
      {showControlDrawer && (
        <div className="bg-gradient-to-r from-[#111827] via-[#0f172a] to-[#1e1b4b] border border-amber-500/40 rounded-2xl p-4 shadow-2xl relative overflow-hidden space-y-3">
          
          {/* Row 1: Guaranteed Winner Picker across all 12 Horses */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Crown size={14} /> Guaranteed Winner:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {horses.map((h) => {
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
                })}
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

          {/* Row 2: Flow controls & Simulator toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setRacePhase('BETTING')
                  setTimerSeconds(30)
                  emit('admin:start_betting', { raceNumber })
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  racePhase === 'BETTING'
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Betting Window (30s)
              </button>

              <button
                type="button"
                onClick={() => {
                  setRacePhase('RUNNING')
                  setTimerSeconds(20)
                  emit('admin:start_race', { raceNumber })
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  racePhase === 'RUNNING'
                    ? 'bg-blue-600 text-white border-blue-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Start Race
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleInjectBet(scheduledWinnerId || 1, 1000)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1"
                title="Inject ₹1,000 bet to selected horse"
              >
                <Plus size={14} /> +₹1,000 Bet (Winner #{scheduledWinnerId})
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
                {autoSimulate ? '● Simulator ON' : '○ Live Socket Only'}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* 3. CINEMATIC 12-HORSE RUNNING TRACK ARENA                    */}
      {/* ============================================================ */}
      <div className="relative w-full h-[360px] md:h-[480px] rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-[#1c381c]">
        
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
          <div className="text-[9px] font-bold text-slate-300">12 RUNNERS GRAND ARENA</div>
        </div>

        {/* 12 Race Lanes */}
        <div className="absolute inset-0 flex flex-col justify-evenly py-1 px-4 md:px-6 z-10 overflow-y-auto">
          {horses.map((horse) => {
            const position = horsePositions[horse.id] || horsePositions[horse.number] || 10
            const isWinnerHorse = scheduledWinnerId === horse.id || scheduledWinnerId === horse.number

            return (
              <div key={horse.id} className="relative w-full h-7 md:h-8 border-b border-white/10 flex items-center">
                
                {/* Lane Railing Marker */}
                <div className="absolute left-0 text-[9px] md:text-[10px] font-black text-white/50 font-mono">
                  L{horse.number}
                </div>

                {/* Animated Horse Runner on the Track */}
                <div
                  className="absolute transition-all duration-150 ease-linear flex items-center gap-1.5 group cursor-pointer"
                  style={{ left: `${Math.min(Math.max(position, 2), 92)}%` }}
                  onClick={() => handleSelectWinner(horse.id)}
                >
                  {/* Floating Runner Tag */}
                  <div
                    style={{ backgroundColor: horse.color }}
                    className="flex items-center gap-1 text-white text-[9px] md:text-[11px] font-black px-1.5 py-0.5 rounded shadow-lg border border-white/40 whitespace-nowrap animate-pulse"
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
          })}
        </div>

      </div>

      {/* ============================================================ */}
      {/* 4. ALL 12 HORSES ODDS CARDS GRID (Responsive 6x2 / 4x3)       */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {horses.map((horse) => {
          const sharePercent = horsePercentages[horse.id] || 8
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
                      e.target.src = DEFAULT_12_HORSES[0].avatar
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

      {/* ============================================================ */}
      {/* 5. THREE-COLUMN STATS: LIVE BETS, 12-HORSE POOL, RECENT FEED */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* COLUMN 1: LIVE BETS (Running Table) - 5 Cols */}
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
            <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
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
                  {runningBets.slice(0, 15).map((bet, idx) => {
                    const hInfo = horses.find(h => h.number === bet.horseNum || h.id === bet.horseNum) || horses[0]
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
            </div>
          </div>
        </div>

        {/* COLUMN 2: TOTAL BETS ON EACH OF THE 12 HORSES - 4 Cols */}
        <div className="lg:col-span-4 bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-xs md:text-sm font-extrabold text-white mb-3 tracking-wide flex items-center justify-between">
              <span>TOTAL BETS ON EACH HORSE</span>
              <span className="text-[10px] text-amber-400 font-mono">12 Runners</span>
            </h2>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {horses.map((h) => {
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
              })}
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
              {recentBets.map((rb) => {
                const hInfo = horses.find(h => h.number === rb.horseNum || h.id === rb.horseNum) || horses[0]
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
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 6. BOTTOM RACE PROGRESS BAR (With All 12 Mini Runners)       */}
      {/* ============================================================ */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-4">
          
          <div className="flex items-center gap-2 font-black text-xs md:text-sm text-white tracking-wider whitespace-nowrap">
            <span>🏁 RACE PROGRESS (12 RUNNERS)</span>
          </div>

          <div className="relative flex-1 w-full flex flex-col justify-center py-2">
            
            {/* The Track Line */}
            <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-visible border border-slate-700">
              
              {/* Green Progress Fill */}
              <div
                style={{ width: `${raceProgress}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-lime-400 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-all duration-300"
              />

              {/* All 12 Mini Running Horses galloping across progress line */}
              {horses.map((h) => {
                const miniPos = horsePositions[h.id] || horsePositions[h.number] || 10
                return (
                  <div
                    key={h.id}
                    className="absolute -top-3.5 transition-all duration-200 ease-linear transform -translate-x-1/2"
                    style={{ left: `${miniPos}%` }}
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
              <span className="text-amber-400 font-bold">1200m Finish</span>
            </div>

          </div>

        </div>
      </div>

    </div>
  )
}
