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
        darkbg: '#F8FAFC',
        cardbg: '#FFFFFF',
        innerbg: '#F1F5F9',
        violet: '#DBEAFE',
        plum: '#BFDBFE',
        crimson: '#2563EB',
        peach: '#0284C7',
        rosy: '#0F172A',
      }
    },
  },
  plugins: [],
}
