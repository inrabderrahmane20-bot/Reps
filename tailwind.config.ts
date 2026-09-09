import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Majorelle — the iconic Marrakech blue, primary brand color
        majorelle: {
          50: '#EEF1FB',
          100: '#D6DCF4',
          200: '#AEB9E9',
          300: '#7C8FDB',
          400: '#4A5FC7',
          500: '#2A3FA8',
          600: '#1B3F8B',
          700: '#162F68',
          800: '#12234C',
          900: '#0D1936',
        },
        // Kasbah clay — earthen red-ochre from pisé walls
        clay: {
          50: '#FBF0EA',
          100: '#F3D7C7',
          200: '#E5AF8E',
          300: '#D4855A',
          400: '#C1652F',
          500: '#A6501F',
          600: '#853E17',
          700: '#642E12',
        },
        // Saffron — souk spice accent
        saffron: {
          400: '#E8A33D',
          500: '#D08A22',
          600: '#A66D1B',
        },
        // Zellige green — tilework accent, used for success/verified states
        zellige: {
          400: '#3E8B76',
          500: '#2E6B5E',
          600: '#215048',
        },
        sand: {
          50: '#FCFAF6',
          100: '#F5EFE3',
          200: '#EDE4D3',
          300: '#E2D4BC',
        },
        ink: {
          900: '#1D1A16',
          700: '#3A352C',
          500: '#6B6355',
          300: '#A69C89',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-serif', 'serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-arabic)', 'ui-sans-serif', 'sans-serif'],
      },
      borderRadius: {
        arch: '999px 999px 12px 12px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(29,26,22,0.06), 0 8px 24px -12px rgba(29,26,22,0.18)',
        float: '0 2px 4px rgba(29,26,22,0.05), 0 24px 48px -20px rgba(18,35,76,0.35)',
      },
      letterSpacing: {
        tightest: '-0.03em',
      },
      backgroundImage: {
        zellige: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='%231B3F8B' stroke-opacity='0.08' stroke-width='1'%3E%3Cpath d='M28 0L38 10L28 20L18 10Z'/%3E%3Cpath d='M28 36L38 46L28 56L18 46Z'/%3E%3Cpath d='M0 28L10 18L20 28L10 38Z'/%3E%3Cpath d='M36 28L46 18L56 28L46 38Z'/%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
export default config;
