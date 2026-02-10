import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 项目1: 灵魂尸检 - OpenAI / Google light-ish palette
        soul: {
          bg: '#ffffff',
          card: '#ffffff',
          accent: '#10a37f',
          glow: '#10a37f1f',
          text: '#0f172a',
          muted: '#475569',
        },
        // 项目2: AI算命 - Google-ish blue/violet
        fortune: {
          bg: '#ffffff',
          card: '#ffffff',
          accent: '#1a73e8',
          purple: '#6366f1',
          glow: '#1a73e81a',
          text: '#0f172a',
          muted: '#475569',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'card-flip': 'card-flip 0.6s ease-in-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%': { boxShadow: '0 0 20px rgba(255,51,102,0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(255,51,102,0.6)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'card-flip': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
export default config

