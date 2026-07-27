import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0B0E14",
          surface: "#151A24",
          elevated: "#1E2530",
        },
        accent: {
          primary: "#C9A227",
          secondary: "#2ED2C4",
        },
        state: {
          success: "#34C759",
          danger: "#FF4D4F",
          warning: "#FFB020",
        },
        text: {
          primary: "#F5F6F8",
          secondary: "#8A93A3",
        },
        border: {
          subtle: "#2A2F3A",
        },
      },
      borderRadius: {
        card: "12px",
        control: "8px",
        sheet: "20px",
      },
      boxShadow: {
        soft: "0 4px 24px rgba(0,0,0,0.4)",
      },
      fontFamily: {
        display: ["var(--font-inter)", "General Sans", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
