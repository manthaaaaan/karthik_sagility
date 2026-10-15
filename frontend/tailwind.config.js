/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F9FC",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#365CF5",
          hover: "#2A4CE0",
          light: "#EEF2FF",
          subtle: "#E4EAFF",
        },
        ink: {
          main: "#172033",
          secondary: "#687386",
          tertiary: "#94A3B8",
          muted: "#A1ACB8"
        },
        border: {
          subtle: "#E5EAF2",
          DEFAULT: "#E5EAF2",
          darker: "#D3DCE8"
        },
        mint: {
          DEFAULT: "#C9F7DF",
          text: "#0D6E42",
          subtle: "#F0FDF6"
        },
        lavender: {
          DEFAULT: "#EAE5FF",
          text: "#5E3CE6",
          subtle: "#F6F4FF"
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        editorial: ['Instrument Serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(23, 32, 51, 0.04), 0 1px 2px -1px rgba(23, 32, 51, 0.04)',
        'elevated': '0 4px 20px -2px rgba(23, 32, 51, 0.06), 0 2px 6px -2px rgba(23, 32, 51, 0.04)',
        'floating': '0 12px 36px -4px rgba(23, 32, 51, 0.08), 0 4px 12px -2px rgba(23, 32, 51, 0.05)',
        'focus-ring': '0 0 0 3px rgba(54, 92, 245, 0.18)',
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'dash': 'dash 1.5s linear infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        dash: {
          to: { strokeDashoffset: '-20' },
        }
      }
    },
  },
  plugins: [],
}
