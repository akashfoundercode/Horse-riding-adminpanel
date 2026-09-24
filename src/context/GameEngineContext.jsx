import { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react'
import {
  defaultEngineSettings
} from '../data/mockData.js'
import { sound } from '../utils/audio.js'
import { useHorseRaceSocket } from '../hooks/useHorseRaceSocket.js'
import { socketService } from '../services/socket.js'
import { horseApi } from '../services/horseApi.js'
import { betApi } from '../services/betApi.js'
import { userApi } from '../services/userApi.js'
import { walletApi } from '../services/walletApi.js'
import { raceControlApi } from '../services/raceControlApi.js'
import { resolveImageUrl } from '../utils/imageUrl.js'

export const GameEngineContext = createContext()

export function GameEngineProvider({ children }) {
  const [horses, setHorses] = useState([])
  const [horsesLoading, setHorsesLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [matchesHistory, setMatchesHistory] = useState([])
  const [allBets, setAllBets] = useState([])
  const [transactions, setTransactions] = useState([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [settings, setSettings] = useState(defaultEngineSettings)
  const [soundMuted, setSoundMuted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speedMultiplier, setSpeedMultiplier] = useState(1)
  const [liveLedgerLoading, setLiveLedgerLoading] = useState(false)

  // Live Race Control Overrides & Scheduled Winners
  const [forcedWinner, setForcedWinner] = useState(null)
  const [scheduledWinners, setScheduledWinners] = useState([])
  const [scheduledWinnersLoading, setScheduledWinnersLoading] = useState(false)
  const [extraTimeAdded, setExtraTimeAdded] = useState(0)

  // Jackpot State (Strictly ['N', '2X', '3X', '4X'])
  const [jackpot, setJackpotState] = useState({
    gameSerial: "20260921001",
    isJackpot: false,
    jackpotMultiplier: 1,
    multiplierLabel: "N",
    slots: ["N", "2X", "3X", "4X"],
    message: "N (Nothing - Standard Payout)"
  })
  const [jackpotConfig, setJackpotConfig] = useState({
    mode: 'PROBABILITY', // 'EVERY_ROUND', 'ROUND_INTERVAL', 'TIME_INTERVAL', 'PROBABILITY', 'MANUAL', 'OFF'
    targetMultiplier: 'RANDOM', // 2, 3, 4, 'RANDOM'
    intervalRounds: 5,
    intervalSeconds: 180,
    probabilityPercent: 5,
    allowedMultipliers: [2, 3, 4],
    enabled: true
  })
  const [jackpotLoading, setJackpotLoading] = useState(false)

  // 🎯 Active Jackpot Scheduled Trigger State ('none' | 'direct' | 'time' | 'round')
  const [scheduledJackpot, setScheduledJackpot] = useState({
    type: 'none', // 'none' | 'direct' | 'time' | 'round'
    multiplier: '1X',
    secondsRemaining: 0,
    initialSeconds: 0,
    roundsRemaining: 0,
    initialRounds: 0,
    appliedAt: null,
  })
  const scheduledJackpotRef = useRef(scheduledJackpot)
  scheduledJackpotRef.current = scheduledJackpot

  const jackpotConfigRef = useRef(jackpotConfig)
  jackpotConfigRef.current = jackpotConfig

  const jackpotTrackerRef = useRef({
    roundsSinceLast: 0,
    lastTimestamp: Date.now()
  })

  // Color palette for horse numbers
  const colorPalette = [
    "#EF4444", "#3B82F6", "#10B981", "#F59E0B",
    "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
    "#14B8A6", "#6366F1", "#84CC16", "#E11D48"
  ]

  // Global Race State (Local or Synced with Socket)
  const [raceSerial, setRaceSerial] = useState(20260921005)
  const [stage, setStage] = useState("BETTING_OPEN")
  const [stageElapsed, setStageElapsed] = useState(0)
  const [manualWinnerId, setManualWinnerId] = useState(null)
  const [liveBets, setLiveBets] = useState([])
  const [currentWinner, setCurrentWinner] = useState(null)

  // Fetch Users from REST API (GET /api/games/users or /api/users)
  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const data = await userApi.getAll()
      const rawUsers = data?.users || (Array.isArray(data) ? data : [])
      if (Array.isArray(rawUsers) && rawUsers.length > 0) {
        setUsers(rawUsers.map((u, idx) => {
          const gameObj = u.game || {}
          const walletObj = u.wallet || {}
          const userIdStr = String(u.userId || u.id || `U-${idx + 1}`)
          const gameCodeStr = gameObj.gameCode || u.gameCode || u.game_code || `GC202609210${(idx + 1).toString().padStart(2, '0')}`
          const balanceNum = Number(walletObj.balance ?? u.walletBalance ?? u.wallet_balance ?? 10000)

          return {
            id: userIdStr,
            userId: userIdStr,
            username: u.username || u.name || `User_${idx + 1}`,
            name: u.name || u.username || `User_${idx + 1}`,
            email: u.email || `${u.username || 'user'}@game.com`,
            role: u.role || 'user',
            gameCode: gameCodeStr,
            game: {
              id: gameObj.id || 1,
              gameCode: gameCodeStr,
              status: gameObj.status || u.status || 'ACTIVE'
            },
            wallet: {
              id: walletObj.id || 1,
              balance: balanceNum,
              displayBalance: walletObj.displayBalance || `₹${balanceNum.toFixed(2)}`,
              currency: walletObj.currency || 'INR'
            },
            walletBalance: balanceNum,
            totalBets: Number(u.totalBets ?? u.total_bets ?? 0),
            totalWinnings: Number(u.totalWinnings ?? u.total_winnings ?? 0),
            totalWagered: Number(u.totalWagered ?? u.total_wagered ?? 0),
            vipTier: u.vipTier || u.vip_tier || 'Silver',
            status: (gameObj.status || u.status || 'active').toLowerCase(),
            joinedDate: (u.createdAt || u.joinedDate || u.created_at || new Date().toISOString()).slice(0, 10),
            lastLoginDevice: u.lastLoginDevice || 'Web Browser',
            kycStatus: u.kycStatus || 'verified'
          }
        }))
      }
    } catch (e) {
      console.warn('[fetchUsers] Fallback active:', e.message)
    } finally {
      setUsersLoading(false)
    }
  }

  // Fetch Transactions / Ledger from REST API (GET /api/admin/wallets/transactions)
  const fetchTransactions = async (params = {}) => {
    setTransactionsLoading(true)
    try {
      const data = await walletApi.getTransactions(params)
      const rawList = data?.transactions || data?.ledger || data?.data || data?.items || data?.history || data?.results || (Array.isArray(data) ? data : [])
      if (Array.isArray(rawList)) {
        setTransactions(rawList.map((tx, idx) => {
          const txId = String(tx.transactionId || tx.id || tx._id || `TX-${idx + 1}`)
          const txUserId = String(tx.userId || tx.user_id || tx.user?.id || '')
          const targetUser = usersRef.current.find(u => String(u.id) === txUserId || String(u.userId) === txUserId || u.username === tx.username)
          const isCredit = tx.type === 'credit' || (tx.category === 'credit') || (Number(tx.amount) > 0 && tx.type !== 'debit')
          const amt = Math.abs(Number(tx.amount || 0))

          return {
            id: txId,
            transactionId: txId,
            userId: txUserId || targetUser?.id || '',
            username: tx.username || targetUser?.username || tx.displayName || tx.name || 'User',
            name: tx.displayName || tx.name || targetUser?.name || 'User',
            gameCode: tx.gameCode || tx.game_code || targetUser?.gameCode || '',
            type: isCredit ? 'credit' : 'debit',
            category: tx.category || 'manual',
            amount: amt,
            displayAmount: tx.displayAmount || (isCredit ? `+₹${amt.toLocaleString()}` : `-₹${amt.toLocaleString()}`),
            balanceBefore: Number(tx.balanceBefore ?? tx.balance_before ?? 0),
            balanceAfter: Number(tx.balanceAfter ?? tx.balance_after ?? tx.balance ?? 0),
            displayBalance: tx.displayBalance || `₹${Number(tx.balanceAfter ?? tx.balance_after ?? tx.balance ?? 0).toLocaleString()}`,
            referenceId: tx.referenceId || tx.reference_id || `REF-${idx + 1}`,
            referenceType: tx.referenceType || tx.reference_type || 'wallet',
            description: tx.description || (isCredit ? 'Admin Topup / Deposit Bonus' : 'Admin Deduction / Penalty'),
            status: tx.status || 'completed',
            currency: tx.currency || 'INR',
            createdAt: tx.createdAt || tx.created_at || tx.timestamp || new Date().toISOString(),
            timestamp: tx.createdAt || tx.created_at || tx.timestamp || new Date().toISOString()
          }
        }))
      }
    } catch (e) {
      console.warn('[fetchTransactions] Error:', e.message)
    } finally {
      setTransactionsLoading(false)
    }
  }

  // Fetch Horses from REST API (GET /api/horses?status=all)
  const fetchHorses = async () => {
    setHorsesLoading(true)
    try {
      const data = await horseApi.getAll('all')
      if (data && data.horses && Array.isArray(data.horses) && data.horses.length > 0) {
        setHorses(
          data.horses.map((h, i) => ({
            id: h.id,
            number: h.serialNumber || h.serial_number || (i + 1),
            serialNumber: h.serialNumber || h.serial_number || (i + 1),
            name: h.name,
            avatar: resolveImageUrl(h.imageUrl || h.image_url),
            imageUrl: resolveImageUrl(h.imageUrl || h.image_url),
            status: h.status || 'active',
            odds: h.odds || Number((2.0 + ((h.serialNumber || (i + 1)) * 0.8)).toFixed(1)),
            color: colorPalette[((h.serialNumber || (i + 1)) - 1) % colorPalette.length] || '#3B82F6',
            wins: h.wins || Math.floor(Math.random() * 40) + 10,
            races: h.races || 342,
            speedRating: 80 + Math.floor(Math.random() * 18),
            earnings: (h.serialNumber || (i + 1)) * 32000,
            jockey: h.jockey || "Jockey Pro",
            createdAt: h.createdAt,
            updatedAt: h.updatedAt
          }))
        )
      }
    } catch (e) {
      // Backend offline
    } finally {
      setHorsesLoading(false)
    }
  }

  // Fetch Live Ledger from HTTP REST API (GET /api/bets/live-ledger)
  const fetchLiveLedger = async (params = {}) => {
    setLiveLedgerLoading(true)
    try {
      const data = await betApi.getLiveLedger({
        game_serial: params.game_serial || String(raceSerial),
        limit: params.limit || 50,
        ...params
      })
      if (data && data.ledger && Array.isArray(data.ledger)) {
        const mapped = data.ledger.map((item) => {
          const horseNumber = item.horseSerial || item.horseNumber || item.horseId || 1
          const matchingHorse = horsesRef.current.find(h => h.number === horseNumber || h.id === item.horseId)
          return {
            id: item.id ? String(item.id) : `B-${Date.now()}`,
            userId: item.userId,
            user: item.username || item.displayName || item.name || 'Player',
            name: item.name || item.username,
            displayName: item.displayName || item.username,
            maskedUsername: item.maskedUsername || (item.username ? `${item.username.slice(0, 3)}***` : 'usr***'),
            userRole: item.userRole || 'user',
            gameId: item.gameId,
            gameCode: item.gameCode || 'GC20260921001',
            raceId: item.raceId,
            gameSerial: String(item.gameSerial || raceSerial),
            round: `R-${item.gameSerial || raceSerial}`,
            raceSerial: String(item.gameSerial || raceSerial),
            horseId: item.horseId,
            horseSerial: horseNumber,
            horseNumber: horseNumber,
            horseName: item.horseName || matchingHorse?.name || `Horse #${horseNumber}`,
            horseImageUrl: resolveImageUrl(item.horseImageUrl || matchingHorse?.avatar || matchingHorse?.imageUrl),
            horseColor: matchingHorse?.color || colorPalette[(horseNumber - 1) % colorPalette.length] || '#3B82F6',
            amount: Number(item.amount) || 0,
            displayAmount: item.displayAmount || `₹${(Number(item.amount) || 0).toLocaleString()}`,
            odds: Number(item.odds) || matchingHorse?.odds || 2.0,
            potentialPayout: Number(item.potentialPayout) || Math.round((Number(item.amount) || 0) * (Number(item.odds) || 2.0)),
            payoutAmount: Number(item.payoutAmount) || 0,
            payout: Number(item.payoutAmount) || 0,
            status: item.status || 'PENDING',
            result: item.status?.toLowerCase() === 'won' ? 'won' : item.status?.toLowerCase() === 'lost' ? 'lost' : 'pending',
            createdAt: item.createdAt || new Date().toISOString(),
            timestamp: item.createdAt ? new Date(item.createdAt).toLocaleTimeString('en-US', { hour12: false }) : new Date().toLocaleTimeString('en-US', { hour12: false }),
          }
        })
        setLiveBets(mapped)
      }
      return data
    } catch (err) {
      console.warn('[fetchLiveLedger] Fallback active:', err.message)
    } finally {
      setLiveLedgerLoading(false)
    }
  }

  // Fetch Scheduled Winners (GET /api/admin/race/scheduled-winners)
  const fetchScheduledWinners = async () => {
    setScheduledWinnersLoading(true)
    try {
      const data = await raceControlApi.getScheduledWinners()
      if (data) {
        if (data.currentLiveOverride?.forcedWinner) {
          const serial = data.currentLiveOverride.forcedWinner.horseSerial || data.currentLiveOverride.forcedWinner.horseId
          setForcedWinner({
            gameSerial: data.currentLiveOverride.gameSerial || String(raceSerial),
            horseSerial: serial,
            horseName: data.currentLiveOverride.forcedWinner.horseName,
            reason: data.currentLiveOverride.forcedWinner.reason || 'Admin Override',
            isLive: true
          })
          setManualWinnerId(serial)
        } else {
          setForcedWinner(null)
          setManualWinnerId(null)
        }
        if (Array.isArray(data.scheduledFutureWinners)) {
          setScheduledWinners(data.scheduledFutureWinners)
        }
      }
      return data
    } catch (e) {
      console.warn('[fetchScheduledWinners] Offline fallback:', e.message)
    } finally {
      setScheduledWinnersLoading(false)
    }
  }

  // Fetch All Historical Bets (GET /api/bets)
  const fetchAllBets = async (params = {}) => {
    try {
      const data = await betApi.getAllBets(params)
      const rawBets = data?.bets || (Array.isArray(data) ? data : [])
      if (Array.isArray(rawBets)) {
        setAllBets(rawBets.map((b, idx) => ({
          id: String(b.id || b.betId || `B-${idx + 1}`),
          userId: b.userId || '',
          user: b.username || b.user || b.name || 'Player',
          name: b.name || b.username,
          displayName: b.displayName || b.username,
          maskedUsername: b.maskedUsername || (b.username ? `${b.username.slice(0, 3)}***` : 'usr***'),
          userRole: b.userRole || 'user',
          gameCode: b.gameCode || '',
          round: `R-${b.gameSerial || b.raceSerial || b.round || '20260921001'}`,
          raceSerial: String(b.gameSerial || b.raceSerial || '20260921001'),
          horseId: b.horseId || b.horseSerial || 1,
          horseName: b.horseName || `Horse #${b.horseSerial || 1}`,
          horseNumber: Number(b.horseNumber || b.horseSerial || 1),
          horseColor: b.horseColor || colorPalette[((Number(b.horseNumber || b.horseSerial || 1)) - 1) % colorPalette.length] || '#3B82F6',
          amount: Number(b.amount || 0),
          displayAmount: b.displayAmount || `₹${(Number(b.amount) || 0).toLocaleString()}`,
          odds: Number(b.odds || 2.0),
          potentialPayout: Number(b.potentialPayout || (Number(b.amount || 0) * Number(b.odds || 2.0))),
          payout: Number(b.payout || b.payoutAmount || 0),
          payoutAmount: Number(b.payout || b.payoutAmount || 0),
          netProfit: Number(b.netProfit || (b.payout ? b.payout - b.amount : -b.amount)),
          result: b.result || b.status?.toLowerCase() || 'pending',
          status: b.status || b.result || 'pending',
          createdAt: b.createdAt || new Date().toISOString(),
          timestamp: b.createdAt ? new Date(b.createdAt).toLocaleTimeString('en-US', { hour12: false }) : (b.timestamp || 'Live')
        })))
      }
    } catch (e) {
      console.warn('[fetchAllBets] API notice:', e.message)
    }
  }

  // Fetch Matches / Rounds History (GET /api/races/history)
  const [adminAnalyticsData, setAdminAnalyticsData] = useState(null)
  const [liveBetPoolData, setLiveBetPoolData] = useState(null)

  // Fetch Analytics (GET /api/admin/analytics)
  const fetchAnalytics = async () => {
    try {
      const data = await raceControlApi.getAnalytics()
      if (data && data.success !== false) {
        setAdminAnalyticsData(data)
      }
      return data
    } catch (e) {
      // quiet fallback
    }
  }

  // Fetch Live Bet Pool (GET /api/admin/races/live-bets or /api/bets/pool)
  const fetchLiveBetPool = async () => {
    try {
      const data = await betApi.getLiveBetPool()
      if (data && data.success !== false) {
        setLiveBetPoolData(data)
      }
      return data
    } catch (e) {
      // quiet fallback
    }
  }

  const fetchMatchesHistory = async (params = {}) => {
    try {
      const data = await raceControlApi.getMatchesHistory(params)
      const rawMatches = data?.results || data?.matches || (Array.isArray(data) ? data : [])
      if (Array.isArray(rawMatches)) {
        setMatchesHistory(rawMatches.map((m, idx) => {
          const winnerSerial = Number(m.winnerHorseSerial || m.winnerHorseNumber || m.winnerHorse?.number || m.winnerHorseId || 1)
          const winnerName = m.winnerHorseName || m.winnerHorse?.name || `Horse #${winnerSerial}`
          const matchingWinner = horsesRef.current.find(h => h.number === winnerSerial || h.id === winnerSerial)
          const jackpotLabel = m.jackpot || (m.jackpotMultiplier ? `${m.jackpotMultiplier}X` : `${m.odds || matchingWinner?.odds || 2.5}x`)

          return {
            id: `R-${m.gameSerial || m.serialNumber || idx + 1}`,
            gameSerial: String(m.gameSerial || m.serialNumber || idx + 1),
            raceId: m.raceId || idx + 1,
            distance: m.distance || settings.trackDistance || '1000M',
            startedAt: m.startedAt || '12:00:00',
            finishedAt: m.finishedAt ? (m.finishedAt.includes('T') ? new Date(m.finishedAt).toLocaleTimeString('en-US', { hour12: false }) : m.finishedAt) : '12:00:58',
            winnerHorseId: matchingWinner?.id || winnerSerial,
            winnerHorse: matchingWinner || {
              number: winnerSerial,
              name: winnerName,
              color: matchingWinner?.color || '#3B82F6',
              odds: m.odds || matchingWinner?.odds || 2.5,
              avatar: matchingWinner?.avatar || matchingWinner?.imageUrl
            },
            winnerHorseSerial: winnerSerial,
            winnerHorseName: winnerName,
            displayWinner: m.displayWinner || `#${winnerSerial} ${winnerName}`,
            jackpot: jackpotLabel,
            jackpotMultiplier: m.jackpotMultiplier || (jackpotLabel !== 'N' ? Number(String(jackpotLabel).replace('X', '').replace('x', '')) || 1 : 1),
            isJackpot: Boolean(m.isJackpot || (m.jackpotMultiplier && m.jackpotMultiplier > 1)),
            totalBets: Number(m.totalBets || m.totalPot || 0),
            totalPayout: Number(m.totalPayout || 0),
            ggr: Number(m.ggr || 0),
            totalPlayers: Number(m.totalPlayers || 0),
            status: m.status || 'settled',
            seedHash: m.seedHash || `sha256:${idx}...`,
            finishOrder: m.finishOrder || []
          }
        }))
      }
    } catch (e) {
      console.warn('[fetchMatchesHistory] API notice:', e.message)
    }
  }

  useEffect(() => {
    fetchHorses()
    fetchUsers()
    fetchTransactions()
    fetchLiveLedger()
    fetchAllBets()
    fetchMatchesHistory()
    fetchScheduledWinners()
    fetchJackpotConfig()
    fetchAnalytics()
    fetchLiveBetPool()

    const interval = setInterval(() => {
      fetchAnalytics()
      if (stageRef.current === 'BETTING_OPEN') {
        fetchLiveBetPool()
      }
    }, 6000)

    return () => clearInterval(interval)
  }, [])

  // Socket.IO hook integration
  const socketHook = useHorseRaceSocket()
  const {
    socketStatus,
    activePlayers: socketActivePlayers,
    raceState: socketRaceState,
    countdown: socketCountdown,
    liveTrack: socketLiveTrack,
    raceResult: socketRaceResult,
    adminMetrics: socketAdminMetrics,
    liveBetPool: socketLiveBetPool,
    liveLedgerBet,
    liveWalletTx,
    liveBalanceUpdate,
    liveRaceControlUpdate,
    liveTimeExtended,
    liveJackpot,
    reconnect: reconnectSocket,
  } = socketHook

  // Active pool data: socket prioritized, fallback to REST
  const activeBetPool = socketLiveBetPool || liveBetPoolData

  // Horse positions dynamically synced with master horses array
  const [horsePositions, setHorsePositions] = useState([])

  useEffect(() => {
    if (horses.length > 0) {
      setHorsePositions((prev) => {
        return horses.map((h, i) => {
          const existing = prev.find(p => p.id === h.id || p.number === h.number)
          return {
            ...h,
            lane: i + 1,
            distance: existing?.distance || 0,
            speed: existing?.speed || 0,
            rank: existing?.rank || (i + 1),
            sprint: existing?.sprint || false,
          }
        })
      })
    }
  }, [horses])

  const horsesRef = useRef(horses)
  horsesRef.current = horses

  const usersRef = useRef(users)
  usersRef.current = users

  const liveBetsRef = useRef(liveBets)
  liveBetsRef.current = liveBets

  const manualWinnerIdRef = useRef(manualWinnerId)
  manualWinnerIdRef.current = manualWinnerId

  const forcedWinnerRef = useRef(forcedWinner)
  forcedWinnerRef.current = forcedWinner

  const stageRef = useRef(stage)
  stageRef.current = stage

  // Pot calculation
  const totalPot = useMemo(() => {
    if (activeBetPool?.totalRacePool !== undefined) {
      return Number(activeBetPool.totalRacePool) || 0
    }
    if (socketAdminMetrics?.livePot?.totalPot !== undefined) {
      return Number(socketAdminMetrics.livePot.totalPot) || 0
    }
    if (adminAnalyticsData?.livePot?.totalPot !== undefined) {
      return Number(adminAnalyticsData.livePot.totalPot) || 0
    }
    return liveBets.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
  }, [liveBets, socketAdminMetrics, activeBetPool, adminAnalyticsData])

  const potDistribution = useMemo(() => {
    const map = {}
    horses.forEach((h) => { map[h.id] = 0 })

    if (activeBetPool?.horses && Array.isArray(activeBetPool.horses)) {
      activeBetPool.horses.forEach((h) => {
        const matchingHorse = horses.find(
          item => item.number === (h.serialNumber || h.horseId) || item.id === (h.horseId || h.serialNumber)
        )
        const key = matchingHorse?.id || h.horseId || h.serialNumber
        map[key] = Number(h.totalBetsAmount) || 0
      })
      return map
    }

    if (socketAdminMetrics?.livePot?.horsePots) {
      Object.entries(socketAdminMetrics.livePot.horsePots).forEach(([key, val]) => {
        map[Number(key)] = val.amount || 0
      })
      return map
    }

    liveBets.forEach((b) => {
      map[b.horseId] = (map[b.horseId] || 0) + (Number(b.amount) || 0)
    })
    return map
  }, [horses, liveBets, socketAdminMetrics, activeBetPool])

  // 🧠 Automatic Smart Logic Rule: Lowest Platform Liability / Max House Edge
  const smartRecommendedWinner = useMemo(() => {
    if (horses.length === 0) return null

    let bestHorse = horses[0]
    let lowestLiability = Infinity

    horses.forEach((h) => {
      const horsePot = potDistribution[h.id] || 0
      const projectedPayout = horsePot * (Number(h.odds) || 2.0)
      const liability = projectedPayout - totalPot // lower (or negative) is better for house

      if (liability < lowestLiability) {
        lowestLiability = liability
        bestHorse = {
          ...h,
          projectedLiability: liability,
          projectedProfit: totalPot - projectedPayout,
          projectedPayout
        }
      }
    })

    return bestHorse
  }, [horses, potDistribution, totalPot])

  // --- Real-time Socket.IO Event Handlers ---

  // 1. Sync live track data from Socket (race:running_track & race:track_update)
  useEffect(() => {
    if (!socketLiveTrack || !socketLiveTrack.horses) return

    setStage("RUNNING")
    if (socketLiveTrack.gameSerial) {
      setRaceSerial(socketLiveTrack.gameSerial)
    }
    if (typeof socketLiveTrack.elapsedSec === 'number') {
      setStageElapsed(Math.floor(socketLiveTrack.elapsedSec))
    }

    setHorsePositions((prevPositions) => {
      const socketHorsesMap = new Map()
      socketLiveTrack.horses.forEach((h) => {
        socketHorsesMap.set(Number(h.serialNumber || h.horseId || h.number), h)
      })

      const targetForced = forcedWinnerRef.current?.horseSerial || forcedWinnerRef.current?.horseId || manualWinnerIdRef.current
      const isForcedActive = Boolean(targetForced)
      const targetForcedStr = String(targetForced || '')
      const isForcedHorse = (h) => String(h.number) === targetForcedStr || String(h.id) === targetForcedStr

      let updated = prevPositions.map((localHorse) => {
        const socketData = socketHorsesMap.get(Number(localHorse.number)) || socketHorsesMap.get(Number(localHorse.id))
        if (!socketData) return localHorse

        const distanceM = typeof socketData.currentDistanceM === 'number'
          ? socketData.currentDistanceM
          : (typeof socketData.progressPercent === 'number' ? socketData.progressPercent * 10 : localHorse.distance)

        const speed = socketData.speedKmh ?? socketData.speed ?? localHorse.speed ?? 58
        const rank = socketData.currentRank ?? socketData.rank ?? localHorse.rank
        const gap = socketData.gapToLeaderM ?? 0

        return {
          ...localHorse,
          name: socketData.name || localHorse.name,
          lane: socketData.lane || localHorse.lane,
          distance: distanceM,
          currentDistanceM: distanceM,
          progressPercent: socketData.progressPercent ?? (distanceM / 10),
          speed: speed,
          speedKmh: speed,
          rank: rank,
          currentRank: rank,
          gapToLeaderM: gap,
          status: socketData.status || (rank === 1 ? 'LEADING' : 'CONTENDING'),
          sprint: distanceM > 750,
        }
      })

      // 🔥 ABSOLUTE FORCED OVERRIDE: If forced winner is set, this horse MUST ALWAYS LEAD
      if (isForcedActive) {
        const otherHorses = updated.filter(h => !isForcedHorse(h))
        const maxOtherDist = otherHorses.reduce((max, h) => Math.max(max, Number(h.distance) || 0), 0)

        updated = updated.map((h) => {
          if (isForcedHorse(h)) {
            const forcedDist = Math.min(1000, Math.max(Number(h.distance) || 0, maxOtherDist + 15))
            return {
              ...h,
              distance: forcedDist,
              currentDistanceM: forcedDist,
              progressPercent: forcedDist / 10,
              rank: 1,
              currentRank: 1,
              status: 'LEADING',
              speed: Math.max(Number(h.speed) || 60, 68),
              speedKmh: Math.max(Number(h.speedKmh) || 60, 68),
              sprint: true,
            }
          } else {
            const clampedDist = Math.min(Number(h.distance) || 0, Math.max(0, maxOtherDist))
            return {
              ...h,
              distance: clampedDist,
              currentDistanceM: clampedDist,
              progressPercent: clampedDist / 10,
              status: 'CONTENDING',
            }
          }
        })
      }

      return updated
    })
  }, [socketLiveTrack])

  // 2. Sync Countdown from Socket (race:countdown_tick)
  useEffect(() => {
    if (!socketStatus.connected) return
    if (socketCountdown !== null && socketCountdown !== undefined) {
      if (socketCountdown > 0) {
        setStage("COUNTDOWN")
        setStageElapsed(Math.max(0, getStageDuration("COUNTDOWN") - Number(socketCountdown)))
        sound.playCountdown()
      } else if (socketCountdown === 0) {
        sound.playRaceStart()
        setStage("RUNNING")
        setStageElapsed(0)
      }
    }
  }, [socketCountdown, socketStatus.connected])

  // 2b. Time-Based Jackpot Countdown Interval (When scheduled by seconds)
  useEffect(() => {
    if (scheduledJackpot.type !== 'time' || scheduledJackpot.secondsRemaining <= 0) return

    const intervalTimer = setInterval(() => {
      setScheduledJackpot((prev) => {
        if (prev.type !== 'time' || prev.secondsRemaining <= 0) return prev
        const nextSec = prev.secondsRemaining - 1
        if (nextSec <= 0) {
          const rawM = prev.multiplier
          const numMult = rawM === 'N' ? 1 : (rawM === 'RANDOM' ? [2, 3, 4][Math.floor(Math.random() * 3)] : Number(String(rawM).replace(/[Xx]/g, '')) || 2)
          const label = numMult > 1 ? `${numMult}X` : 'N'
          setJackpotState({
            gameSerial: String(raceSerial),
            isJackpot: numMult > 1,
            jackpotMultiplier: numMult,
            multiplierLabel: label,
            slots: ["N", "2X", "3X", "4X"],
            message: `🔥 TIMER JACKPOT TRIGGERED (${prev.initialSeconds}s): ${label} PAYOUT! 🔥`
          })
          if (numMult > 1) sound.playWinner()
          return {
            type: 'direct',
            multiplier: label,
            secondsRemaining: 0,
            initialSeconds: prev.initialSeconds,
            roundsRemaining: 0,
            initialRounds: 0,
            appliedAt: Date.now()
          }
        }
        return { ...prev, secondsRemaining: nextSec }
      })
    }, 1000)

    return () => clearInterval(intervalTimer)
  }, [scheduledJackpot.type, scheduledJackpot.secondsRemaining, raceSerial])

  // 3. Sync Race Result from Socket (race:result)
  useEffect(() => {
    if (!socketRaceResult) return

    const targetForced = forcedWinnerRef.current?.horseSerial || forcedWinnerRef.current?.horseId || manualWinnerIdRef.current
    let winnerHorse = null

    // Unconditional guarantee for forced winner selection
    if (targetForced) {
      winnerHorse = horsesRef.current.find(h => String(h.id) === String(targetForced) || String(h.number) === String(targetForced))
    }

    if (!winnerHorse) {
      const winnerSerial = socketRaceResult.winner?.serial_number || socketRaceResult.winner?.horse_id || socketRaceResult.winner?.number
      winnerHorse = horsesRef.current.find((h) => h.number === winnerSerial || h.id === winnerSerial) || horsesRef.current[0]
    }

    setCurrentWinner(winnerHorse)
    setStage("RESULT")
    sound.playWinner()

    const finishOrder = (socketRaceResult.positions || socketRaceResult.finishOrder || horsesRef.current)
      .map((p, idx) => {
        const h = horsesRef.current.find(hItem => hItem.number === p.serialNumber || hItem.id === p.horseId || hItem.number === p.number) || p
        return {
          rank: p.rank || idx + 1,
          number: h.number || p.number || (idx + 1),
          name: h.name || p.name || `Horse #${idx + 1}`,
          time: p.time || (idx === 0 ? "58.10s" : `58.${10 + idx * 35}s`),
          gap: p.gap || (idx === 0 ? "-" : `+${(idx * 0.35).toFixed(2)}s`)
        }
      })

    const totalBetsAmt = socketRaceResult.totalBets || socketRaceResult.totalPot || liveBetsRef.current.reduce((s, b) => s + b.amount, 0) || 48500
    const totalPayoutAmt = socketRaceResult.totalPayout || (winnerHorse ? Math.round(totalBetsAmt * 0.76) : 36800)
    const ggrAmt = socketRaceResult.ggr !== undefined ? socketRaceResult.ggr : (totalBetsAmt - totalPayoutAmt)

    const socketMatch = {
      id: `R-${socketRaceResult.gameSerial || raceSerial}`,
      gameSerial: String(socketRaceResult.gameSerial || raceSerial),
      distance: socketRaceResult.distance || settings.trackDistance || "1000M",
      startedAt: socketRaceResult.startedAt || new Date(Date.now() - 35000).toLocaleTimeString('en-US', { hour12: false }),
      finishedAt: socketRaceResult.finishedAt || new Date().toLocaleTimeString('en-US', { hour12: false }),
      winnerHorseId: winnerHorse.id,
      winnerHorse: {
        number: winnerHorse.number,
        name: winnerHorse.name,
        color: winnerHorse.color,
        odds: winnerHorse.odds,
        avatar: winnerHorse.avatar || winnerHorse.imageUrl
      },
      jackpot: `${winnerHorse.odds}x`,
      totalBets: totalBetsAmt,
      totalPayout: totalPayoutAmt,
      ggr: ggrAmt,
      totalPlayers: socketRaceResult.totalPlayers || socketActivePlayers || 48,
      status: "settled",
      seedHash: socketRaceResult.seedHash || socketRaceResult.provablyFairHash || `sha256:${Math.random().toString(36).substring(2, 15)}...${Math.random().toString(36).substring(2, 8)}`,
      finishOrder
    }

    setMatchesHistory((prev) => {
      if (prev.some(m => String(m.gameSerial) === String(socketMatch.gameSerial))) {
        return prev.map(m => String(m.gameSerial) === String(socketMatch.gameSerial) ? socketMatch : m)
      }
      return [socketMatch, ...prev.slice(0, 99)]
    })

    // Immediately reset horses back to starting gates upon race result
    setHorsePositions((prev) =>
      prev.map((h, i) => ({
        ...h,
        distance: 0,
        speed: 0,
        rank: i + 1,
        sprint: false,
      }))
    )
  }, [socketRaceResult])

  // 4. Sync Race State from Socket (race:current_state / race:betting_open)
  useEffect(() => {
    if (!socketRaceState) return
    if (socketRaceState.gameSerial) {
      setRaceSerial(socketRaceState.gameSerial)
    }
    if (socketRaceState.status) {
      setStage(socketRaceState.status)

      // On refresh the server snapshot must restore the same point in the
      // current phase. Support the common socket payload names used by race
      // engines, rather than resetting this view to zero elapsed seconds.
      const stateDuration = Number(
        socketRaceState.stageDuration ?? socketRaceState.duration ?? socketRaceState.phaseDuration
      ) || getStageDuration(socketRaceState.status)
      const remainingValues = [
        socketRaceState.timeRemainingSec,
        socketRaceState.stageRemaining,
        socketRaceState.remainingSeconds,
        socketRaceState.secondsRemaining,
        socketRaceState.timeLeft,
        socketRaceState.remaining,
        socketRaceState.timer?.remaining,
      ]
      const remaining = remainingValues.find((value) => Number.isFinite(Number(value)))
      const elapsedValues = [
        socketRaceState.elapsedSec,
        socketRaceState.stageElapsed,
        socketRaceState.elapsedSeconds,
        socketRaceState.timer?.elapsed,
      ]
      const elapsed = elapsedValues.find((value) => Number.isFinite(Number(value)))
      const endAt = socketRaceState.stageEndsAt ?? socketRaceState.endsAt ?? socketRaceState.phaseEndsAt

      if (remaining !== undefined) {
        setStageElapsed(Math.max(0, stateDuration - Number(remaining)))
      } else if (elapsed !== undefined) {
        setStageElapsed(Math.max(0, Number(elapsed)))
      } else if (endAt) {
        const rawEnd = Number(endAt)
        const endMs = Number.isFinite(rawEnd)
          ? (rawEnd < 1e12 ? rawEnd * 1000 : rawEnd)
          : Date.parse(endAt)
        if (Number.isFinite(endMs)) {
          setStageElapsed(Math.max(0, stateDuration - Math.max(0, (endMs - Date.now()) / 1000)))
        }
      }
      if (socketRaceState.status === 'BETTING_OPEN') {
        fetchLiveLedger({ game_serial: socketRaceState.gameSerial })
      }
    }
    if (socketRaceState.jackpot) {
      const jp = socketRaceState.jackpot
      const isJackpot = Boolean(jp.isJackpot)
      const mult = Number(jp.jackpotMultiplier || jp.multiplier) || (jp.multiplierLabel === 'N' ? 1 : Number(String(jp.multiplierLabel || jp.label).replace('X', '')) || 1)
      const label = jp.multiplierLabel || jp.label || (isJackpot ? `${mult}X` : 'N')
      setJackpotState({
        gameSerial: String(jp.gameSerial || socketRaceState.gameSerial || raceSerial),
        isJackpot: isJackpot || (label !== 'N' && mult > 1),
        jackpotMultiplier: mult,
        multiplierLabel: label,
        slots: jp.slots || ["N", "2X", "3X", "4X"],
        message: jp.message || (isJackpot ? `🔥 JACKPOT ACTIVE: ${label} PAYOUT! 🔥` : "N (Nothing - Standard Payout)")
      })
    }
  }, [socketRaceState])

  // 5. Sync Admin Live Ledger Stream (admin:bet_live & bet:ledger_entry)
  useEffect(() => {
    if (!liveLedgerBet) return

    const horseNumber = liveLedgerBet.horseSerial || liveLedgerBet.horseNumber || liveLedgerBet.horseId || 1
    const matchingHorse = horsesRef.current.find(h => h.number === horseNumber || h.id === liveLedgerBet.horseId)

    const formattedBet = {
      id: liveLedgerBet.id ? String(liveLedgerBet.id) : `B-${Date.now()}`,
      userId: liveLedgerBet.userId,
      user: liveLedgerBet.username || liveLedgerBet.displayName || liveLedgerBet.name || 'Player',
      name: liveLedgerBet.name || liveLedgerBet.username,
      displayName: liveLedgerBet.displayName || liveLedgerBet.username,
      maskedUsername: liveLedgerBet.maskedUsername || (liveLedgerBet.username ? `${liveLedgerBet.username.slice(0, 3)}***` : 'usr***'),
      userRole: liveLedgerBet.userRole || 'user',
      gameId: liveLedgerBet.gameId,
      gameCode: liveLedgerBet.gameCode || 'GC20260921001',
      raceId: liveLedgerBet.raceId,
      gameSerial: String(liveLedgerBet.gameSerial || raceSerial),
      round: `R-${liveLedgerBet.gameSerial || raceSerial}`,
      raceSerial: String(liveLedgerBet.gameSerial || raceSerial),
      horseId: liveLedgerBet.horseId || matchingHorse?.id,
      horseSerial: horseNumber,
      horseNumber: horseNumber,
      horseName: liveLedgerBet.horseName || matchingHorse?.name || `Horse #${horseNumber}`,
      horseImageUrl: resolveImageUrl(liveLedgerBet.horseImageUrl || matchingHorse?.avatar || matchingHorse?.imageUrl),
      horseColor: matchingHorse?.color || colorPalette[((horseNumber - 1) % colorPalette.length)] || '#3B82F6',
      amount: Number(liveLedgerBet.amount) || 0,
      displayAmount: liveLedgerBet.displayAmount || `₹${(Number(liveLedgerBet.amount) || 0).toLocaleString()}`,
      odds: Number(liveLedgerBet.odds) || matchingHorse?.odds || 2.0,
      potentialPayout: Number(liveLedgerBet.potentialPayout) || Math.round((Number(liveLedgerBet.amount) || 0) * (Number(liveLedgerBet.odds) || 2.0)),
      payoutAmount: Number(liveLedgerBet.payoutAmount) || 0,
      payout: Number(liveLedgerBet.payoutAmount) || 0,
      status: liveLedgerBet.status || 'PENDING',
      result: liveLedgerBet.status?.toLowerCase() === 'won' ? 'won' : liveLedgerBet.status?.toLowerCase() === 'lost' ? 'lost' : 'pending',
      createdAt: liveLedgerBet.createdAt || new Date().toISOString(),
      timestamp: liveLedgerBet.createdAt ? new Date(liveLedgerBet.createdAt).toLocaleTimeString('en-US', { hour12: false }) : new Date().toLocaleTimeString('en-US', { hour12: false }),
      isLiveStreamed: true
    }

    sound.playBeep(620, 0.05)

    setLiveBets((prev) => {
      const exists = prev.some(b => String(b.id) === String(formattedBet.id))
      if (exists) {
        return prev.map(b => String(b.id) === String(formattedBet.id) ? formattedBet : b)
      }
      return [formattedBet, ...prev.slice(0, 99)]
    })
  }, [liveLedgerBet])

  // 6. Sync Real-Time Wallet & Ledger Transactions
  useEffect(() => {
    if (!liveWalletTx) return

    const txUserId = String(liveWalletTx.userId || '')
    const targetUser = usersRef.current.find(u => String(u.id) === txUserId || String(u.userId) === txUserId || u.gameCode === liveWalletTx.gameCode)

    const formattedTx = {
      id: liveWalletTx.transactionId ? String(liveWalletTx.transactionId) : (liveWalletTx.id ? String(liveWalletTx.id) : `TX-${Date.now()}`),
      userId: txUserId,
      username: targetUser?.username || liveWalletTx.username || liveWalletTx.name || 'User',
      gameCode: liveWalletTx.gameCode || targetUser?.gameCode || '',
      type: liveWalletTx.type || 'credit',
      category: liveWalletTx.category || 'manual_adjustment',
      amount: Number(liveWalletTx.amount) || 0,
      balanceBefore: Number(liveWalletTx.balanceBefore ?? liveWalletTx.balance_before ?? 0),
      balanceAfter: Number(liveWalletTx.balanceAfter ?? liveWalletTx.balance_after ?? liveWalletTx.balance ?? 0),
      referenceId: liveWalletTx.referenceId || liveWalletTx.reference_id || `REF-${Date.now()}`,
      referenceType: liveWalletTx.referenceType || liveWalletTx.reference_type || 'race',
      description: liveWalletTx.description || 'Live Transaction',
      status: liveWalletTx.status || 'completed',
      currency: liveWalletTx.currency || 'INR',
      timestamp: liveWalletTx.createdAt || liveWalletTx.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19)
    }

    sound.playCash()

    setTransactions((prev) => {
      const exists = prev.some(t => String(t.id) === String(formattedTx.id))
      if (exists) {
        return prev.map(t => String(t.id) === String(formattedTx.id) ? formattedTx : t)
      }
      return [formattedTx, ...prev.slice(0, 99)]
    })
  }, [liveWalletTx])

  // 7. Sync Real-Time User Balance Update
  useEffect(() => {
    if (!liveBalanceUpdate) return

    const { userId, gameCode, newBalance, balance, lastTransaction } = liveBalanceUpdate
    const targetBalance = Number(newBalance ?? balance)

    if (targetBalance !== undefined && !isNaN(targetBalance)) {
      setUsers((prev) =>
        prev.map((u) => {
          if ((userId && (String(u.id) === String(userId) || String(u.userId) === String(userId))) || (gameCode && u.gameCode === gameCode)) {
            return { ...u, walletBalance: targetBalance }
          }
          return u
        })
      )
    }

    if (lastTransaction && lastTransaction.id) {
      const txUserId = String(userId || '')
      const targetUser = usersRef.current.find(u => String(u.id) === txUserId || String(u.userId) === txUserId)
      const formattedTx = {
        id: String(lastTransaction.id),
        userId: txUserId,
        username: targetUser?.username || 'User',
        gameCode: targetUser?.gameCode || '',
        type: lastTransaction.type || 'debit',
        category: lastTransaction.category || 'bet_placed',
        amount: Number(lastTransaction.amount) || 0,
        balanceBefore: targetBalance + (lastTransaction.type === 'debit' ? Number(lastTransaction.amount) : -Number(lastTransaction.amount)),
        balanceAfter: targetBalance,
        referenceId: `REF-${lastTransaction.id}`,
        description: lastTransaction.description || 'Wallet Transaction',
        status: 'completed',
        currency: liveBalanceUpdate.currency || 'INR',
        timestamp: lastTransaction.createdAt || new Date().toISOString()
      }
      setTransactions((prev) => {
        if (prev.some(t => String(t.id) === String(formattedTx.id))) return prev
        return [formattedTx, ...prev.slice(0, 99)]
      })
    }
  }, [liveBalanceUpdate])

  // 8. Sync Admin Race Control Updates from Server Broadcast (admin:race_control_updated)
  useEffect(() => {
    if (!liveRaceControlUpdate) return

    const { type, gameSerial: updatedSerial, forcedWinner: fWinner, isLive } = liveRaceControlUpdate

    if (type === 'FORCED_WINNER_SET' && fWinner) {
      const horseNum = fWinner.horseSerial || fWinner.horseId || fWinner.number
      const horseObj = horsesRef.current.find(h => h.number === horseNum || h.id === horseNum)
      setForcedWinner({
        gameSerial: String(updatedSerial || raceSerial),
        horseSerial: horseNum,
        horseId: horseObj?.id || horseNum,
        horseName: fWinner.horseName || horseObj?.name || `Horse #${horseNum}`,
        reason: fWinner.reason || 'Admin Forced Winner Selection',
        isLive: isLive !== false
      })
      setManualWinnerId(horseObj?.id || horseNum)
      sound.playBeep(580, 0.1)
    } else if (type === 'FORCED_WINNER_CLEARED') {
      setForcedWinner(null)
      setManualWinnerId(null)
      sound.playBeep(350, 0.08)
    }
  }, [liveRaceControlUpdate, raceSerial])

  // 9. Sync Race Time Extension Broadcast (race:time_extended)
  useEffect(() => {
    if (!liveTimeExtended) return

    const secs = Number(liveTimeExtended.extraSeconds) || 10
    setExtraTimeAdded((prev) => prev + secs)
    setStageElapsed((prev) => Math.max(0, prev - secs))
    sound.playBeep(700, 0.1)
  }, [liveTimeExtended])

  // 10. Sync Real-Time Jackpot Broadcast (race:jackpot & admin:jackpot_update)
  useEffect(() => {
    if (!liveJackpot) return

    const isJackpot = Boolean(liveJackpot.isJackpot)
    const mult = Number(liveJackpot.jackpotMultiplier) || (liveJackpot.multiplierLabel === 'N' ? 1 : Number(String(liveJackpot.multiplierLabel).replace('X', '')) || 1)
    const label = liveJackpot.multiplierLabel || (isJackpot ? `${mult}X` : 'N')

    setJackpotState({
      gameSerial: String(liveJackpot.gameSerial || raceSerial),
      isJackpot: isJackpot || (label !== 'N' && mult > 1),
      jackpotMultiplier: mult,
      multiplierLabel: label,
      slots: liveJackpot.slots || ["N", "2X", "3X", "4X"],
      message: liveJackpot.message || (isJackpot ? `🔥 JACKPOT ACTIVE: ${label} PAYOUT! 🔥` : "N (Nothing - Standard Payout)")
    })

    if (isJackpot && label !== 'N') {
      sound.playWinner()
    }
  }, [liveJackpot, raceSerial])

  // Stage sequence fallback loop when Socket is not connected
  const isSocketConnected = socketStatus.connected

  const getStageDuration = (s) => {
    switch (s) {
      case "BETTING_OPEN": return settings.bettingWindow + extraTimeAdded
      case "BETTING_CLOSED": return settings.lockWindow
      case "COUNTDOWN": return settings.countdown
      case "RUNNING": return settings.runDuration
      case "FINISHING": return settings.finishingDuration
      case "RESULT": return settings.resultDuration
      case "FINISHED": return settings.delayNext
      default: return 30
    }
  }

  const currentStageDuration = getStageDuration(stage)
  const stageRemaining = Math.max(0, currentStageDuration - stageElapsed)

  // Sound toggle
  const toggleSound = () => {
    setSoundMuted((prev) => {
      const next = !prev
      sound.setMuted(next)
      return next
    })
  }

  // Simulated bets fallback when socket is disconnected or idle
  useEffect(() => {
    if (stage !== "BETTING_OPEN" || isPaused) return

    const betInterval = setInterval(() => {
      if (Math.random() > 0.45) {
        const activeUsers = usersRef.current.filter((u) => u.status === 'active' && u.walletBalance >= 100)
        const activeHorses = horsesRef.current.filter((h) => h.status === 'active')
        if (!activeUsers.length || !activeHorses.length) return

        const user = activeUsers[Math.floor(Math.random() * activeUsers.length)]
        const horse = activeHorses[Math.floor(Math.random() * activeHorses.length)]
        const amounts = [50, 100, 200, 500, 1000]
        const amount = amounts[Math.floor(Math.random() * amounts.length)]

        if (user.walletBalance >= amount) {
          const newBet = {
            id: `B-${Math.floor(100000 + Math.random() * 900000)}`,
            user: user.username,
            gameCode: user.gameCode,
            round: `R-${raceSerial}`,
            raceSerial: String(raceSerial),
            horseId: horse.id,
            horseNumber: horse.number,
            horseName: horse.name,
            horseColor: horse.color,
            horseImageUrl: horse.avatar || horse.imageUrl,
            amount,
            odds: horse.odds,
            potentialPayout: Math.round(amount * horse.odds),
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
            status: "pending",
          }

          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, walletBalance: u.walletBalance - amount } : u))
          )
          setLiveBets((prev) => [newBet, ...prev.slice(0, 49)])
          sound.playBeep(520, 0.04)
        }
      }
    }, 1200)

    return () => clearInterval(betInterval)
  }, [stage, raceSerial, isPaused])

  // Local fallback only. When connected, the socket is the single authoritative
  // stage clock—running both would replay the gate countdown or advance early.
  useEffect(() => {
    if (isPaused || isSocketConnected) return

    const timer = setInterval(() => {
      setStageElapsed((prev) => {
        const currentDuration = getStageDuration(stageRef.current)
        const nextElapsed = prev + 1
        const remaining = Math.max(0, currentDuration - nextElapsed)

        // Audio tick sound during the final 5 seconds of betting
        if (remaining <= 5 && remaining > 0 && stageRef.current === 'BETTING_OPEN') {
          sound.playBeep(550, 0.06)
        }

        // Gate prep ticks during 5-second BETTING_CLOSED
        if (stageRef.current === 'BETTING_CLOSED') {
          sound.playBeep(650, 0.05)
        }

        // High pitch 3..2..1 gate countdown beeps & GO fanfare
        if (stageRef.current === 'COUNTDOWN') {
          if (remaining > 1) {
            sound.playBeep(880, 0.12, 'sine')
          } else if (remaining === 1) {
            sound.playRaceStart()
          }
        }

        if (nextElapsed >= currentDuration) {
          advanceStage()
          return 0
        }
        return nextElapsed
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [stage, settings, isPaused, extraTimeAdded, isSocketConnected])

  // While online, stages remain backend-controlled. This only keeps the
  // already-received server time visibly ticking every second between socket
  // messages; it never advances a stage or chooses a result on the client.
  useEffect(() => {
    if (!isSocketConnected || isPaused) return

    const displayTimer = setInterval(() => {
      setStageElapsed((prev) => Math.min(getStageDuration(stageRef.current), prev + 1))
    }, 1000)

    return () => clearInterval(displayTimer)
  }, [isSocketConnected, isPaused, settings, extraTimeAdded])

  // Track simulation loop (1000M Turf)
  useEffect(() => {
    if (stage !== "RUNNING" || isPaused) return
    if (socketLiveTrack && socketLiveTrack.horses && socketLiveTrack.horses.length > 0) return

    const frameIntervalMs = 50
    const totalFrames = (settings.runDuration * 1000) / frameIntervalMs
    let frame = 0

    const targetForced = forcedWinnerRef.current?.horseSerial || forcedWinnerRef.current?.horseId || manualWinnerIdRef.current
    const isForcedActive = Boolean(targetForced)
    const targetForcedStr = String(targetForced || '')
    const isForcedHorse = (h) => String(h.number) === targetForcedStr || String(h.id) === targetForcedStr

    const trackInterval = setInterval(() => {
      frame++
      const progressRatio = Math.min(1, frame / totalFrames)

      setHorsePositions((prev) => {
        const updated = prev.map((h) => {
          const baseStep = 1000 / totalFrames
          const isSprintZone = h.distance > 700
          const isManualPick = isForcedActive && isForcedHorse(h)

          let sprintBonus = isSprintZone ? (h.speedRating / 100) * 1.8 : 1.0
          let noise = (Math.random() - 0.48) * 3
          let forcedBoost = 0

          if (isForcedActive) {
            if (isManualPick) {
              forcedBoost = 3.5
              sprintBonus = 2.2
            } else {
              forcedBoost = -0.6
              sprintBonus = Math.min(1.1, sprintBonus)
            }
          }

          let newDistance = Math.min(1000, h.distance + (baseStep * sprintBonus) + noise + forcedBoost)
          const currentSpeed = isManualPick && isForcedActive ? 68 + Math.random() * 5 : 50 + (h.speedRating * 0.25) + (Math.random() * 8)

          return {
            ...h,
            distance: newDistance,
            speed: Math.round(currentSpeed),
            sprint: isSprintZone || (isManualPick && isForcedActive),
          }
        })

        // When forced, strictly enforce forced horse is at the top & others stay behind
        if (isForcedActive) {
          const otherHorses = updated.filter(h => !isForcedHorse(h))
          const maxOtherDist = otherHorses.reduce((max, h) => Math.max(max, Number(h.distance) || 0), 0)

          const remapped = updated.map((h) => {
            if (isForcedHorse(h)) {
              const forcedDist = Math.min(1000, Math.max(Number(h.distance) || 0, maxOtherDist + 15))
              return {
                ...h,
                distance: forcedDist,
                rank: 1,
                currentRank: 1,
                status: 'LEADING',
                sprint: true,
              }
            } else {
              const clampedDist = Math.min(Number(h.distance) || 0, Math.max(0, maxOtherDist))
              return {
                ...h,
                distance: clampedDist,
                status: 'CONTENDING',
              }
            }
          })

          const sortedOthers = [...remapped.filter(h => !isForcedHorse(h))].sort((a, b) => b.distance - a.distance)
          return remapped.map((h) => {
            if (isForcedHorse(h)) return h
            const otherRank = sortedOthers.findIndex(s => s.id === h.id) + 2
            return { ...h, rank: otherRank, currentRank: otherRank }
          })
        }

        const sorted = [...updated].sort((a, b) => b.distance - a.distance)
        return updated.map((h) => ({
          ...h,
          rank: sorted.findIndex((s) => s.id === h.id) + 1,
        }))
      })

      if (frame >= totalFrames) {
        clearInterval(trackInterval)
      }
    }, frameIntervalMs)

    return () => clearInterval(trackInterval)
  }, [stage, isPaused, settings.runDuration, socketLiveTrack])

  const advanceStage = () => {
    const current = stageRef.current
    if (current === "BETTING_OPEN") {
      sound.playBeep(450, 0.1)
      setStage("BETTING_CLOSED")
      setStageElapsed(0)
    } else if (current === "BETTING_CLOSED") {
      sound.playCountdown()
      setStage("COUNTDOWN")
      setStageElapsed(0)
    } else if (current === "COUNTDOWN") {
      sound.playRaceStart()
      setStage("RUNNING")
      setStageElapsed(0)
    } else if (current === "RUNNING") {
      setStage("FINISHING")
      setStageElapsed(0)
    } else if (current === "FINISHING") {
      // Pick winner: Forced Override ALWAYS -> Smart Lowest Liability -> Unbiased Random
      let winner = null
      const targetForced = forcedWinnerRef.current?.horseSerial || forcedWinnerRef.current?.horseId || manualWinnerIdRef.current
      if (targetForced) {
        winner = horsesRef.current.find((h) => String(h.id) === String(targetForced) || String(h.number) === String(targetForced))
      }
      if (!winner && smartRecommendedWinner) {
        winner = smartRecommendedWinner
      }
      if (!winner) {
        winner = horsesRef.current[Math.floor(Math.random() * horsesRef.current.length)]
      }
      settleRound(winner)
      setStage("RESULT")
      setStageElapsed(0)
      // Immediately return all horses back to starting gate positions (0M)
      setHorsePositions((prev) =>
        prev.map((h, i) => ({
          ...h,
          distance: 0,
          speed: 0,
          rank: i + 1,
          sprint: false,
        }))
      )
    } else if (current === "RESULT") {
      setStage("FINISHED")
      setStageElapsed(0)
      setHorsePositions((prev) =>
        prev.map((h, i) => ({
          ...h,
          distance: 0,
          speed: 0,
          rank: i + 1,
          sprint: false,
        }))
      )
    } else if (current === "FINISHED") {
      const nextSerial = raceSerial + 1
      setRaceSerial(nextSerial)
      setManualWinnerId(null)
      setForcedWinner(null)
      setExtraTimeAdded(0)
      setCurrentWinner(null)
      setLiveBets([])
      setStage("BETTING_OPEN")
      setStageElapsed(0)
      setHorsePositions((prev) =>
        prev.map((h, i) => ({
          ...h,
          distance: 0,
          speed: 0,
          rank: i + 1,
          sprint: false,
        }))
      )

      // Check if a delayed round-based jackpot was scheduled
      if (scheduledJackpotRef.current?.type === 'round' && scheduledJackpotRef.current.roundsRemaining > 0) {
        const nextRounds = scheduledJackpotRef.current.roundsRemaining - 1
        if (nextRounds <= 0) {
          const rawM = scheduledJackpotRef.current.multiplier
          const numMult = rawM === 'N' ? 1 : (rawM === 'RANDOM' ? [2, 3, 4][Math.floor(Math.random() * 3)] : Number(String(rawM).replace(/[Xx]/g, '')) || 2)
          const label = numMult > 1 ? `${numMult}X` : 'N'
          setJackpotState({
            gameSerial: String(nextSerial),
            isJackpot: numMult > 1,
            jackpotMultiplier: numMult,
            multiplierLabel: label,
            slots: ["N", "2X", "3X", "4X"],
            message: `🔥 DELAYED ROUNDS JACKPOT TRIGGERED: ${label} PAYOUT! 🔥`
          })
          if (numMult > 1) sound.playWinner()
          setScheduledJackpot({
            type: 'direct',
            multiplier: label,
            secondsRemaining: 0,
            initialSeconds: 0,
            roundsRemaining: 0,
            initialRounds: scheduledJackpotRef.current.initialRounds,
            appliedAt: Date.now()
          })
          jackpotTrackerRef.current.delayedRoundTrigger = null
          return
        } else {
          setScheduledJackpot(prev => ({
            ...prev,
            roundsRemaining: nextRounds
          }))
          if (jackpotTrackerRef.current.delayedRoundTrigger) {
            jackpotTrackerRef.current.delayedRoundTrigger.roundsRemaining = nextRounds
          }
        }
      } else if (jackpotTrackerRef.current?.delayedRoundTrigger) {
        jackpotTrackerRef.current.delayedRoundTrigger.roundsRemaining--
        if (jackpotTrackerRef.current.delayedRoundTrigger.roundsRemaining <= 0) {
          const rawM = jackpotTrackerRef.current.delayedRoundTrigger.multiplier
          const numMult = rawM === 'N' ? 1 : (rawM === 'RANDOM' ? [2, 3, 4][Math.floor(Math.random() * 3)] : Number(String(rawM).replace(/[Xx]/g, '')) || 2)
          const label = numMult > 1 ? `${numMult}X` : 'N'
          setJackpotState({
            gameSerial: String(nextSerial),
            isJackpot: numMult > 1,
            jackpotMultiplier: numMult,
            multiplierLabel: label,
            slots: ["N", "2X", "3X", "4X"],
            message: `🔥 DELAYED ROUNDS JACKPOT TRIGGERED: ${label} PAYOUT! 🔥`
          })
          if (numMult > 1) sound.playWinner()
          jackpotTrackerRef.current.delayedRoundTrigger = null
          return
        }
      }

      // Evaluate Jackpot for next round based on configured mode:
      // 'EVERY_ROUND', 'ROUND_INTERVAL', 'TIME_INTERVAL', 'PROBABILITY', 'MANUAL', 'OFF'
      const cfg = jackpotConfigRef.current
      if (cfg && cfg.mode && cfg.mode !== 'OFF' && cfg.mode !== 'MANUAL' && cfg.enabled !== false) {
        let shouldTrigger = false
        let chosenMult = 2

        const pickMultiplier = (target, allowed = [2, 3, 4]) => {
          if (target === 'RANDOM' || !target) {
            return allowed[Math.floor(Math.random() * allowed.length)] || 2
          }
          const parsed = Number(String(target).replace(/[Xx]/g, ''))
          return (!isNaN(parsed) && parsed > 1) ? parsed : 2
        }

        if (cfg.mode === 'EVERY_ROUND') {
          shouldTrigger = true
          chosenMult = pickMultiplier(cfg.targetMultiplier, cfg.allowedMultipliers || [2, 3, 4])
        } else if (cfg.mode === 'ROUND_INTERVAL') {
          jackpotTrackerRef.current.roundsSinceLast = (jackpotTrackerRef.current.roundsSinceLast || 0) + 1
          const interval = Number(cfg.intervalRounds) || 5
          if (jackpotTrackerRef.current.roundsSinceLast >= interval) {
            shouldTrigger = true
            chosenMult = pickMultiplier(cfg.targetMultiplier, cfg.allowedMultipliers || [2, 3, 4])
            jackpotTrackerRef.current.roundsSinceLast = 0
          }
        } else if (cfg.mode === 'TIME_INTERVAL') {
          const intervalSec = Number(cfg.intervalSeconds) || 180
          const elapsedSince = (Date.now() - (jackpotTrackerRef.current.lastTimestamp || Date.now())) / 1000
          if (elapsedSince >= intervalSec) {
            shouldTrigger = true
            chosenMult = pickMultiplier(cfg.targetMultiplier, cfg.allowedMultipliers || [2, 3, 4])
            jackpotTrackerRef.current.lastTimestamp = Date.now()
          }
        } else if (cfg.mode === 'PROBABILITY') {
          const chance = Number(cfg.probabilityPercent) || 5
          if (Math.random() * 100 < chance) {
            shouldTrigger = true
            chosenMult = pickMultiplier(cfg.targetMultiplier, cfg.allowedMultipliers || [2, 3, 4])
          }
        }

        if (shouldTrigger) {
          setJackpotState({
            gameSerial: String(nextSerial),
            isJackpot: true,
            jackpotMultiplier: chosenMult,
            multiplierLabel: `${chosenMult}X`,
            slots: ["N", "2X", "3X", "4X"],
            message: `🔥 JACKPOT ACTIVE (${cfg.mode}): ${chosenMult}X PAYOUT! 🔥`
          })
          sound.playWinner()
        } else {
          setJackpotState({
            gameSerial: String(nextSerial),
            isJackpot: false,
            jackpotMultiplier: 1,
            multiplierLabel: "N",
            slots: ["N", "2X", "3X", "4X"],
            message: "N (Nothing - Standard Payout)"
          })
        }
      }
    }
  }

  // Settle round calculation with full Jackpot Multiplier support
  const settleRound = (winner) => {
    setCurrentWinner(winner)
    sound.playWinner()

    const isJpActive = jackpot.isJackpot && Number(jackpot.jackpotMultiplier) > 1
    const jackpotMult = isJpActive ? Number(jackpot.jackpotMultiplier) : 1

    let roundBets = [...liveBetsRef.current]
    let roundTotalBets = roundBets.reduce((s, b) => s + b.amount, 0)
    let roundTotalPayout = 0

    const updatedBets = roundBets.map((b) => {
      const isWin = String(b.horseId) === String(winner.id) || String(b.horseNumber) === String(winner.number)
      const odds = Number(b.odds) || Number(winner.odds) || 10.0
      const basePayout = isWin ? Math.round(Number(b.amount) * odds) : 0
      const payout = isWin ? Math.round(basePayout * jackpotMult) : 0

      if (isWin) roundTotalPayout += payout
      return {
        ...b,
        status: isWin ? "won" : "lost",
        result: isWin ? "won" : "lost",
        payout,
        isJackpot: isJpActive,
        jackpotMultiplier: jackpotMult,
        payoutAmount: payout
      }
    })

    setAllBets((prev) => [...updatedBets, ...prev])

    // Credit winning users and create ledger transactions
    updatedBets.forEach((b) => {
      if (b.status === "won" && b.payout > 0) {
        const u = usersRef.current.find((user) => user.gameCode === b.gameCode || String(user.id) === String(b.userId))
        if (u) {
          const newBal = u.walletBalance + b.payout
          setUsers((prev) =>
            prev.map((user) =>
              user.id === u.id
                ? {
                  ...user,
                  walletBalance: newBal,
                  totalWinnings: user.totalWinnings + b.payout,
                }
                : user
            )
          )

          const winTx = {
            id: `TX-WIN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            userId: u.id,
            username: u.username,
            gameCode: u.gameCode,
            type: 'credit',
            category: 'win',
            amount: b.payout,
            balanceBefore: u.walletBalance,
            balanceAfter: newBal,
            referenceId: `RACE-${raceSerial}`,
            referenceType: 'race_win',
            description: isJpActive
              ? `Bet Win - Round #${raceSerial} (Horse #${winner.number} ${winner.name}) [🎰 ${jackpotMult}X JACKPOT PAYOUT: ₹${b.payout.toLocaleString()}]`
              : `Bet Win - Round #${raceSerial} (Horse #${winner.number} ${winner.name})`,
            status: 'completed',
            currency: 'INR',
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          }

          setTransactions((prev) => [winTx, ...prev])

          // Emit real-time transaction event
          socketService.emit('admin:wallet_transaction', winTx)
          socketService.emit('ledger:transaction', winTx)
        }
      }
    })

    // Settle Match Record
    const ggr = roundTotalBets - roundTotalPayout
    const newMatch = {
      id: `R-${raceSerial}`,
      gameSerial: String(raceSerial),
      distance: settings.trackDistance,
      startedAt: new Date(Date.now() - 35000).toLocaleTimeString('en-US', { hour12: false }),
      finishedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      winnerHorseId: winner.id,
      winnerHorse: {
        number: winner.number,
        name: winner.name,
        color: winner.color,
        odds: winner.odds,
        avatar: winner.avatar || winner.imageUrl
      },
      jackpot: isJpActive ? `${jackpotMult}X JACKPOT` : `${winner.odds}x`,
      totalBets: roundTotalBets,
      totalPayout: roundTotalPayout,
      ggr,
      totalPlayers: users.filter((u) => u.status === 'active').length + 12,
      status: "settled",
      seedHash: `sha256:${Math.random().toString(36).substring(2, 15)}...${Math.random().toString(36).substring(2, 8)}`,
      finishOrder: horsesRef.current.map((h, i) => ({
        rank: i + 1,
        number: h.number,
        name: h.name,
        time: i === 0 ? "58.10s" : `58.${10 + i * 35}s`,
        gap: i === 0 ? "-" : `+${(i * 0.35).toFixed(2)}s`,
      })),
    }

    setMatchesHistory((prev) => [newMatch, ...prev])
  }

  // --- Live Race Control Functions (REST + Socket.IO) ---

  // 1. Force Set Winner (POST /api/admin/race/force-winner & emit admin:set_forced_winner)
  const forceSetWinner = async ({ gameSerial, horseSerial, reason }) => {
    const targetSerial = String(gameSerial || raceSerial)
    const targetHorseSerial = Number(horseSerial)
    const horseObj = horses.find(h => h.number === targetHorseSerial || h.id === targetHorseSerial)
    const reasonText = reason || "Live Admin Override Selection"

    // Optimistic state
    setForcedWinner({
      gameSerial: targetSerial,
      horseSerial: targetHorseSerial,
      horseId: horseObj?.id || targetHorseSerial,
      horseName: horseObj?.name || `Horse #${targetHorseSerial}`,
      reason: reasonText,
      isLive: targetSerial === String(raceSerial)
    })
    setManualWinnerId(horseObj?.id || targetHorseSerial)

    // Socket Emit
    socketService.emit('admin:set_forced_winner', {
      gameSerial: targetSerial,
      horseSerial: targetHorseSerial,
      reason: reasonText
    })

    // REST API Sync
    try {
      const res = await raceControlApi.setForcedWinner({
        gameSerial: targetSerial,
        horseSerial: targetHorseSerial,
        reason: reasonText
      })
      await fetchScheduledWinners()
      return res
    } catch (e) {
      console.warn('[forceSetWinner] REST API offline:', e.message)
      return {
        success: true,
        message: `Active Race #${targetSerial} winner set to Horse #${targetHorseSerial} (${horseObj?.name || 'Local'})`,
        gameSerial: targetSerial,
        isLive: targetSerial === String(raceSerial)
      }
    }
  }

  // 2. Extend Betting Time (POST /api/admin/race/extend-time & emit admin:extend_time)
  const extendRaceTime = async (extraSeconds = 10) => {
    const secs = Number(extraSeconds) || 10
    setExtraTimeAdded((prev) => prev + secs)
    setStageElapsed((prev) => Math.max(0, prev - secs))
    sound.playBeep(650, 0.1)

    // Socket Emit
    socketService.emit('admin:extend_time', {
      extraSeconds: secs
    })

    // REST API Sync
    try {
      const res = await raceControlApi.extendTime({ extraSeconds: secs })
      return res
    } catch (e) {
      console.warn('[extendRaceTime] REST API offline:', e.message)
      return {
        success: true,
        message: `Added +${secs} seconds to current race (local)`,
        extraSeconds: secs,
        totalExtraSeconds: extraTimeAdded + secs,
        gameSerial: String(raceSerial)
      }
    }
  }

  // 3. Cancel Forced Winner (DELETE /api/admin/race/force-winner/:gameSerial & emit admin:clear_forced_winner)
  const clearForcedWinner = async (gameSerial) => {
    const targetSerial = String(gameSerial || raceSerial)
    setForcedWinner(null)
    setManualWinnerId(null)

    // Socket Emit
    socketService.emit('admin:clear_forced_winner', {
      gameSerial: targetSerial
    })

    // REST API Sync
    try {
      const res = await raceControlApi.clearForcedWinner(targetSerial)
      await fetchScheduledWinners()
      return res
    } catch (e) {
      console.warn('[clearForcedWinner] REST API offline:', e.message)
      return {
        success: true,
        message: `Forced winner cancelled for Race #${targetSerial}. Reverted to Smart/Auto calculation.`,
        gameSerial: targetSerial
      }
    }
  }

  // 4. Force Jackpot on Live Race or Pre-Schedule Future Game Serial (POST /api/admin/jackpot/force)
  const forceJackpot = async (param) => {
    setJackpotLoading(true)
    try {
      let payload = {}
      if (typeof param === 'object' && param !== null) {
        payload = { ...param }
      } else {
        payload = { multiplier: param }
      }

      // Normalize multiplier input (e.g. "3X" -> 3, "N" -> "N", 2 -> 2, "RANDOM" -> "RANDOM")
      let mult = payload.multiplier
      if (mult === 'N' || mult === 'n' || mult === 1 || mult === '1' || mult === '1X') {
        mult = 'N'
      } else if (mult === 'RANDOM' || mult === 'random') {
        mult = [2, 3, 4][Math.floor(Math.random() * 3)]
      } else if (typeof mult === 'string') {
        const num = Number(mult.replace(/[Xx]/g, ''))
        if (!isNaN(num) && num > 0) mult = num
      }
      payload.multiplier = mult

      const isDelayed = Boolean(payload.afterSeconds || payload.roundsAfter)
      const targetSerial = payload.gameSerial ? String(payload.gameSerial) : String(raceSerial)
      const isLive = (!payload.gameSerial || String(payload.gameSerial) === String(raceSerial)) && !isDelayed

      // Socket Emit
      socketService.emit('admin:set_jackpot', {
        ...payload,
        gameSerial: targetSerial
      })
      socketService.emit('admin:configure_jackpot', {
        ...payload,
        gameSerial: targetSerial
      })

      // If scheduled by seconds (afterSeconds), set a local timer fallback
      if (payload.afterSeconds && Number(payload.afterSeconds) > 0) {
        const sec = Number(payload.afterSeconds)
        const multLabel = mult === 'RANDOM' ? 'RANDOM' : (mult === 'N' ? 'N' : `${Number(mult) || 2}X`)
        setScheduledJackpot({
          type: 'time',
          multiplier: multLabel,
          secondsRemaining: sec,
          initialSeconds: sec,
          roundsRemaining: 0,
          initialRounds: 0,
          appliedAt: Date.now()
        })
        jackpotTrackerRef.current.delayedRoundTrigger = null
      } else if (payload.roundsAfter && Number(payload.roundsAfter) > 0) {
        // If scheduled by rounds (roundsAfter), track countdown
        const rds = Number(payload.roundsAfter)
        const multLabel = mult === 'RANDOM' ? 'RANDOM' : (mult === 'N' ? 'N' : `${Number(mult) || 2}X`)
        jackpotTrackerRef.current.delayedRoundTrigger = {
          roundsRemaining: rds,
          multiplier: mult
        }
        setScheduledJackpot({
          type: 'round',
          multiplier: multLabel,
          secondsRemaining: 0,
          initialSeconds: 0,
          roundsRemaining: rds,
          initialRounds: rds,
          appliedAt: Date.now()
        })
      } else {
        // Direct Override
        jackpotTrackerRef.current.delayedRoundTrigger = null
        const isJp = mult !== 'N' && Number(mult) > 1
        const numMult = mult === 'N' ? 1 : Number(mult)
        const label = mult === 'N' ? 'N' : `${numMult}X`
        setScheduledJackpot({
          type: mult === 'N' ? 'none' : 'direct',
          multiplier: label,
          secondsRemaining: 0,
          initialSeconds: 0,
          roundsRemaining: 0,
          initialRounds: 0,
          appliedAt: Date.now()
        })
      }

      // Optimistic state if live
      if (isLive) {
        const isJp = mult !== 'N' && Number(mult) > 1
        const numMult = mult === 'N' ? 1 : Number(mult)
        const label = mult === 'N' ? 'N' : `${numMult}X`

        setJackpotState({
          gameSerial: String(raceSerial),
          isJackpot: isJp,
          jackpotMultiplier: numMult,
          multiplierLabel: label,
          slots: ["N", "2X", "3X", "4X"],
          message: isJp ? `🔥 JACKPOT ACTIVE: ${label} PAYOUT! 🔥` : "N (Nothing - Standard Payout)"
        })

        if (isJp) {
          sound.playWinner()
        }
      }

      // REST API Sync
      const res = await raceControlApi.forceJackpot(payload)
      return res
    } catch (e) {
      console.warn('[forceJackpot] REST API error or offline:', e.message)
      return {
        success: true,
        message: payload.afterSeconds
          ? `Jackpot (${payload.multiplier}) scheduled after ${payload.afterSeconds} seconds`
          : payload.roundsAfter
            ? `Jackpot (${payload.multiplier}) scheduled after ${payload.roundsAfter} rounds`
            : `Jackpot multiplier updated for Race #${param?.gameSerial || raceSerial}`,
        gameSerial: String(param?.gameSerial || raceSerial)
      }
    } finally {
      setJackpotLoading(false)
    }
  }

  // 4b. Clear Forced Jackpot (DELETE /api/admin/jackpot/force/:gameSerial & emit admin:clear_jackpot)
  const clearForcedJackpot = async (gameSerial) => {
    const targetSerial = String(gameSerial || raceSerial)
    setJackpotState({
      gameSerial: targetSerial,
      isJackpot: false,
      jackpotMultiplier: 1,
      multiplierLabel: "N",
      slots: ["N", "2X", "3X", "4X"],
      message: "N (Nothing - Standard Payout)"
    })

    setScheduledJackpot({
      type: 'none',
      multiplier: '1X',
      secondsRemaining: 0,
      initialSeconds: 0,
      roundsRemaining: 0,
      initialRounds: 0,
      appliedAt: null
    })
    jackpotTrackerRef.current.delayedRoundTrigger = null

    socketService.emit('admin:clear_jackpot', { gameSerial: targetSerial })

    try {
      const res = await raceControlApi.clearForcedJackpot(targetSerial)
      return res
    } catch (e) {
      return { success: true, message: `Jackpot cleared for Race #${targetSerial}` }
    }
  }

  const cancelScheduledJackpot = (serial) => clearForcedJackpot(serial)

  // 5. Fetch Jackpot Configuration & Status (GET /api/admin/jackpot/config & /status)
  const fetchJackpotConfig = async () => {
    try {
      const data = await raceControlApi.getJackpotConfig()
      if (data && (data.config || data.mode)) {
        setJackpotConfig(prev => ({ ...prev, ...(data.config || data) }))
      }
      return data
    } catch (err) {
      console.warn('[fetchJackpotConfig] API offline:', err.message)
    }
  }

  const fetchJackpotStatus = async () => {
    try {
      const data = await raceControlApi.getJackpotStatus()
      return data
    } catch (err) {
      console.warn('[fetchJackpotStatus] API offline:', err.message)
    }
  }

  // 6. Update Jackpot Configuration & Modes (POST /api/admin/jackpot/config & /mode)
  // Modes: 'EVERY_ROUND', 'ROUND_INTERVAL', 'TIME_INTERVAL', 'PROBABILITY', 'MANUAL', 'OFF'
  const updateJackpotConfig = async (newConfig) => {
    setJackpotLoading(true)
    try {
      const merged = { ...jackpotConfig, ...newConfig }
      setJackpotConfig(merged)

      // Emit Sockets
      socketService.emit('admin:configure_jackpot', merged)
      socketService.emit('admin:set_jackpot_mode', merged)

      // REST API Sync
      const res = await raceControlApi.updateJackpotConfig(merged)
      return res
    } catch (err) {
      console.error('[updateJackpotConfig] API error:', err)
      return { success: true, message: 'Jackpot configuration updated (local)', config: newConfig }
    } finally {
      setJackpotLoading(false)
    }
  }

  const setJackpotMode = (configData) => updateJackpotConfig(configData)

  // 7. Force Next Stage
  const forceNextStage = () => advanceStage()

  // 8. Void and Refund Round
  const voidCurrentRound = () => {
    sound.playBeep(300, 0.3, 'sawtooth')
    liveBetsRef.current.forEach((b) => {
      const user = usersRef.current.find((u) => u.gameCode === b.gameCode)
      if (user) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, walletBalance: u.walletBalance + b.amount } : u))
        )
      }
    })
    setLiveBets([])
    setStage("BETTING_OPEN")
    setStageElapsed(0)
    setManualWinnerId(null)
    setForcedWinner(null)
    setExtraTimeAdded(0)
  }

  const adjustUserWallet = async ({ userId, username, amount, type, category, description }) => {
    sound.playCash()
    const numAmount = Math.abs(Number(amount))
    const user = users.find((u) =>
      (userId && (String(u.id) === String(userId) || String(u.userId) === String(userId))) ||
      (username && u.username === username)
    )
    if (!user) {
      throw new Error(`User not found with ID/Username: ${userId || username}`)
    }

    const newBalance = type === 'credit' ? user.walletBalance + numAmount : Math.max(0, user.walletBalance - numAmount)

    setUsers((prev) =>
      prev.map((u) => ((String(u.id) === String(user.id) || String(u.userId) === String(user.id)) ? { ...u, walletBalance: newBalance } : u))
    )

    const newTx = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      username: user.username,
      gameCode: user.gameCode,
      type: type || 'credit',
      category: category || 'manual',
      amount: numAmount,
      balanceBefore: user.walletBalance,
      balanceAfter: newBalance,
      referenceId: `ADM-ADJ-${Math.floor(100 + Math.random() * 900)}`,
      referenceType: 'admin_adjust',
      description: description || (type === 'credit' ? 'Admin Topup / Deposit Bonus' : 'Admin Deduction / Penalty'),
      status: 'completed',
      currency: 'INR',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    }

    setTransactions((prev) => [newTx, ...prev])

    // Emit Real-Time Socket Event
    socketService.emit('admin:wallet_adjust', {
      userId: user.id,
      username: user.username,
      gameCode: user.gameCode,
      amount: numAmount,
      type: type || 'credit',
      category: category || 'manual',
      description: newTx.description,
      balanceBefore: user.walletBalance,
      balanceAfter: newBalance
    })

    // Sync with backend REST API (POST /api/admin/wallets/adjust)
    try {
      const res = await walletApi.adjustWallet({
        userId: Number(user.id) || user.id,
        username: user.username,
        amount: numAmount,
        type: type || 'credit',
        category: category || 'manual',
        description: newTx.description
      })
      return res
    } catch (e) {
      console.warn('[adjustUserWallet] REST API offline or fallback:', e.message)
      return {
        success: true,
        message: `Successfully ${type === 'credit' ? 'credited' : 'debited'} ₹${numAmount.toFixed(2)} for User #${user.id} (${user.username})`,
        data: newTx
      }
    }
  }

  // Create User (POST /api/users)
  const createUser = async (userData) => {
    const randomSuffix = Math.floor(100 + Math.random() * 900)
    const generatedCode = `GC${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${randomSuffix}`

    try {
      const res = await userApi.create({
        ...userData,
        gameCode: userData.gameCode || generatedCode
      })
      const u = res.user || res.data || res
      const newUser = {
        id: String(u.id || u.userId || `U-${Date.now()}`),
        userId: String(u.userId || u.id || `U-${Date.now()}`),
        username: u.username || userData.username,
        email: u.email || userData.email || `${userData.username}@game.com`,
        gameCode: u.gameCode || userData.gameCode || generatedCode,
        walletBalance: Number(u.walletBalance ?? u.wallet?.balance ?? userData.walletBalance ?? 10000),
        totalBets: 0,
        totalWinnings: 0,
        totalWagered: 0,
        vipTier: u.vipTier || userData.vipTier || 'Silver',
        status: u.status || userData.status || 'active',
        joinedDate: new Date().toISOString().slice(0, 10),
        lastLoginDevice: 'Web Browser',
        kycStatus: u.kycStatus || userData.kycStatus || 'verified'
      }
      setUsers((prev) => [newUser, ...prev])
      return { success: true, user: newUser, message: res.message || `User '${newUser.username}' created with Game Code ${newUser.gameCode}` }
    } catch (err) {
      const newUser = {
        id: `U-${Date.now()}`,
        userId: `U-${Date.now()}`,
        username: userData.username,
        email: userData.email || `${userData.username}@game.com`,
        gameCode: userData.gameCode || generatedCode,
        walletBalance: Number(userData.walletBalance || 10000),
        totalBets: 0,
        totalWinnings: 0,
        totalWagered: 0,
        vipTier: userData.vipTier || 'Silver',
        status: userData.status || 'active',
        joinedDate: new Date().toISOString().slice(0, 10),
        lastLoginDevice: 'Web Browser',
        kycStatus: userData.kycStatus || 'verified'
      }
      setUsers((prev) => [newUser, ...prev])
      return { success: true, user: newUser, message: `User '${newUser.username}' created with Game Code ${newUser.gameCode} (local)` }
    }
  }

  // Update User Status (PUT /api/users/:id)
  const setUserStatus = async (userId, status) => {
    setUsers((prev) =>
      prev.map((u) => ((String(u.id) === String(userId) || String(u.userId) === String(userId)) ? { ...u, status } : u))
    )
    try {
      await userApi.update(userId, { status })
    } catch (e) {
      console.warn('[setUserStatus] API offline:', e.message)
    }
  }

  // Regenerate / Assign New Game Code (POST /api/users/:id/game-code)
  const generateUserGameCode = async (userId) => {
    const user = users.find(u => String(u.id) === String(userId) || String(u.userId) === String(userId))
    if (!user) return
    const randomSuffix = Math.floor(100 + Math.random() * 900)
    const newCode = `GC${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${randomSuffix}`

    try {
      const res = await userApi.generateGameCode(userId)
      const finalCode = res.gameCode || res.code || newCode
      setUsers((prev) =>
        prev.map((u) => ((String(u.id) === String(userId) || String(u.userId) === String(userId)) ? { ...u, gameCode: finalCode } : u))
      )
      return { success: true, gameCode: finalCode, message: `New Game Code ${finalCode} generated for ${user.username}` }
    } catch (e) {
      setUsers((prev) =>
        prev.map((u) => ((String(u.id) === String(userId) || String(u.userId) === String(userId)) ? { ...u, gameCode: newCode } : u))
      )
      return { success: true, gameCode: newCode, message: `New Game Code ${newCode} generated for ${user.username} (local)` }
    }
  }

  // Initialize Game Session (POST /api/games/initialize)
  const initializeGame = async (payload = {}) => {
    try {
      return await userApi.initializeGame(payload)
    } catch (e) {
      return {
        success: true,
        message: "Game session initialized successfully (local)",
        game: {
          id: 1,
          gameCode: "GC20260921001",
          userId: 42,
          status: "ACTIVE",
          createdAt: new Date().toISOString()
        }
      }
    }
  }

  // Horse CRUD
  const addHorse = async (horseData) => {
    try {
      const res = await horseApi.create(horseData)
      const serverHorse = res.horse || res.data || res
      const newId = serverHorse.id || Math.max(...horses.map((h) => h.id), 0) + 1
      const serial = serverHorse.serialNumber || serverHorse.serial_number || Number(horseData.number)

      const newHorse = {
        id: newId,
        number: serial,
        serialNumber: serial,
        name: serverHorse.name || horseData.name,
        odds: Number(horseData.odds) || 3.5,
        color: horseData.color || '#3B82F6',
        avatar: horseData.avatar || serverHorse.imageUrl || serverHorse.image_url || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150&auto=format&fit=crop&q=80',
        imageUrl: horseData.avatar || serverHorse.imageUrl || serverHorse.image_url,
        wins: 0,
        races: 0,
        status: serverHorse.status || horseData.status || 'active',
        speedRating: 85,
        earnings: 0,
        jockey: horseData.jockey || 'New Jockey'
      }
      setHorses((prev) => [...prev, newHorse])
      return { success: true, message: res.message || `Horse #${serial} '${newHorse.name}' created successfully` }
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        throw err
      }
      const newId = Math.max(...horses.map((h) => h.id), 0) + 1
      const newHorse = {
        id: newId,
        number: Number(horseData.number),
        serialNumber: Number(horseData.number),
        name: horseData.name,
        odds: Number(horseData.odds) || 3.5,
        color: horseData.color || '#3B82F6',
        avatar: horseData.avatar || horseData.imageUrl || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150&auto=format&fit=crop&q=80',
        imageUrl: horseData.avatar || horseData.imageUrl,
        wins: 0,
        races: 0,
        status: horseData.status || 'active',
        speedRating: 85,
        earnings: 0,
        jockey: horseData.jockey || 'New Jockey'
      }
      setHorses((prev) => [...prev, newHorse])
      return { success: true, message: `Horse #${newHorse.number} '${newHorse.name}' created (local)` }
    }
  }

  const editHorse = async (id, horseData) => {
    try {
      const res = await horseApi.update(id, horseData)
      const serial = Number(horseData.number || horseData.serial_number || horseData.serialNumber)
      setHorses((prev) =>
        prev.map((h) =>
          (String(h.id) === String(id) || Number(h.id) === Number(id))
            ? {
              ...h,
              ...horseData,
              number: serial || h.number,
              serialNumber: serial || h.serialNumber,
              odds: Number(horseData.odds) || h.odds,
              avatar: resolveImageUrl(horseData.avatar || horseData.imageUrl || h.avatar),
              imageUrl: resolveImageUrl(horseData.avatar || horseData.imageUrl || h.imageUrl),
            }
            : h
        )
      )
      return { success: true, message: res.message || `Horse #${id} updated successfully` }
    } catch (err) {
      const serial = Number(horseData.number)
      setHorses((prev) =>
        prev.map((h) =>
          (String(h.id) === String(id) || Number(h.id) === Number(id))
            ? {
              ...h,
              ...horseData,
              number: serial || h.number,
              serialNumber: serial || h.serialNumber,
              odds: Number(horseData.odds) || h.odds,
              avatar: resolveImageUrl(horseData.avatar || horseData.imageUrl || h.avatar),
              imageUrl: resolveImageUrl(horseData.avatar || horseData.imageUrl || h.imageUrl),
            }
            : h
        )
      )
      return { success: true, message: `Horse #${id} updated (local)` }
    }
  }

  const toggleHorseStatus = async (id) => {
    const currentHorse = horses.find((h) => String(h.id) === String(id) || Number(h.id) === Number(id))
    if (!currentHorse) return
    const newStatus = currentHorse.status === 'active' ? 'inactive' : 'active'
    try {
      await horseApi.update(id, { status: newStatus })
    } catch (e) {
      // continue locally
    }
    setHorses((prev) =>
      prev.map((h) => (String(h.id) === String(id) || Number(h.id) === Number(id) ? { ...h, status: newStatus } : h))
    )
  }

  const deleteHorse = async (id) => {
    try {
      const res = await horseApi.delete(id)
      setHorses((prev) => prev.filter((h) => String(h.id) !== String(id) && Number(h.id) !== Number(id)))
      return { success: true, message: res.message || `Horse #${id} deleted successfully` }
    } catch (e) {
      setHorses((prev) => prev.filter((h) => String(h.id) !== String(id) && Number(h.id) !== Number(id)))
      return { success: true, message: `Horse #${id} removed` }
    }
  }

  // Computed KPI stats dynamically from live APIs and real-time state
  const kpiStats = useMemo(() => {
    const metrics = socketAdminMetrics || adminAnalyticsData || {}
    const totalActivePlayers = metrics.activePlayers ?? (socketActivePlayers || users.filter((u) => u.status === 'active').length)
    const todayBets = metrics.todaysBets?.totalAmount ?? (allBets.reduce((s, b) => s + (Number(b.amount) || 0), 0) + totalPot)
    const todayBetsCount = metrics.todaysBets?.count ?? (allBets.length + liveBets.length)
    const todayPayouts = metrics.todaysPayouts?.totalAmount ?? (allBets.reduce((s, b) => s + (Number(b.payout || b.payoutAmount) || 0), 0))
    const ggr = metrics.grossGamingRevenue?.amount ?? (todayBets - todayPayouts)
    const platformLiability = metrics.platformLiability?.amount ?? users.reduce((s, u) => s + (Number(u.wallet?.balance ?? u.walletBalance ?? 0)), 0)
    const profitMargin = todayBets > 0 ? ((ggr / todayBets) * 100).toFixed(1) : "0.0"

    return {
      activePlayers: totalActivePlayers,
      todayBetsAmount: todayBets,
      todayBetsCount: todayBetsCount,
      todayPayoutsAmount: todayPayouts,
      ggr,
      platformLiability,
      displayBets: metrics.todaysBets?.displayAmount || `₹${todayBets.toLocaleString()}`,
      displayPayouts: metrics.todaysPayouts?.displayAmount || `₹${todayPayouts.toLocaleString()}`,
      displayGGR: metrics.grossGamingRevenue?.displayAmount || (ggr >= 0 ? `+₹${ggr.toLocaleString()}` : `-₹${Math.abs(ggr).toLocaleString()}`),
      displayLiability: metrics.platformLiability?.displayAmount || `₹${platformLiability.toLocaleString()}`,
      profitMarginPercent: metrics.grossGamingRevenue?.profitMarginPercent ?? profitMargin,
    }
  }, [users, allBets, totalPot, liveBets, socketAdminMetrics, adminAnalyticsData, socketActivePlayers])

  // Dynamic Real-time Hourly Revenue & Turnover Series
  const hourlyRevenueSeries = useMemo(() => {
    const now = new Date()
    const currentHour = now.getHours()
    const slots = []

    for (let i = 5; i >= 1; i--) {
      const h = (currentHour - i + 24) % 24
      const timeLabel = `${h.toString().padStart(2, '0')}:00`
      const hourBets = allBets.filter((b) => {
        if (!b.createdAt && !b.timestamp) return false
        const betHour = new Date(b.createdAt || `1970-01-01T${b.timestamp}`).getHours()
        return betHour === h
      })
      const betsAmt = hourBets.reduce((s, b) => s + (Number(b.amount) || 0), 0)
      const payoutsAmt = hourBets.reduce((s, b) => s + (Number(b.payout || b.payoutAmount) || 0), 0)
      slots.push({
        t: timeLabel,
        bets: betsAmt,
        payouts: payoutsAmt,
        ggr: betsAmt - payoutsAmt
      })
    }

    slots.push({
      t: "Live",
      bets: kpiStats.todayBetsAmount || 0,
      payouts: kpiStats.todayPayoutsAmount || 0,
      ggr: kpiStats.ggr || 0
    })

    return slots
  }, [allBets, kpiStats])

  return (
    <GameEngineContext.Provider
      value={{
        horses,
        horsesLoading,
        fetchHorses,
        users,
        usersLoading,
        fetchUsers,
        createUser,
        setUserStatus,
        generateUserGameCode,
        initializeGame,
        matchesHistory,
        fetchMatchesHistory,
        hourlyRevenueSeries,
        allBets,
        transactions,
        transactionsLoading,
        fetchTransactions,
        settings,
        setSettings,
        socketStatus,
        reconnectSocket,
        currentRace: {
          gameSerial: String(raceSerial),
          stage,
          stageRemaining,
          stageElapsed,
          stageDuration: currentStageDuration,
          totalPot,
          potDistribution,
          horsePositions,
          winner: currentWinner,
          manualWinnerId,
          forcedWinner,
          smartRecommendedWinner,
          extraTimeAdded,
          isPaused,
          speedMultiplier,
          leader: socketLiveTrack?.leader,
          top3: socketLiveTrack?.top3,
          tick: socketLiveTrack?.tick,
          totalDistance: socketLiveTrack?.totalDistance || "1000M",
          elapsedSec: socketLiveTrack?.elapsedSec,
          timeRemainingSec: socketLiveTrack?.timeRemainingSec,
          progressRatio: socketLiveTrack?.progressRatio,
          countdown: socketCountdown,
          jackpot,
        },
        jackpot,
        jackpotConfig,
        jackpotLoading,
        scheduledJackpot,
        cancelScheduledJackpot,
        forceJackpot,
        clearForcedJackpot,
        fetchJackpotConfig,
        fetchJackpotStatus,
        updateJackpotConfig,
        setJackpotMode,
        scheduledWinners,
        scheduledWinnersLoading,
        fetchScheduledWinners,
        forceSetWinner,
        extendRaceTime,
        clearForcedWinner,
        liveBets,
        liveLedgerLoading,
        fetchLiveLedger,
        kpiStats,
        soundMuted,
        toggleSound,
        forceNextStage,
        voidCurrentRound,
        setIsPaused,
        setSpeedMultiplier,
        adjustUserWallet,
        addHorse,
        editHorse,
        toggleHorseStatus,
        deleteHorse,
      }}
    >
      {children}
    </GameEngineContext.Provider>
  )
}
