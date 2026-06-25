import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        volt: {
          black: "#050505",
          panel: "#0b0f14",
          card: "#111820",
          card2: "#151d27",
          line: "#263240",
          yellow: "#f7c400",
          yellow2: "#ffdf4a",
          ok: "#22c55e",
          warn: "#f59e0b",
          err: "#ef4444"
        }
      },
      boxShadow: {
        glow: "0 0 34px rgba(247,196,0,.24)",
        soft: "0 22px 70px rgba(0,0,0,.38)"
      }
    }
  },
  plugins: []
};

export default config;
