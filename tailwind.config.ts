import type { Config } from 'tailwindcss';

// Annabid burgundy identity — deep wine / raspberry over warm ivory neutrals.
//
// `wine` is the canonical brand ramp. `sunset` and `majorelle` are kept as
// legacy aliases with the exact same values so every pre-existing utility
// keeps working (and now renders in the burgundy identity instead of orange).
const wine = {
  50: '#FBF2F7',
  100: '#F7E3EE',
  200: '#EFC7DD',
  300: '#DF9FC3',
  400: '#C96FA3',
  500: '#AA3E7D',
  600: '#8A1350',
  700: '#650A3D',
  800: '#4E0730',
  900: '#3A102A',
  950: '#2A0A1E',
};

const sunset = wine;

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Brand ramp — deep burgundy / wine. Primary action colour.
        wine,
        // Legacy aliases for the previous brand ramps (kept for compatibility).
        sunset,
        majorelle: wine,
        // The former blue utility ramp is remapped to burgundy so no bright
        // blue survives anywhere in the interface styling.
        blue: wine,
        // Soft rose — tinted surfaces behind burgundy content.
        peach: {
          50: '#FBF2F7',
          100: '#F7E3EE',
          200: '#EFC7DD',
          300: '#DF9FC3',
        },
        // Kasbah clay — earthy secondary accent, reserved for warnings/errors.
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
        ivory: '#FAF7F4',
        beige: '#F2ECE7',
        line: '#E8E2E6',
        charcoal: '#211820',
        muted: '#858085',
        sand: {
          50: '#FAF7F4',
          100: '#F6F1EC',
          200: '#F2ECE7',
          300: '#E8E2E6',
        },
        ink: {
          900: '#211820',
          700: '#4A3F47',
          500: '#6F6670',
          400: '#858085',
          300: '#A9A2A8',
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
        card: '0 1px 2px rgba(33,24,32,0.04), 0 10px 28px -14px rgba(101,10,61,0.18)',
        float: '0 2px 4px rgba(33,24,32,0.04), 0 26px 52px -22px rgba(101,10,61,0.28)',
        // Layered "liquid glass" shadow: tight contact shadow + soft wine bloom.
        glass:
          '0 1px 0 rgba(255,255,255,0.75) inset, 0 -1px 0 rgba(255,255,255,0.35) inset, 0 2px 6px rgba(101,10,61,0.06), 0 18px 40px -16px rgba(101,10,61,0.26)',
        'glass-panel':
          '0 1px 0 rgba(255,255,255,0.7) inset, 0 2px 8px rgba(101,10,61,0.06), 0 30px 60px -24px rgba(101,10,61,0.32)',
        sunset: '0 8px 24px -10px rgba(101,10,61,0.45)',
      },
      letterSpacing: {
        tightest: '-0.03em',
      },
      backgroundImage: {
        zellige: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%Cg fill='none' stroke='%23650A3D' stroke-opacity='0.10' stroke-width='1'%3E%3Cpath d='M28 0L38 10L28 20L18 10Z'/%3E%3Cpath d='M28 36L38 46L28 56L18 46Z'/%3E%3Cpath d='M0 28L10 18L20 28L10 38Z'/%3E%3Cpath d='M36 28L46 18L56 28L46 38Z'/%3E%3C/g%3E%3C/svg%3E\")",
        // Controlled brand gradient — used on small accents only.
        sunset: 'linear-gradient(135deg, #8A1350 0%, #650A3D 55%, #3A102A 100%)',
        'sunset-soft': 'linear-gradient(135deg, #FBF2F7 0%, #F7E3EE 60%, #F2ECE7 100%)',
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
