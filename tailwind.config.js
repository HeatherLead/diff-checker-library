/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
      },
      colors: {
        maroon: {
          DEFAULT: '#7a1c4b',
          hover: '#61143a',
          light: '#9e2964',
        }
      }
    },
  },
  plugins: [],
}
