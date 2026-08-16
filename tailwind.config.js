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
          50: '#fdf7f9',
          100: '#fce7f1',
          200: '#f8d4e4',
          300: '#f3b7d0',
          400: '#ee8fb7',
          500: '#e56a9d', // primary blush-pink accent
          600: '#cf4d82',
          700: '#a83563',
        },
        rose: {
          50: '#fff8f7',
          100: '#fce8e8',
          200: '#f8c9c7',
          300: '#f4b2b0',
          500: '#d9827d', // rose-gold tone
          600: '#c26661',
          700: '#b25954',
          800: '#8c3d39',
        },
        gold: {
          100: '#fbf4e6',
          300: '#f3d9a5',
          500: '#d4af37',
          600: '#b89228',
          700: '#8c6d1a',
        },
        champagne: '#f8f4ef',
        ivory: '#faf8f5',
        charcoal: '#221c1d',
        'soft-black': '#1a1617',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        script: ['"Great Vibes"', 'cursive'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gold-shimmer': 'linear-gradient(135deg, #e56a9d 0%, #d4af37 50%, #e56a9d 100%)',
        'luxury-hero': 'radial-gradient(circle at 50% 0%, rgba(252, 231, 241, 0.6) 0%, rgba(250, 248, 245, 0) 70%)',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(236, 168, 188, 0.20)',
        luxury: '0 20px 40px -15px rgba(58, 45, 45, 0.08)',
        glow: '0 0 25px rgba(229, 106, 157, 0.3)',
        card: '0 4px 20px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 16px 36px rgba(229, 106, 157, 0.15)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
}
