/** @type {import('tailwindcss').Config} */
module.exports = {
  // ... your existing config
  theme: {
    extend: {
      // ... your existing theme extensions
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "zoom-in-95": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "zoom-out-95": {
          from: { opacity: "1", transform: "scale(1)" },
          to: { opacity: "0", transform: "scale(0.95)" },
        },
        "slide-in-from-left-1/2": {
          from: { transform: "translateX(-50%) translateY(-48%) translateX(-50%)" },
          to: { transform: "translateX(-50%) translateY(-50%)" },
        },
        "slide-in-from-top-48": {
          from: { transform: "translateX(-50%) translateY(-48%) translateY(-50%)" },
          to: { transform: "translateX(-50%) translateY(-50%)" },
        },
        "slide-out-to-left-1/2": {
          from: { transform: "translateX(-50%) translateY(-50%)" },
          to: { transform: "translateX(-50%) translateY(-48%) translateX(-50%)" },
        },
        "slide-out-to-top-48": {
          from: { transform: "translateX(-50%) translateY(-50%)" },
          to: { transform: "translateX(-50%) translateY(-48%) translateY(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        "zoom-in-95": "zoom-in-95 0.2s ease-out",
        "zoom-out-95": "zoom-out-95 0.2s ease-out",
        "slide-in-from-left-1/2": "slide-in-from-left-1/2 0.2s ease-out",
        "slide-in-from-top-48": "slide-in-from-top-48 0.2s ease-out",
        "slide-out-to-left-1/2": "slide-out-to-left-1/2 0.2s ease-out",
        "slide-out-to-top-48": "slide-out-to-top-48 0.2s ease-out",
      },
    },
  },
  // ... rest of your config
};