/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tnnavy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          500: '#1F4E79',
          600: '#163a5c',
          700: '#102a43',
          800: '#0b1d2e',
        }
      }
    },
  },
  plugins: [],
}
