/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: "#98FB98",
          cyan: "#6495ED",
          purple: "#00D084",
          pink: "#FF840D",
        }
      },
    },
  },
  plugins: [],
}
