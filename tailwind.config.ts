import type { Config } from 'tailwindcss';

// REPS sunset identity — orange / amber / coral over warm neutrals.
//
// `sunset` is the canonical brand ramp. `majorelle` is kept as a legacy alias
// with the exact same values so every pre-existing `majorelle-*` utility keeps
// working (and now renders in the warm sunset identity instead of blue).
const sunset = {
  50: '#FFF7ED',
  100: '#FFEDD5',
  200: '#FED7AA',
  300: '#FDBA74',
  400: '#FB923C',
  500: '#F97316',
  600: '#EA580C',
  700: '#C2410C',
  800: '#9A3412',
  900: '#7C2D12',
};

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Brand ramp — sunset orange. Primary action colour.
        sunset,
        // Legacy alias for the previous brand ramp (kept for compatibility).
        majorelle: sunset,
        // Soft peach — tinted surfaces behind warm content.
        peach: {
          50: '#FFF7F2',
          100: '#FFF0E5',
          200: '#FFE1CC',
          300: '#FBC9A6',
        },
        // Kasbah clay — earthy secondary accent (terracotta).
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
        // Saffron — warm amber accent (stars, ratings, highlights).
        saffron: {
          400: '#E8A33D',
          500: '#D08A22',
          600: '#A66D1B',
        },
        // Zellige green — used for success / verified states.
        zellige: {
          400: '#3E8B76',
          500: '#2E6B5E',
          600: '#215048',
        },
        // Warm neutrals — background, surfaces, borders.
        sand: {
          50: '#FFFCF8',
          100: '#FBF4EC',
          200: '#F0E5DC',
          300: '#E4D3C4',
        },
        ink: {
          900: '#24201E',
          700: '#4B443E',
          500: '#78716C',
          300: '#B5A79C',
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
        card: '0 1px 2px rgba(36,32,30,0.05), 0 8px 24px -12px rgba(124,45,18,0.20)',
        float: '0 2px 4px rgba(36,32,30,0.04), 0 24px 48px -20px rgba(124,45,18,0.32)',
        // Layered "liquid glass" shadow: tight contact shadow + soft warm bloom.
        glass:
          '0 1px 0 rgba(255,255,255,0.75) inset, 0 -1px 0 rgba(255,255,255,0.35) inset, 0 2px 6px rgba(124,45,18,0.06), 0 18px 40px -16px rgba(124,45,18,0.30)',
        'glass-panel':
          '0 1px 0 rgba(255,255,255,0.7) inset, 0 2px 8px rgba(124,45,18,0.06), 0 30px 60px -24px rgba(124,45,18,0.35)',
        sunset: '0 8px 24px -10px rgba(234,88,12,0.45)',
      },
      letterSpacing: {
        tightest: '-0.03em',
      },
      backgroundImage: {
        zellige: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%Cg fill='none' stroke='%23C2410C' stroke-opacity='0.10' stroke-width='1'%3E%3Cpath d='M28 0L38 10L28 20L18 10Z'/%3E%3Cpath d='M28 36L38 46L28 56L18 46Z'/%3E%3Cpath d='M0 28L10 18L20 28L10 38Z'/%3E%3Cpath d='M36 28L46 18L56 28L46 38Z'/%3E%3C/g%3E%3C/svg%3E\")",
        // Controlled brand gradient — used on small accents only.
        sunset: 'linear-gradient(135deg, #F97316 0%, #FB923C 55%, #FBBF24 100%)',
        'sunset-soft': 'linear-gradient(135deg, #FFF7ED 0%, #FFF0E5 60%, #FFE1CC 100%)',
      },
      transitionTimingFunction: {
        // iOS-style spring easing used by the floating search.
        spring: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
};
export default config;
