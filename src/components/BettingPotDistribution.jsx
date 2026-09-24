import { Coins, Trophy } from 'lucide-react'
import { useGameEngine } from '../hooks/useGameEngine.js'

export default function BettingPotDistribution() {
  const { horses, currentRace } = useGameEngine()
  const { totalPot, potDistribution, winner, stage } = currentRace

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 shadow-card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Coins size={17} />
          </div>
          <div>
            <h3 className="font-display text-base tracking-wide text-ink">Live Betting Pot Breakdown</h3>
            <span className="text-xs text-mute">Distribution across all 12 runners</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] uppercase font-bold text-mute tracking-wider">Total Round Pot</span>
          <div className="font-display text-xl text-amber-600 dark:text-gold font-bold num">
            ₹{totalPot.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {horses.map((horse) => {
          const horsePot = potDistribution[horse.id] || 0
          const percentage = totalPot > 0 ? ((horsePot / totalPot) * 100).toFixed(1) : 0
          const isWinner = stage === 'RESULT' && winner?.id === horse.id

          return (
            <div
              key={horse.id}
              className={`relative overflow-hidden p-3 rounded-xl border transition-all duration-200 ${isWinner
                ? 'bg-amber-500/15 border-amber-500/60 shadow-glow-gold'
                : 'bg-surface2 border-line hover:border-primary/50'
                }`}
            >
              {/* Top Row: Horse Number, Name & Odds */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: horse.color }}
                  >
                    {horse.number}
                  </div>
                  <span className="text-xs font-semibold text-ink truncate max-w-[70px]">
                    {horse.name.split(' ')[0]}
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-gold num">
                  {horse.odds}x
                </span>
              </div>

              {/* Amount and Percentage */}
              <div className="flex items-baseline justify-between text-xs mb-1.5">
                <span className="font-semibold text-ink num">₹{horsePot.toLocaleString()}</span>
                <span className="text-[11px] text-mute font-mono">{percentage}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-surface3 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(5, percentage))}%`,
                    backgroundColor: horse.color,
                  }}
                />
              </div>

              {isWinner && (
                <div className="absolute top-1 right-1 text-amber-500 animate-bounce">
                  <Trophy size={14} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

