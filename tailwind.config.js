/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        m3: {
          primary: '#6750A4',
          onPrimary: '#FFFFFF',
          primaryContainer: '#EADDFF',
          onPrimaryContainer: '#21005D',
          secondary: '#625B71',
          onSecondary: '#FFFFFF',
          surface: '#FEF7FF',
          onSurface: '#1D1B20',
          outline: '#79747E',
        }
      }
    },
  },
  plugins: [],
}
