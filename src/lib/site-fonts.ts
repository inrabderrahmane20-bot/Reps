import localFont from 'next/font/local';

// Match the site's existing font weights. Files are bundled so builds never fetch Google Fonts.
export const playfairDisplay = localFont({
  src: [
    { path: '../assets/fonts/playfair-display.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/playfair-display.woff2', weight: '500', style: 'normal' },
    { path: '../assets/fonts/playfair-display.woff2', weight: '600', style: 'normal' },
    { path: '../assets/fonts/playfair-display.woff2', weight: '700', style: 'normal' },
  ], variable: '--font-display', display: 'swap', adjustFontFallback: 'Times New Roman',
});
export const manrope = localFont({
  src: [
    { path: '../assets/fonts/manrope.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/manrope.woff2', weight: '500', style: 'normal' },
    { path: '../assets/fonts/manrope.woff2', weight: '600', style: 'normal' },
    { path: '../assets/fonts/manrope.woff2', weight: '700', style: 'normal' },
  ], variable: '--font-sans', display: 'swap', adjustFontFallback: 'Arial',
});
export const cairo = localFont({
  src: '../assets/fonts/cairo.woff2', weight: '200 1000', style: 'normal',
  variable: '--font-arabic', display: 'swap', adjustFontFallback: 'Arial',
});
export const familjen = localFont({
  src: [
    { path: '../assets/fonts/familjen-grotesk.woff2', weight: '500', style: 'normal' },
    { path: '../assets/fonts/familjen-grotesk.woff2', weight: '600', style: 'normal' },
    { path: '../assets/fonts/familjen-grotesk.woff2', weight: '700', style: 'normal' },
  ], variable: '--font-home-display', display: 'swap', adjustFontFallback: 'Arial',
});
export const dmSans = localFont({
  src: [
    { path: '../assets/fonts/dm-sans.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/dm-sans.woff2', weight: '500', style: 'normal' },
    { path: '../assets/fonts/dm-sans.woff2', weight: '600', style: 'normal' },
  ], variable: '--font-home-sans', display: 'swap', adjustFontFallback: 'Arial',
});

export const siteFontClassName = `${playfairDisplay.variable} ${manrope.variable} ${cairo.variable} ${familjen.variable} ${dmSans.variable}`;
