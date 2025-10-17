/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  darkMode: "class",
  theme: {
    extend: {
      animation: {
        "rocket-launch": "rocketLaunch 0.6s ease-out forwards",
        "float": "float 3s ease-in-out infinite",
        "orbit": "orbit 20s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "vapor-trail": "vaporTrail 1s ease-out forwards",
      },
      keyframes: {
        rocketLaunch: {
          "0%": {
            transform: "translateY(0) scale(1)",
            opacity: "1",
          },
          "50%": {
            transform: "translateY(-20px) scale(1.1)",
            opacity: "0.8",
          },
          "100%": {
            transform: "translateY(-100px) scale(0.5)",
            opacity: "0",
          },
        },
        float: {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-10px)",
          },
        },
        orbit: {
          "0%": {
            transform: "rotate(0deg) translateX(100px) rotate(0deg)",
          },
          "100%": {
            transform: "rotate(360deg) translateX(100px) rotate(-360deg)",
          },
        },
        vaporTrail: {
          "0%": {
            transform: "translateY(0) scale(1)",
            opacity: "0.6",
          },
          "100%": {
            transform: "translateY(-50px) scale(1.5)",
            opacity: "0",
          },
        },
      },
    },
  },
};
