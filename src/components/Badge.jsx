const tones = {
  turf: "bg-turf/15 text-turf border-turf/30 dark:bg-turf/20 dark:border-turf/40",
  gold: "bg-gold/15 text-amber-600 dark:text-gold border-gold/30 dark:bg-gold/20 dark:border-gold/40",
  amber: "bg-amber/15 text-amber-600 dark:text-amber border-amber/30 dark:bg-amber/20 dark:border-amber/40",
  danger: "bg-danger/15 text-danger border-danger/30 dark:bg-danger/20 dark:border-danger/40",
  blue: "bg-primary/15 text-primary border-primary/30 dark:bg-primary/20 dark:border-primary/40",
  violet: "bg-violet/15 text-violet border-violet/30 dark:bg-violet/20 dark:border-violet/40",
  ink: "bg-surface2 text-inkSecondary border-line dark:bg-surface3 dark:text-ink dark:border-line",
}

const dots = {
  turf: "bg-turf",
  gold: "bg-gold",
  amber: "bg-amber",
  danger: "bg-danger",
  blue: "bg-primary",
  violet: "bg-violet",
  ink: "bg-mute",
}

export default function Badge({ children, tone = "ink", dot = false, size = "md", className = "" }) {
  const toneClass = tones[tone] ?? tones.ink
  const dotClass = dots[tone] ?? dots.ink
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${toneClass} ${sizeClass} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full live-dot ${dotClass}`} />}
      {children}
    </span>
  )
}
