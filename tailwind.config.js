/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        blush: {
          50: '#fdf2f6',
          100: '#fce7f1',
          200: '#f8d4e4',
          300: '#f3b7d0',
          400: '#ee8fb7',
          500: '#e56a9d', // primary blush-pink accent
          600: '#cf4d82',
        },
        rose: {
          100: '#fce8e8',
          300: '#f4b2b0',
          500: '#d9827d', // rose-gold tone
          700: '#b25954',
        },
        ivory: '#fdfcfb',
        charcoal: '#3a2d2d',
      },
      fontFamily: {
        display: ['"Great Vibes"', 'cursive'], // For headings
        body: ['"Playfair Display"', 'serif'] // For body text
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(236, 168, 188, 0.25)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
