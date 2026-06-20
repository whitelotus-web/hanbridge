import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#4f7cff",
          600: "#4361ee",
          700: "#3b3fcf",
          800: "#312e9e",
          900: "#2b2a7c"
        },
        accent: {
          500: "#7b3fe4",
          600: "#6d28d9"
        }
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #4f7cff 0%, #7b3fe4 100%)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
