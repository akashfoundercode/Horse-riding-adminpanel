import { useState, useEffect, useCallback } from 'react'
import { socketService } from '../services/socket.js'

export function useHorseRaceSocket(userToken = null, isAdmin = true) {
  const [socketStatus, setSocketStatus] = useState(socketService.getStatus())
  const [activePlayers, setActivePlayers] = useState(0)
  const [raceState, setRaceState] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const [liveTrack, setLiveTrack] = useState(null)
  const [raceResult, setRaceResult] = useState(null)
  const [adminMetrics, setAdminMetrics] = useState(null)
  const [liveLedgerBet, setLiveLedgerBet] = useState(null)
  const [liveWalletTx, setLiveWalletTx] = useState(null)
  const [liveBalanceUpdate, setLiveBalanceUpdate] = useState(null)
  const [liveRaceControlUpdate, setLiveRaceControlUpdate] = useState(null)
  const [liveTimeExtended, setLiveTimeExtended] = useState(null)
  const [liveJackpot, setLiveJackpot] = useState(null)
  const [liveBetPool, setLiveBetPool] = useState(null)
  const [liveSnapshot, setLiveSnapshot] = useState(null)

  useEffect(() => {
    // 1. Initialize Connection
    socketService.connect(undefined, userToken)

    // 2. Status change listener
    const unsubStatus = socketService.onStatusChange((stat) => {
      setSocketStatus(stat)
    })

    // 2b. Live Race Snapshot (admin:live_race_snapshot)
    const handleSnapshot = (snapshotData) => {
      if (snapshotData) {
        setLiveSnapshot({
          ...snapshotData,
          _receivedAt: Date.now()
        })
        if (snapshotData.raceState || snapshotData.state) {
          setRaceState(snapshotData.raceState || snapshotData.state)
        }
        if (snapshotData.betPool || snapshotData.horsePools) {
          setLiveBetPool(snapshotData.betPool || snapshotData.horsePools)
        }
      }
    }
    const unsubSnapshot = socketService.on('admin:live_race_snapshot', handleSnapshot)
    const unsubSnapshotAlt = socketService.on('race:snapshot', handleSnapshot)

    // 2c. Race State Changed (race:state_changed)
    const unsubStateChanged = socketService.on('race:state_changed', (state) => {
      if (state) setRaceState(state)
    })

    // 3. Live Active Players Count
    const unsubPlayers = socketService.on('active_players:update', (data) => {
      if (data && typeof data.activePlayers === 'number') {
        setActivePlayers(data.activePlayers)
      }
    })

    // 4. Initial Race State Snapshot
    const unsubState = socketService.on('race:current_state', (state) => {
      setRaceState(state)
    })

    // 5. Betting Window Open
    const unsubBetting = socketService.on('race:betting_open', (state) => {
      setRaceState(state)
      setLiveTrack(null)
      setRaceResult(null)
      setCountdown(null)
    })

    // 6. Countdown Ticks (3, 2, 1, GO)
    const unsubCountdown = socketService.on('race:countdown_tick', (data) => {
      setCountdown(data.countdown)
    })

    // 7. Live 1000M Running Track Simulation Frames (200ms frequency / 5 updates per sec)
    const handleTrackUpdate = (trackData) => {
      if (trackData) {
        setLiveTrack({
          ...trackData,
          _receivedAt: Date.now()
        })
      }
    }
    const unsubTrack = socketService.on('race:running_track', handleTrackUpdate)
    const unsubTrackUpdate = socketService.on('race:track_update', handleTrackUpdate)

    // 8. Race Result & Winner Announcement
    const unsubResult = socketService.on('race:result', (resultData) => {
      setRaceResult(resultData)
    })

    // 9. Real-Time Admin Metrics & Analytics
    const handleMetrics = (metrics) => {
      setAdminMetrics(metrics)
    }
    const unsubMetrics = socketService.on('admin:metrics_update', handleMetrics)
    const unsubAnalytics = socketService.on('admin:analytics_update', handleMetrics)
    const unsubMetricsAlt = socketService.on('analytics:update', handleMetrics)

    // 9b. Real-Time Bet Pool Stream (admin:bet_pool_update & bet:pool_update)
    const handleBetPool = (poolData) => {
      if (poolData) {
        setLiveBetPool({
          ...poolData,
          _receivedAt: Date.now()
        })
      }
    }
    const unsubBetPool = socketService.on('admin:bet_pool_update', handleBetPool)
    const unsubBetPoolAlt = socketService.on('bet:pool_update', handleBetPool)
    const unsubRacePool = socketService.on('race:pool_update', handleBetPool)

    // 10. Admin Live Ledger Stream (admin:bet_live, bet:ledger_entry, bet:placed, bet:new, etc.)
    const handleIncomingBet = (betData) => {
      if (betData) {
        const payload = betData.bet || betData.data || betData
        if (Array.isArray(payload)) {
          payload.forEach((b) => {
            if (b) setLiveLedgerBet({ ...b, _receivedAt: Date.now() })
          })
        } else {
          setLiveLedgerBet({
            ...payload,
            _receivedAt: Date.now()
          })
        }
      }
    }
    const unsubAdminBetLive = socketService.on('admin:bet_live', handleIncomingBet)
    const unsubBetLedgerEntry = socketService.on('bet:ledger_entry', handleIncomingBet)
    const unsubBetPlaced = socketService.on('bet:placed', handleIncomingBet)
    const unsubBetNew = socketService.on('bet:new', handleIncomingBet)
    const unsubBetCreated = socketService.on('bet:created', handleIncomingBet)
    const unsubNewBet = socketService.on('new_bet', handleIncomingBet)
    const unsubRaceBet = socketService.on('race:bet', handleIncomingBet)
    const unsubBetLive = socketService.on('bet:live', handleIncomingBet)

    // 11. Real-Time Wallet & Ledger Transaction Stream
    const handleIncomingTx = (txData) => {
      if (txData) {
        setLiveWalletTx({
          ...txData,
          _receivedAt: Date.now()
        })
      }
    }
    const unsubLedgerTx = socketService.on('ledger:transaction', handleIncomingTx)
    const unsubAdminWalletTx = socketService.on('admin:wallet_transaction', handleIncomingTx)
    const unsubAdminLedgerEntry = socketService.on('admin:ledger_entry', handleIncomingTx)
    const unsubWalletTx = socketService.on('wallet:transaction', handleIncomingTx)
    const unsubWalletLedger = socketService.on('wallet:ledger_entry', handleIncomingTx)

    // 12. Real-Time Balance Update Stream
    const handleBalanceUpdate = (balData) => {
      if (balData) {
        setLiveBalanceUpdate({
          ...balData,
          _receivedAt: Date.now()
        })
      }
    }
    const unsubWalletBal = socketService.on('wallet:balance', handleBalanceUpdate)
    const unsubWalletBalance = socketService.on('wallet:balance_update', handleBalanceUpdate)
    const unsubUserBalance = socketService.on('user:balance_update', handleBalanceUpdate)

    // 13. Admin Race Control Broadcast (admin:race_control_updated)
    const unsubRaceControl = socketService.on('admin:race_control_updated', (data) => {
      if (data) {
        setLiveRaceControlUpdate({
          ...data,
          _receivedAt: Date.now()
        })
      }
    })

    // 14. Real-Time Time Extended Broadcast (admin:time_extended & race:time_extended)
    const handleTimeExtended = (data) => {
      if (data) {
        setLiveTimeExtended({
          ...data,
          _receivedAt: Date.now()
        })
      }
    }
    const unsubTimeExtended = socketService.on('race:time_extended', handleTimeExtended)
    const unsubAdminTimeExtended = socketService.on('admin:time_extended', handleTimeExtended)

    // 15. Real-Time Jackpot Broadcast (race:jackpot & admin:jackpot_update)
    const handleIncomingJackpot = (data) => {
      if (data) {
        setLiveJackpot({
          ...data,
          _receivedAt: Date.now()
        })
      }
    }
    const unsubJackpot = socketService.on('race:jackpot', handleIncomingJackpot)
    const unsubAdminJackpot = socketService.on('admin:jackpot_update', handleIncomingJackpot)
    const unsubJackpotUpdate = socketService.on('jackpot:update', handleIncomingJackpot)

    return () => {
      unsubStatus?.()
      unsubSnapshot?.()
      unsubSnapshotAlt?.()
      unsubStateChanged?.()
      unsubPlayers?.()
      unsubState?.()
      unsubBetting?.()
      unsubCountdown?.()
      unsubTrack?.()
      unsubTrackUpdate?.()
      unsubResult?.()
      unsubMetrics?.()
      unsubAnalytics?.()
      unsubMetricsAlt?.()
      unsubBetPool?.()
      unsubBetPoolAlt?.()
      unsubRacePool?.()
      unsubAdminBetLive?.()
      unsubBetLedgerEntry?.()
      unsubBetPlaced?.()
      unsubBetNew?.()
      unsubBetCreated?.()
      unsubNewBet?.()
      unsubRaceBet?.()
      unsubBetLive?.()
      unsubLedgerTx?.()
      unsubAdminWalletTx?.()
      unsubAdminLedgerEntry?.()
      unsubWalletTx?.()
      unsubWalletLedger?.()
      unsubWalletBal?.()
      unsubWalletBalance?.()
      unsubUserBalance?.()
      unsubRaceControl?.()
      unsubTimeExtended?.()
      unsubAdminTimeExtended?.()
      unsubJackpot?.()
      unsubAdminJackpot?.()
      unsubJackpotUpdate?.()
    }
  }, [userToken, isAdmin])

  const reconnect = useCallback((customUrl) => {
    socketService.connect(customUrl, userToken)
  }, [userToken])

  const requestLiveSnapshot = useCallback(() => {
    socketService.emit('admin:live_race_snapshot:get')
  }, [])

  return {
    socket: socketService.socket,
    socketStatus,
    activePlayers,
    raceState,
    countdown,
    liveTrack,
    raceResult,
    adminMetrics,
    liveBetPool,
    liveLedgerBet,
    liveWalletTx,
    liveBalanceUpdate,
    liveRaceControlUpdate,
    liveTimeExtended,
    liveJackpot,
    liveSnapshot,
    requestLiveSnapshot,
    reconnect,
    emit: (event, data) => socketService.emit(event, data),
  }
}
