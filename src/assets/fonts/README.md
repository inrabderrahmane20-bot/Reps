# Bundled site fonts

These WOFF2 fonts are bundled with the application to keep builds independent of the Google Fonts CSS service. The public layout and Puck preview share `src/lib/site-fonts.ts` and retain their original CSS variables and weight declarations.

Source: the official [Google Fonts repository](https://github.com/google/fonts), downloaded on 2026-11-12. Each family includes its original SIL Open Font License in its adjacent `*-OFL.txt` file. `manifest.json` records versions, source/bundled hashes, and pinned axes.

| Family | Official source directory | Version | Preserved axis settings |
| --- | --- | --- | --- |
| Playfair Display | `ofl/playfairdisplay` | 1.203 | Normal style; CSS weights 400, 500, 600, 700 |
| Manrope | `ofl/manrope` | 4.505 | CSS weights 400, 500, 600, 700 |
| Cairo | `ofl/cairo` | 3.130 | Slant pinned to 0; weight range 200–1000 |
| Familjen Grotesk | `ofl/familjengrotesk` | 2.002 | Normal style; CSS weights 500, 600, 700 |
| DM Sans | `ofl/dmsans` | 4.004 | Optical size pinned to 14; CSS weights 400, 500, 600 |

The downloaded versions match the fonts in the previous successful build. Cairo's slant and DM Sans's optical size were pinned using FontTools to match the existing Google CSS output. The fonts were compressed to WOFF2 with FontTools/Brotli; no font download or conversion is performed during application builds. Full character coverage is retained, including Arabic.
