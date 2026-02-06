/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ucd: {
          navy: "#002542",
          blue: "#008acc",
          green: "#00a651",
          gold: "#f2b705",
        },
      },
    },
  },
  plugins: [],
};
