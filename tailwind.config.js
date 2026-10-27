/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Schibsted Grotesk"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        paper: '#F5F6F2',
        ink: { DEFAULT: '#15201B', 800: '#1D2B24', 700: '#2A3B32', 500: '#5A6B62', 400: '#7C8B83', 300: '#B9C2BC', 200: '#DDE2DD', 100: '#ECEFEA' },
        brand: { DEFAULT: '#0F6B4F', dark: '#0B5540', soft: '#E3F1EB' },
        ochre: { DEFAULT: '#D99A00', soft: '#FBF1D6', dark: '#8A6100' },
        brick: { DEFAULT: '#B4301F', soft: '#FBE9E6' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(21,32,27,0.05)',
        pop: '0 8px 24px rgba(21,32,27,0.14)',
      },
    },
  },
  plugins: [],
};
