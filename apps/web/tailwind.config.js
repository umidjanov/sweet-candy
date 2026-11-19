/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        watch: "180px",
        xs: "360px",
        "3xl": "1920px",
      },
      colors: {
        sweet: {
          pink: "#E85D8E",
          "pink-dark": "#C83F72",
          "pink-light": "#FFF0F5",
          cream: "#FFF8EF",
          bg: "#FAF8F6",
          text: "#29252A",
          muted: "#817781",
          border: "#EEE6E9",
          chocolate: "#70452F",
          caramel: "#D99A52",
          success: "#269B69",
          warning: "#E7A23B",
          error: "#DC5151",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(232, 93, 142, 0.08)",
        card: "0 10px 30px -4px rgba(41, 37, 42, 0.05)",
      },
    },
  },
  plugins: [],
};
