/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
      },
      boxShadow: {
        glow: '0 0 40px rgba(129, 140, 248, 0.5)',
      },
    },
  },
  plugins: [],
}
