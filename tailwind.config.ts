import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rappi: {
          50: "#FFF5F2",
          100: "#FFE8E3",
          200: "#FFD0C7",
          300: "#FFA899",
          400: "#FF735C",
          500: "#FF441F",
          600: "#E6310C",
          700: "#C22405",
          800: "#991F07",
          900: "#7A1D0B",
          dark: "#0F172A",
        },
      },
    },
  },
  plugins: [],
};
export default config;
