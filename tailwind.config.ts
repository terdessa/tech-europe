import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        parchment: {
          50: "#FDFAF3", 100: "#FAF3E6", 200: "#F4E8D0", 300: "#EDE0C0",
          400: "#E0D0A8", 500: "#D4C5A9", 600: "#BBA87A", 700: "#9E8B60",
          800: "#7A6B4A", 900: "#5A4E36",
        },
        ink: {
          50: "#F5F0EB", 100: "#E0D5CA", 200: "#C5B4A0", 300: "#A08970",
          400: "#8B7355", 500: "#6B5540", 600: "#5C4033", 700: "#4A3228",
          800: "#3A2518", 900: "#2C1810", 950: "#1A0E08",
        },
        forest: {
          50: "#F0F4EF", 100: "#D4E0D1", 200: "#B0C8A8", 300: "#8AAF7E",
          400: "#6B9660", 500: "#4A6741", 600: "#3D5636", 700: "#345230",
          800: "#284025", 900: "#1C2E1A",
        },
        "deep-blue": {
          50: "#EDF1F5", 100: "#C9D5E2", 200: "#9BB3CC", 300: "#6D91B6",
          400: "#4A6FA5", 500: "#2B4162", 600: "#233550", 700: "#1B293E",
          800: "#131D2C", 900: "#0B111A",
        },
        gold: {
          50: "#FBF6E4", 100: "#F5EABC", 200: "#F0DE94", 300: "#E8CC6E",
          400: "#DEBA48", 500: "#D4AF37", 600: "#B8941E", 700: "#937614",
          800: "#6E580F", 900: "#493B0A",
        },
        leather: {
          50: "#F5EFEA", 100: "#E0D0C2", 200: "#C4A98F", 300: "#A8825C",
          400: "#8B6B4F", 500: "#6F4E37", 600: "#5F422F", 700: "#553A23",
          800: "#3E2A18", 900: "#271A0F",
        },
        moss: {
          50: "#F4F6EE", 100: "#DEE4CC", 200: "#C8D2AA", 300: "#B2C088",
          400: "#A0B07A", 500: "#8A9A5B", 600: "#748249", 700: "#5E6A3B",
          800: "#48522D", 900: "#323A1F",
        },
      },
      fontFamily: {
        cinzel: ["Cinzel", "serif"],
        crimson: ["Crimson Text", "serif"],
        quattro: ["Quattrocento", "serif"],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(212,175,55,0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(212,175,55,0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "ink-flow": {
          "0%": { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
        "quill-write": {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.6s ease-out",
        "fade-up": "fade-up 0.6s ease-out",
        breathe: "breathe 4s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "ink-flow": "ink-flow 2s ease-out forwards",
        "quill-write": "quill-write 1.5s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
