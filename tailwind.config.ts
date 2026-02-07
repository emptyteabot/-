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
        // 项目1: 灵魂尸检 - 暗黑系配色
        soul: {
          bg: '#0a0a0f',
          card: '#13131a',
          accent: '#ff3366',
          glow: '#ff336633',
          text: '#e0e0e0',
          muted: '#666680',
        },
        // 项目2: AI算命 - 神秘紫金配色
        fortune: {
          bg: '#0d0b1a',
          card: '#1a1530',
          accent: '#ffd700',
          purple: '#8b5cf6',
          glow: '#ffd70033',
          text: '#f0e6ff',
          muted: '#6b5b8d',
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

