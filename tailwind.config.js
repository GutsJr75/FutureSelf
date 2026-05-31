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
      }
    },
  },
  plugins: [],
};
