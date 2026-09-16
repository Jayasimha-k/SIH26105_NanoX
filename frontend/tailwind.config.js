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
        darkbg: '#0A0914',
        cardbg: '#141124',
        innerbg: '#0D0B18',
        violet: '#44174E',
        plum: '#662249',
        crimson: '#A34054',
        peach: '#ED9E5B',
        rosy: '#E9BCB9',
      }
    },
  },
  plugins: [],
}
