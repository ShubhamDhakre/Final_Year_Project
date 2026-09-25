/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#070B14",
      },
      boxShadow: {
        // Floating shadows cast onto the background plane beneath hovering glass elements
        floating: "0 14px 34px -8px rgba(0, 0, 0, 0.55), 0 4px 12px -2px rgba(0, 0, 0, 0.35), inset 0 1px 1px 0 rgba(255, 255, 255, 0.22)",
        "floating-hover": "0 24px 48px -10px rgba(0, 0, 0, 0.75), 0 8px 20px -3px rgba(0, 0, 0, 0.45), inset 0 1px 2px 0 rgba(255, 255, 255, 0.35)",
        
        glass: "0 14px 34px -8px rgba(0, 0, 0, 0.55), 0 4px 12px -2px rgba(0, 0, 0, 0.35), inset 0 1px 1px 0 rgba(255, 255, 255, 0.22)",
        "glass-hover": "0 24px 48px -10px rgba(0, 0, 0, 0.75), 0 8px 20px -3px rgba(0, 0, 0, 0.45), inset 0 1px 2px 0 rgba(255, 255, 255, 0.35)",
        
        glow: "0 4px 20px -2px rgba(99, 102, 241, 0.25), 0 2px 6px 0 rgba(0, 0, 0, 0.15)",
        realistic: "0 10px 24px -6px rgba(0, 0, 0, 0.45), 0 2px 6px -1px rgba(0, 0, 0, 0.25)",
        soft: "0 4px 12px -2px rgba(0, 0, 0, 0.30), 0 1px 3px 0 rgba(0, 0, 0, 0.15)",
        subtle: "0 2px 6px -1px rgba(0, 0, 0, 0.20)",
      },
    },
  },
  plugins: [],
};
