import type { Config } from 'tailwindcss';

// Moroccan Editorial Design System
// Warm ivory · deep emerald · forest · dark blue-green · terracotta · antique gold
//
// The named brand tokens below are the canonical values from the redesign.
// The legacy ramps (wine, sunset, majorelle, ink, sand, zellige, clay,
// saffron, peach, blue) are kept as aliases mapped onto the new palette so
// every existing utility keeps working and now renders in the new identity.

const emerald = {
  50: '#EDF6F3',
  100: '#D7EAE4',
  200: '#B0D5CB',
  300: '#7FB9AB',
  400: '#4D9888',
  500: '#2A7A69',
  600: '#0F5F4F',
  700: '#064E43',
  800: '#093D35',
  900: '#092D34',
  950: '#06211F',
};

const terracotta = {
  50: '#FCF1EC',
  100: '#F8E0D7',
  200: '#F0BFAE',
  300: '#E69A80',
  400: '#DD7553',
  500: '#D65B32',
  600: '#B84A26',
  700: '#963C1F',
  800: '#75301A',
  900: '#572415',
  950: '#33150C',
};

const gold = {
  50: '#FAF5EC',
  100: '#F3E8D4',
  200: '#E7D3B2',
  300: '#D9BC8F',
  400: '#C6A77B',
  500: '#B8915C',
  600: '#9A7544',
  700: '#7A5B34',
  800: '#5C4427',
  900: '#3E2E1B',
};

const sage = {
  50: '#F4F8F1',
  100: '#E9F1E3',
  200: '#DDE6D7',
  300: '#C8D8BF',
  400: '#A9C19B',
  500: '#86A676',
  600: '#66875A',
  700: '#4E6B45',
};

const ink = {
  900: '#092D34',
  800: '#0D3A41',
  700: '#1C4A50',
  600: '#345C60',
  500: '#4E6A6C',
  400: '#5B716E',
  300: '#849895',
};

const sand = {
  50: '#F8EFE2',
  100: '#F3E5D3',
  200: '#EFE0CB',
  300: '#E5DAC9',
};

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Canonical palette tokens.
        'ivory-main': '#F8EFE2',
        'emerald-primary': '#064E43',
        'green-secondary': '#093D35',
        'typography-main': '#092D34',
        'terracotta-accent': '#D65B32',
        'gold-muted': '#C6A77B',
        'selection-state': '#DDE6D7',
        'beige-secondary': '#F3E5D3',
        'card-soft': '#FFF9F0',
        'surface-white': '#FFFFFF',

        // Ramps.
        emerald,
        forest: emerald,
        terracotta,
        gold,
        sage,
        ink,
        sand,
        ivory: '#F8EFE2',
        beige: '#F3E5D3',
        line: '#E3D7C6',
        charcoal: '#092D34',
        muted: '#6E8585',

        // Legacy aliases mapped onto the new identity.
        wine: emerald,
        sunset: terracotta,
        majorelle: emerald,
        blue: emerald,
        zellige: emerald,
        peach: terracotta,
        clay: terracotta,
        saffron: gold,
      },
      fontFamily: {
        display: ['var(--font-display)', 'Playfair Display', 'ui-serif', 'serif'],
        sans: ['var(--font-sans)', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-arabic)', 'Cairo', 'ui-sans-serif', 'sans-serif'],
      },
      borderRadius: {
        arch: '999px 999px 12px 12px',
        card: '12px',
        button: '8px',
        nav: '6px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(9,45,52,0.04), 0 10px 28px -14px rgba(6,78,67,0.18), 0 2px 0 rgba(214,91,50,0.06)',
        float: '0 2px 4px rgba(9,45,52,0.04), 0 26px 52px -22px rgba(6,78,67,0.28)',
        button: '0 1px 2px rgba(9,45,52,0.05), 0 2px 4px rgba(6,78,67,0.15)',
        glass:
          '0 1px 0 rgba(255,255,255,0.75) inset, 0 -1px 0 rgba(255,255,255,0.35) inset, 0 2px 6px rgba(6,78,67,0.06), 0 18px 40px -16px rgba(6,78,67,0.22)',
        'glass-panel':
          '0 1px 0 rgba(255,255,255,0.7) inset, 0 2px 8px rgba(6,78,67,0.06), 0 30px 60px -24px rgba(6,78,67,0.28)',
        sunset: '0 8px 24px -10px rgba(214,91,50,0.4)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(255,255,255,0.5)',
      },
      letterSpacing: {
        tightest: '-0.03em',
      },
      backgroundImage: {
        zellige:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='%23C6A77B' stroke-opacity='0.16' stroke-width='1'%3E%3Cpath d='M28 0L38 10L28 20L18 10Z'/%3E%3Cpath d='M28 36L38 46L28 56L18 46Z'/%3E%3Cpath d='M0 28L10 18L20 28L10 38Z'/%3E%3Cpath d='M36 28L46 18L56 28L46 38Z'/%3E%3C/g%3E%3C/svg%3E\")",
        sunset: 'linear-gradient(135deg, #D65B32 0%, #B84A26 55%, #963C1F 100%)',
        'sunset-soft': 'linear-gradient(135deg, #FCF1EC 0%, #F8E0D7 60%, #F3E5D3 100%)',
        'emerald-soft': 'linear-gradient(135deg, #EDF6F3 0%, #DDE6D7 70%, #F8EFE2 100%)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.32, 0.72, 0, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'check-pop': {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'draw-ornament': {
          '0%': { strokeDashoffset: '120' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'check-pop': 'check-pop 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
        'draw-ornament': 'draw-ornament 1.6s ease-out both',
      },
    },
  },
  plugins: [],
};
export default config;
