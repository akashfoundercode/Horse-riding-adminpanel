import { TrendingUp, TrendingDown } from 'lucide-react'

const tones = {
  gold:   { bg: "bg-amber-500/10", text: "text-amber-500 dark:text-gold", border: "border-amber-500/25", glow: "group-hover:border-amber-500/40 group-hover:shadow-[0_0_20px_-4px_rgba(245,158,11,0.2)]" },
  blue:   { bg: "bg-primary/10",   text: "text-primary",                  border: "border-primary/25",   glow: "group-hover:border-primary/40 group-hover:shadow-[0_0_20px_-4px_rgba(59,110,246,0.2)]" },
  turf:   { bg: "bg-turf/10",      text: "text-turf",                     border: "border-turf/25",      glow: "group-hover:border-turf/40 group-hover:shadow-[0_0_20px_-4px_rgba(16,185,129,0.2)]" },
  danger: { bg: "bg-danger/10",    text: "text-danger",                   border: "border-danger/25",    glow: "group-hover:border-danger/40 group-hover:shadow-[0_0_20px_-4px_rgba(239,68,68,0.2)]" },
  violet: { bg: "bg-violet-500/10",text: "text-violet-500",               border: "border-violet-500/25",glow: "group-hover:border-violet-500/40 group-hover:shadow-[0_0_20px_-4px_rgba(139,92,246,0.2)]" },
  ink:    { bg: "bg-surface2",     text: "text-ink",                      border: "border-line",         glow: "group-hover:shadow-card" },
}

export default function StatCard({ label, value, sub, tone = 'blue', icon: Icon, trend, trendValue, onClick }) {
  const s = tones[tone] ?? tones.blue

  return (
    <div
      onClick={onClick}
      className={`group relative bg-surface border border-line rounded-2xl p-5 transition-all duration-200 shadow-card ${s.glow} ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-mute block">{label}</span>
          <div className="font-display text-2xl text-ink font-bold mt-1.5 num tracking-tight leading-none">{value}</div>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform duration-200 group-hover:scale-110 ${s.bg} ${s.text} ${s.border}`}>
            <Icon size={20} />
          </div>
        )}
      </div>

      {(sub || trendValue) && (
        <div className="mt-3 pt-3 border-t border-line/50 flex items-center justify-between text-xs">
          {sub && <span className="text-mute">{sub}</span>}
          {trendValue && (
            <span className={`inline-flex items-center gap-1 font-semibold ${trend === 'up' ? 'text-turf' : 'text-danger'}`}>
              {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trendValue}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
