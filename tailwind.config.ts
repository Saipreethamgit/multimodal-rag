import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:      "#080C14",
        bg2:     "#0D1117",
        panel:   "#0D1117",
        panel2:  "#111620",
        border:  "#1E2430",
        border2: "#252D3D",
        accent:  "#6C8EF5",
        accent2: "#8B6CF6",
        green:   "#3DD68C",
        muted:   "#8B95A8",
        ink:     "#E2E8F0",
      },
    },
  },
  plugins: [],
};

export default config;
