import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm paper backdrop + card surface (per design canvas)
        base: "#F1EFE9",
        surface: "#FAFAF7",
        panel: "#F7F5F0",
        // Ink
        ink: "#1E1C19",
        "ink-soft": "#4A463F",
        muted: "#7A7367",
        faint: "#A79F91",
        // Accent — warm orange / terracotta
        accent: "#F37021",
        "accent-deep": "#C4530F",
        // Dusty blue
        blue: "#4E7397",
        // Hairlines
        line: "#E4DFD5",
        "line-warm": "#DFDACF",
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "Menlo", "monospace"],
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "none" },
        },
        softIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        fadeUp: "fadeUp 900ms cubic-bezier(.2,.7,.3,1) both",
        softIn: "softIn 900ms ease both",
      },
    },
  },
  plugins: [],
};

export default config;
