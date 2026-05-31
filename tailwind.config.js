/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7FAF9",
        surface: "#FFFFFF",
        surfaceAlt: "#F1F5F4",
        primary: {
          DEFAULT: "#1F6F6B",
          dark: "#0F1F1E",
        },
        text: {
          primary: "#0F1F1E",
          secondary: "#4B5B5A",
        },
        border: "#DDE6E4",
        status: {
          positive: "#2E7D5B",
          caution: "#B0892F",
          negative: "#B14A4A",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        panel: "0 14px 30px rgba(15, 31, 30, 0.05)",
        panelStrong: "0 18px 36px rgba(15, 31, 30, 0.14)",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        winnerReveal: {
          from: { opacity: "0", transform: "translateY(-10px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        trophyPop: {
          "0%": { transform: "scale(0.6) rotate(-12deg)", opacity: "0" },
          "60%": { transform: "scale(1.08) rotate(4deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.45s ease-out",
        winnerReveal: "winnerReveal 0.55s ease-out",
        trophyPop: "trophyPop 0.65s ease-out 0.15s both",
        shimmer: "shimmer 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
