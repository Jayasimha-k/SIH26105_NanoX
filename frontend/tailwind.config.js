/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0B0F17',
          800: '#111827',
          700: '#1F2937',
          600: '#374151',
        },
        cyber: {
          blue: '#00F0FF',
          purple: '#7000FF',
          green: '#10B981',
          red: '#EF4444',
          amber: '#F59E0B'
        }
      }
    },
  },
  plugins: [],
}
