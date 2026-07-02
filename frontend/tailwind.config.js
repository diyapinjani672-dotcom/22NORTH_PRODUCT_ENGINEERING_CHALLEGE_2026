/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        night: {
          DEFAULT: 'rgb(var(--color-night) / <alpha-value>)',
          surface: 'rgb(var(--color-night-surface) / <alpha-value>)',
          raised: 'rgb(var(--color-night-raised) / <alpha-value>)',
          border: 'rgb(var(--color-night-border) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'rgb(var(--color-gold) / <alpha-value>)',
          soft: 'rgb(var(--color-gold-soft) / <alpha-value>)',
          dim: 'rgb(var(--color-gold-dim) / <alpha-value>)',
        },
        recovery: 'rgb(var(--color-recovery) / <alpha-value>)',
        disrupt: 'rgb(var(--color-disrupt) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
          faint: 'rgb(var(--color-ink-faint) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.35)',
      },
      backgroundImage: {
        'runway': 'linear-gradient(90deg, transparent, rgba(232,169,76,0.5), transparent)',
      },
      keyframes: {
        dash: {
          to: { strokeDashoffset: '-24' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
      animation: {
        dash: 'dash 1.2s linear infinite',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
