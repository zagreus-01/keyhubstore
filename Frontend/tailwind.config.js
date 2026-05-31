/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        porcelain: "#f6f8fb",
        ink: "#101828",
        slateblue: "#173f7a",
        cyanline: "#18a7d8",
      },
      boxShadow: {
        premium: "0 24px 70px rgba(16, 24, 40, 0.10)",
        "premium-soft": "0 18px 48px rgba(23, 63, 122, 0.10)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
