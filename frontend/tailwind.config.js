/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          1: "#2BF5E7",
          2: "#28DFE5",
          3: "#24C5E4",
          4: "#20A9E8",
          5: "#1D85E8",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #2BF5E7 0%, #1D85E8 100%)",
      },
      boxShadow: {
        glow: "0 0 30px rgba(43,245,231,0.25)",
        "glow-lg": "0 0 50px rgba(43,245,231,0.35)",
      },
    },
  },
  plugins: [],
};
