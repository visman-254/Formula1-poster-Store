/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Lato', 'sans-serif'],
        fancy: ['"Lovers Quarrel"', 'cursive'],
      },
    },
  },

  
  darkMode: "class",
  plugins: [],
}
