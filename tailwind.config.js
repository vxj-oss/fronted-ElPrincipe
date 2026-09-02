/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1E3A8A',
          950: '#172554',
        },
        success: {
          light: '#dcfce7',
          DEFAULT: '#16a34a',
          dark: '#15803d',
        },
        warning: {
          light: '#ffedd5',
          DEFAULT: '#ea580c',
          dark: '#c2410c',
        },
        danger: {
          light: '#fee2e2',
          DEFAULT: '#dc2626',
          dark: '#b91c1c',
        },
        surface: {
          border: '#e2e8f0',
        },
        neutral: {
          text: '#0f172a',
          muted: '#64748b',
          light: '#94a3b8',
          line: '#cbd5e1',
        }
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      }
    },
  },
  plugins: [],
}