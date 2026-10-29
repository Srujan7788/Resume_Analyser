/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#050816',
        panel: '#0d1324',
        surface: '#121d36',
        violet: '#8b5cf6',
        cyan: '#22d3ee',
        indigo: '#6366f1'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(139,92,246,0.35), 0 20px 45px rgba(99,102,241,0.25)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'sans-serif']
      },
      backgroundImage: {
        'hero-grid': 'radial-gradient(circle at top left, rgba(99,102,241,0.18), transparent 30%), radial-gradient(circle at bottom right, rgba(34,211,238,0.14), transparent 35%)'
      }
    }
  },
  plugins: []
};
