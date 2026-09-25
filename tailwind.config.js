/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/client/**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        ink: '#10131a',
        panel: '#171b24',
        line: '#2b3240',
        accent: '#8b5cf6',
        mint: '#32d6a0',
      },
      boxShadow: { canvas: '0 30px 80px rgba(0,0,0,.35)' },
    },
  },
  plugins: [],
};
