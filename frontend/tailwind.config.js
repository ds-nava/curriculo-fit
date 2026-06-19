/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nb: {
          bg: '#dee8f3',
          surface: '#ffffff',
          accent: '#84a2ca',
          'accent-light': '#b3c7e0',
          'accent-dark': '#5c7fa3',
          ink: '#1a1a1a',
          muted: '#6b7280',
          border: '#000000',
          success: '#22c55e',
          warning: '#f59e0b',
          danger: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      borderRadius: {
        brutal: '6px',
      },
      boxShadow: {
        brutal: '4px 4px 0px 0px #000000',
        'brutal-sm': '2px 2px 0px 0px #000000',
        'brutal-lg': '6px 6px 0px 0px #000000',
        'brutal-accent': '4px 4px 0px 0px #84a2ca',
      },
      translate: {
        'brutal-x': '4px',
        'brutal-y': '4px',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease-out both',
        'shake': 'shake 0.4s ease-in-out',
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        pulseDot: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.4)' },
        },
      },
    },
  },
  plugins: [],
};
