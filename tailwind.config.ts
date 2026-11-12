import type { Config } from 'tailwindcss';

// Moroccan Editorial Color System — based on the specified palette:
// Warm ivory background, deep emerald primary, forest green secondary,
// dark blue-green typography, terracotta accents, antique gold,
// pale sage selection states, soft ivory cards.

const ivory = '#F8EFE2';
const deepEmerald = '#064E43';
const forestGreen = '#093D35';
const darkBlueGreen = '#092D34';
const moroccanTerracotta = '#D65B32';
const antiqueGold = '#C6A77B';
const paleSage = '#DDE6D7';
const warmBeige = '#F3E5D3';
const softIvory = '#FFF9F0';
const white = '#FFFFFF';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Main background - warm ivory paper texture base
        'ivory-main': ivory,
        // Primary interface green - deep emerald
        'emerald-primary': deepEmerald,
        // Secondary green - forest green
        'green-secondary': forestGreen,
        // Main typography - dark blue-green
        'typography-main': darkBlueGreen,
        // Terracotta decorative accent
        'terracotta-accent': moroccanTerracotta,
        // Muted gold for borders and ornamental details
        'gold-muted': antiqueGold,
        // Selected state background
        'selection-state': paleSage,
        // Secondary warm beige background
        'beige-secondary': warmBeige,
        // Card background - soft ivory
        'card-soft': softIvory,
        // White
        'surface-white': white,

        // Extended palette derived from main colors
        ivory: ivory,
        beige: '#F5F0EB',
        sage: paleSage,
        terracotta: moroccanTerracotta,
        gold: antiqueGold,
        emerald: deepEmerald,
        forest: forestGreen,
        navy: darkBlueGreen,

        // Status colors
        success: '#0F523B',
        warning: '#B54708',
        error: '#B50F08',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'ui-serif', 'serif'],
        sans: ['"Manrope"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        arabic: ['"Cairo"', 'ui-sans-serif', 'sans-serif'],
      },
      borderRadius: {
        // Moroccan-inspired rounded corners
        card: '12px',
        button: '8px',
        nav: '6px',
        pill: '9999px',
      },
      boxShadow: {
        card: `0 1px 2px rgba(33,24,32,0.04), 0 10px 28px -14px rgba(6,78,67,0.18), 0 2px 0 rgba(214,91,50,0.08)`,
        float: `0 2px 4px rgba(33,24,32,0.04), 0 26px 52px -22px rgba(6,78,67,0.28)`,
        button: `0 1px 2px rgba(33,24,32,0.05), 0 2px 4px rgba(6,78,67,0.15)`,
        inset: 'inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(255,255,255,0.5)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      },
      borderWidth: {
        2: '2px',
        4: '4px',
      },
    },
  },
  plugins: [],
};
export default config;