/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        fadeSlide: "fadeSlide 2s ease-out",
        fadeIn: "fadeIn 0.15s ease-out",
        marquee: "marquee 18s linear infinite",
      },
      keyframes: {
        fadeSlide: {
          "0%": { opacity: "0", transform: "translateX(-50px)" },
          "50%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "1", transform: "translateX(10px)" },
        },
        fadeIn: {
          "0%":   { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
