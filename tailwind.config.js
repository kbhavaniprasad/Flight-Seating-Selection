/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#0ea5e9',
          600: '#0284c7',
          900: '#0c4a6e',
        },
        seat: {
          available: '#10b981',
          availableLight: '#d1fae5',
          occupied: '#9ca3af',
          occupiedLight: '#e5e7eb',
          selected: '#2563eb',
          selectedLight: '#dbeafe',
          taken: '#dc2626',
          takenLight: '#fee2e2',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
