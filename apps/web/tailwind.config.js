/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pingr: {
          bg: '#000000',
          text: '#E4E4E7',
          secondary: '#8B8B8E',
          link: '#60A5FA',
          success: '#22C55E',
          warning: '#FBBF24',
          error: '#EF4444',
        },
        category: {
          investor: '#818CF8',
          kol: '#F472B6',
          marketing: '#FBBF24',
          dev: '#4ADE80',
          founder: '#C084FC',
          bd: '#60A5FA',
          media: '#FB923C',
          other: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: [
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
      maxWidth: {
        app: '430px',
      },
    },
  },
  plugins: [],
}
