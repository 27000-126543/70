/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        space: {
          950: "#050714",
          900: "#0a0e27",
          800: "#0f1530",
          700: "#161d42",
          600: "#1e2855",
        },
        plasma: {
          DEFAULT: "#00d4ff",
          50: "#e6fbff",
          100: "#b3f1ff",
          200: "#80e7ff",
          300: "#4dddff",
          400: "#1ad3ff",
          500: "#00d4ff",
          600: "#00a8cc",
          700: "#007c99",
          800: "#005066",
        },
        accretion: {
          DEFAULT: "#ffaa00",
          50: "#fff8e6",
          100: "#ffedb3",
          200: "#ffe280",
          300: "#ffd74d",
          400: "#ffcb1a",
          500: "#ffaa00",
          600: "#cc8800",
          700: "#996600",
          800: "#664400",
        },
        magnetic: {
          DEFAULT: "#a855f7",
          50: "#f5edff",
          100: "#e5d0ff",
          200: "#d4b3ff",
          300: "#c396ff",
          400: "#b379f7",
          500: "#a855f7",
          600: "#8644c6",
          700: "#653394",
        },
        jet: {
          DEFAULT: "#22d3ee",
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
        gravity: {
          DEFAULT: "#10b981",
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
        },
        alert: {
          DEFAULT: "#ff3b5c",
          50: "#fff1f3",
          100: "#ffe0e6",
          200: "#ffc2cf",
          300: "#ffa3b5",
          400: "#ff859e",
          500: "#ff3b5c",
          600: "#e02948",
          700: "#b31f39",
          800: "#801528",
        },
      },
      fontFamily: {
        orbitron: ["Orbitron", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 20s linear infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(0,212,255,0.5), 0 0 10px rgba(0,212,255,0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(0,212,255,0.8), 0 0 40px rgba(0,212,255,0.4)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 50% 50%, rgba(0,212,255,0.08) 0%, transparent 70%)",
        "accretion-gradient":
          "radial-gradient(ellipse at center, rgba(255,170,0,0.4) 0%, rgba(255,59,92,0.2) 50%, transparent 100%)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
