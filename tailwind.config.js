/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        surface: {
          900: '#0a0f0d',
          800: '#0f1612',
          700: '#141e18',
          600: '#1a2620',
          500: '#223029',
          400: '#2c3d34',
        },
        accent: {
          cyan:   '#06b6d4',
          amber:  '#f59e0b',
          red:    '#ef4444',
          green:  '#22c55e',
          purple: '#a855f7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-green':  '0 0 12px 2px rgba(34,197,94,0.45)',
        'glow-red':    '0 0 12px 2px rgba(239,68,68,0.45)',
        'glow-cyan':   '0 0 12px 2px rgba(6,182,212,0.35)',
        'glow-amber':  '0 0 12px 2px rgba(245,158,11,0.45)',
        'panel':       '0 4px 32px rgba(0,0,0,0.6)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
};
