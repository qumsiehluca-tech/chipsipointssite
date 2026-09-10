import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Alpha Nu Tau brand tokens — deep heraldic purple + aged gold,
        // not the cream/terracotta or near-black/neon defaults.
        ink: "#160C24",        // near-black purple, page background
        lodge: "#241435",      // panel background, one step up from ink
        lodge2: "#2E1B42",     // hover / raised panel
        purple: "#4B2E83",     // primary brand purple (matches crest + workbook)
        purpleLight: "#7A5AA6",// secondary accent, links/active states
        gold: "#C6A664",       // primary accent — rank numerals, rules, totals
        goldBright: "#E4C384", // hover state on gold elements
        parchment: "#F4EFE3",  // primary text on dark background
        parchmentDim: "#B9AFC4" // secondary/muted text
      },
      fontFamily: {
        display: ["var(--font-garamond)", "Georgia", "serif"],
        body: ["var(--font-dmsans)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
export default config;
