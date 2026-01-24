/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      maxWidth: {
        'page': '1500px',
      },
      colors: {
        // Brand colors
        fdfffc: "#FDFFFC", // off-white
        brand: "#C5F800", // brand lime green
        "brand-lime": "#C5F800", // brand lime (alias)
        303130: "#303130", // dark gray
        cfd0ce: "#CFD0CE", // light gray

        // Keep original colors for backward compatibility
        accent: "#FFFFFF",
        "accent-dim": "#AAAAAA",
        "accent-dimmer": "#666666",
        "dark-black": "#0f0f12",
        "dark-900": "#0f0f12",
        "dark-800": "#121215",
        "dark-700": "#1a1a1e",
        "dark-600": "#222226",
        "dark-500": "#2a2a2e",
        "dark-400": "#383840",
        "dark-300": "#585860",
        "dark-200": "#787880",
        "dark-100": "#A0A0A8",
        "dark-50": "#C0C0C8",
        "glass-white": "rgba(255, 255, 255, 0.1)",
        "glass-black": "rgba(0, 0, 0, 0.3)",
        "accent-primary": "rgba(197, 248, 0, var(--tw-bg-opacity, 1))", // brand lime
        "accent-secondary": "rgba(207, 208, 206, var(--tw-bg-opacity, 1))", // CFD0CE
      },
      fontSize: {
        caption: "0.75rem", // 12px
        "body-compact": "0.875rem", // 14px
        body: "1rem", // 16px
        "heading-compact": "1.25rem", // 20px
        heading: "1.5rem", // 24px
        title: "2rem", // 32px
        display: "3rem", // 48px
      },
      spacing: {
        "spacing-01": "0.125rem", // 2px
        "spacing-02": "0.25rem", // 4px
        "spacing-03": "0.5rem", // 8px
        "spacing-04": "0.75rem", // 12px
        "spacing-05": "1rem", // 16px
        "spacing-06": "1.5rem", // 24px
        "spacing-07": "2rem", // 32px
        "spacing-08": "2.5rem", // 40px
        "spacing-09": "3rem", // 48px
      },
      borderRadius: {
        glass: "0.5rem",
        sharp: "0 0 16px 0",
        "asymmetric-1": "0 8px 0 8px",
        "asymmetric-2": "8px 0 8px 0",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-dark": "linear-gradient(to bottom, #303130, #3a3b3a)",
        "glass-gradient":
          "linear-gradient(135deg, rgba(207, 208, 206, 0.05), rgba(207, 208, 206, 0.02))",
        "gradient-main": "linear-gradient(135deg, #303130, #3a3b3a)",
        "gradient-accent": "linear-gradient(135deg, #C5F800 0%, #CFD0CE 100%)",
        "gradient-button":
          "linear-gradient(135deg, rgba(197, 248, 0, 0.4) 0%, rgba(207, 208, 206, 0.4) 100%)",
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        "pulse-slow": "pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "delay-200": "fadeIn 0.7s ease forwards 0.2s",
        "delay-400": "fadeIn 0.7s ease forwards 0.4s",
        "delay-600": "fadeIn 0.7s ease forwards 0.6s",
        "delay-800": "fadeIn 0.7s ease forwards 0.8s",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      backdropBlur: {
        glass: "12px",
      },
      boxShadow: {
        card: "0 8px 32px rgba(0, 0, 0, 0.1)",
        "card-hover": "0 12px 40px rgba(0, 0, 0, 0.15)",
        "button-primary":
          "0 4px 15px rgba(197, 248, 0, 0.2), inset 0 1px 1px rgba(253, 255, 252, 0.1)",
        "button-primary-hover":
          "0 6px 20px rgba(197, 248, 0, 0.3), inset 0 1px 1px rgba(253, 255, 252, 0.15)",
        "button-secondary":
          "0 4px 15px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(253, 255, 252, 0.05)",
        "button-secondary-hover":
          "0 6px 20px rgba(0, 0, 0, 0.15), inset 0 1px 1px rgba(253, 255, 252, 0.1)",
      },
      transitionProperty: {
        "all-transform": "all, transform",
      },
    },
  },
  plugins: [
    function ({ addComponents, theme }) {
      addComponents({
        ".glass": {
          background: "rgba(207, 208, 206, 0.03)",
          border: "1px solid rgba(253, 255, 252, 0.05)",
          backdropFilter: "blur(16px) saturate(180%)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
        },
        ".glass-dark": {
          background: "rgba(48, 49, 48, 0.7)",
          border: "1px solid rgba(253, 255, 252, 0.03)",
          backdropFilter: "blur(16px) saturate(180%)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
        },
        ".glow-border": {
          border: "1px solid rgba(197, 248, 0, 0.2)",
          boxShadow:
            "0 0 10px rgba(197, 248, 0, 0.1), 0 0 20px rgba(197, 248, 0, 0.05)",
        },
        ".glow-text": {
          textShadow: "0 0 5px rgba(197, 248, 0, 0.2)",
        },
        ".backdrop-blur-glass": {
          backdropFilter: "blur(16px) saturate(180%)",
        },
        ".backdrop-blur-glass-sm": {
          backdropFilter: "blur(8px) saturate(150%)",
        },
        ".gradient-text": {
          background: "linear-gradient(to right, #FDFFFC, #CFD0CE)",
          "-webkit-background-clip": "text",
          "background-clip": "text",
          color: "transparent",
        },
        ".shadow-glow": {
          boxShadow:
            "0 0 10px rgba(197, 248, 0, 0.15), 0 0 20px rgba(197, 248, 0, 0.1)",
        },
      });
    },
    function ({ addUtilities }) {
      const scrollbarUtilities = {
        ".scrollbar-thin": {
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#303130",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(207, 208, 206, 0.5)",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "rgba(207, 208, 206, 0.7)",
          },
        },
      };

      addUtilities(scrollbarUtilities, ["responsive", "hover"]);
    },
  ],
};
