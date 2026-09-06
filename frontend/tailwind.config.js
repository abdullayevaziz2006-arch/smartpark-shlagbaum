/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ranch-red': '#bb0013',
        'academic-bg': '#f6faff',
        'charcoal': '#171c20',
        'muted-slate': '#606d7a',
        'surface-gray': '#eaeef3'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
