/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2B1B12",
        bg: "#F6F1E7",
        surface: "#FFFFFF",
        border: "#E4D9C7",
        muted: "#8C7B6B",
        accent: {
          DEFAULT: "#7A4A28",
          dark: "#5E3A1F",
          light: "#9C6A45",
        },
        revenue: "#3F6B4A",
        expense: "#A23B3B",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
