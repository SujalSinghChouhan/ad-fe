/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#FF6B00",
        "primary-dark": "#E55A00",
        secondary: "#00C853",
        surface: "#F8F9FA",
        "low-stock": "#E65100",
        "out-stock": "#D32F2F",
      },
      fontFamily: {
        jakarta: ['"Plus Jakarta Sans"', "sans-serif"],
        sans: ['"Plus Jakarta Sans"', "sans-serif"],
      },
      borderRadius: { "4xl": "2rem", "5xl": "2.5rem" },
      boxShadow: {
        "bottom-nav": "0 -8px 24px rgba(0,0,0,0.06)",
        "card": "0 2px 16px rgba(0,0,0,0.06)",
        "nav": "0 4px 24px rgba(0,0,0,0.15)",
      },
    },
  },
  plugins: [],
};
