import type { Config } from 'tailwindcss';

// Annabid terracotta identity — hot orange (FF6E00) over warm ivory neutrals.
//
// `terracotta` is the canonical brand ramp so every page matches the
// homepage coloring. `wine`, `sunset`, `majorelle` and `blue` are kept as
// legacy aliases pointing at terracotta so all pre-existing utilities keep
// working and now render in hot orange instead of burgundy.
const terracotta = {
  50: '#FFF7F0',
  100: '#FFEDDD',
  200: '#FFE3C4',
  300: '#FFD6A6',
  400: '#FFC278',
  500: '#FFB04E',
  600: '#FF8F22',
  700: '#FF6E00',
  800: '#CC5800',
  900: '#994200',
  950: '#662D00',
};


const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Brand ramp — hot orange / terracotta. Primary action colour.
        terracotta,
        // Legacy aliases for the previous brand ramps (kept for compatibility).
        wine: terracotta,
        sunset: terracotta,
        majorelle: terracotta,
        // The former blue utility ramp is remapped to terracotta so no bright
        // blue survives anywhere in the interface styling.
        blue: terracotta,
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
        card: '0 1px 2px rgba(33,24,32,0.04), 0 10px 28px -14px rgba(255,110,0,0.18)',
        float: '0 2px 4px rgba(33,24,32,0.04), 0 26px 52px -22px rgba(255,110,0,0.28)',
        // Layered "liquid glass" shadow: tight contact shadow + soft wine bloom.
        glass:
          '0 1px 0 rgba(255,255,255,0.75) inset, 0 -1px 0 rgba(255,255,255,0.35) inset, 0 2px 6px rgba(255,110,0,0.06), 0 18px 40px -16px rgba(255,110,0,0.26)',
        'glass-panel':
          '0 1px 0 rgba(255,255,255,0.7) inset, 0 2px 8px rgba(255,110,0,0.06), 0 30px 60px -24px rgba(255,110,0,0.32)',
        sunset: '0 8px 24px -10px rgba(255,110,0,0.45)',
      },
      letterSpacing: {
        tightest: '-0.03em',
      },
      backgroundImage: {
        zellige: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%Cg fill='none' stroke='%23FF6E00' stroke-opacity='0.10' stroke-width='1'%3E%3Cpath d='M28 0L38 10L28 20L18 10Z'/%3E%3Cpath d='M28 36L38 46L28 56L18 46Z'/%3E%3Cpath d='M0 28L10 18L20 28L10 38Z'/%3E%3Cpath d='M36 28L46 18L56 28L46 38Z'/%3E%3C/g%3E%3C/svg%3E\")",
        // Controlled brand gradient — used on small accents only.
        sunset: 'linear-gradient(135deg, #FFB04E 0%, #FF6E00 55%, #CC5800 100%)',
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
