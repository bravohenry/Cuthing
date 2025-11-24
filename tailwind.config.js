/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        dot: ['Pixelify Sans', 'monospace'],
      },
      colors: {
        nothing: {
          bg: 'var(--color-bg-base)',
          sidebar: 'var(--color-bg-sidebar)',
          card: 'var(--color-bg-card)',
          surface: 'var(--color-bg-surface)',
          input: 'var(--color-bg-input)',
          black: 'var(--color-text-main)',
          inverse: 'var(--color-text-inverse)',
          grey: 'var(--color-text-muted)',
          border: 'var(--color-border)',
          red: 'var(--color-red)',
        },
      },
      boxShadow: {
        soft: '0 4px 20px -4px rgba(0, 0, 0, 0.05)',
        float: '0 10px 30px -10px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};

