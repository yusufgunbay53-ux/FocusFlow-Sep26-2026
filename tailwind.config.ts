import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        neon: "#00d2ff",
        night: "#0b111e",
        night2: "#121a2b",
        glass: "rgba(18, 26, 43, 0.55)",
      },
      boxShadow: {
        neon: "0 0 24px rgba(0, 210, 255, 0.25)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
