/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base:     "var(--bg-base)",
        panel:    "var(--bg-panel)",
        surface:  "var(--bg-surface)",
        surface2: "var(--bg-surface2)",
        surface3: "var(--bg-surface3)",
        line:     "var(--border-line)",
        lineSubtle: "var(--border-line-subtle)",
        ink:      "var(--text-ink)",
        inkSecondary: "var(--text-ink-secondary)",
        mute:     "var(--text-mute)",
        primary: {
          DEFAULT: "#3B6EF6",
          hover:   "#2855E0",
          dim:     "#1D3E8F",
          light:   "#EFF6FF",
          glow:    "rgba(59,110,246,0.35)",
        },
        gold: {
          DEFAULT: "#F59E0B",
          hover:   "#D97706",
          dim:     "#78350F",
          light:   "#FEF3C7",
          glow:    "rgba(245,158,11,0.35)",
        },
        turf: {
          DEFAULT: "#10B981",
          hover:   "#059669",
          dim:     "#064E3B",
          light:   "#ECFDF5",
          glow:    "rgba(16,185,129,0.35)",
        },
        danger: {
          DEFAULT: "#EF4444",
          hover:   "#DC2626",
          dim:     "#7F1D1D",
          light:   "#FEF2F2",
          glow:    "rgba(239,68,68,0.35)",
        },
        violet: {
          DEFAULT: "#8B5CF6",
          light:   "#F5F3FF",
        },
      },
      fontFamily: {
        display: ["Oswald", "sans-serif"],
        body:    ["Inter", "sans-serif"],
      },
      boxShadow: {
        card:           "var(--card-shadow)",
        'glow-primary': "0 0 24px -4px rgba(59,110,246,0.35)",
        'glow-gold':    "0 0 24px -4px rgba(245,158,11,0.35)",
        'glow-turf':    "0 0 24px -4px rgba(16,185,129,0.35)",
        'glow-danger':  "0 0 24px -4px rgba(239,68,68,0.35)",
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'gallop':       'gallop 0.6s infinite alternate ease-in-out',
        'marquee':      'marquee 25s linear infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%,100%': { opacity: 1 },
          '50%':     { opacity: 0.5 },
        },
        gallop: {
          '0%':   { transform: 'translateY(0px) rotate(0deg)' },
          '50%':  { transform: 'translateY(-3px) rotate(1deg)' },
          '100%': { transform: 'translateY(2px) rotate(-1deg)' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
