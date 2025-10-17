export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        primary: "#5DADEC",
        secondary: "#FFFFFF",
        accent: "#1D4ED8",
        neutral: "#F3F4F6",
        success: "#22C55E",
        error: "#EF4444"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"]
      },
      borderRadius: {
        '4xl': '16px'
      },
      boxShadow: {
        'soft': '0 4px 6px rgba(0, 0, 0, 0.08)'
      }
    }
  }
}