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
          50: '#f3f0fe',
          100: '#e9e5fd',
          500: '#7b66f0',
          600: '#5433eb',
          700: '#4527d6',
          800: '#4527d6',
          900: '#5433eb',
          950: '#2c1a8f',
        },
        slate: {
          50: '#f7f8f9',
          100: '#f2f4f5',
          200: '#ebebeb',
          300: '#dcdcdc',
          400: '#a5a19f',
          500: '#787574',
          600: '#5a5654',
          700: '#3a3736',
          800: '#2b2b32',
          900: '#17171b',
          950: '#0e0e11',
        },
        blue: {
          50: '#f3f0fe',
          100: '#e9e5fd',
          200: '#d9d2fb',
          300: '#b9aef7',
          400: '#9d8df5',
          500: '#7b66f0',
          600: '#5433eb',
          700: '#4527d6',
          800: '#3a1fa8',
          900: '#2c1a8f',
          950: '#1d1163',
        },
        indigo: {
          50: '#f3f0fe',
          100: '#e9e5fd',
          500: '#7b66f0',
          600: '#5433eb',
          700: '#4527d6',
          950: '#1d1163',
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
          border: '#ebebeb',
        },
        neutral: {
          text: '#0b0b0c',
          muted: '#787574',
          light: '#a5a19f',
          line: '#dcdcdc',
        }
      },
      boxShadow: {
        card: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
      }
    },
  },
  plugins: [],
}