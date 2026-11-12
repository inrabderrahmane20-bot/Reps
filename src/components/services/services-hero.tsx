'use client';

import { useTranslations } from 'next-intl';

/**
 * Editorial services hero.
 *
 * The left column carries the typographic composition and a terracotta
 * brush underline; the right column is an original, lightweight watercolour
 * style SVG of Marrakech (Koutoubia minaret, palms, Atlas mountains and a
 * warm sunset) so the page never depends on a remote photograph.
 */
export function ServicesHero() {
  const t = useTranslations('services');

  return (
    <section className="svc-hero svc-grain" aria-labelledby="services-hero-title">
      <span className="moroccan-corner moroccan-corner--tl" aria-hidden>
        <CornerOrnament />
      </span>
      <span className="moroccan-corner moroccan-corner--tr" aria-hidden>
        <CornerOrnament />
      </span>

      <div className="mx-auto grid max-w-[1200px] px-5 py-8 sm:px-8 sm:py-12 lg:py-16">
        <div className="svc-hero-grid">
          <div className="min-w-0 animate-fade-up">
            <span className="svc-hero-kicker">{t('heroKicker')}</span>
            <h1 id="services-hero-title">
              {t('heroTitle')}
              <span className="svc-hero-underline" aria-hidden>
                <svg viewBox="0 0 92 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M2 7.5C17 2.5 34 1.5 51 3.5c13 1.5 26 3 39 1.5"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="svc-hero-lead">{t('heroSubtitle')}</p>
          </div>

          <div className="svc-hero-art animate-fade-up" aria-hidden>
            <MarrakechIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}

function CornerOrnament() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 118V40C2 19 19 2 40 2h78" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M14 118V46c0-18 14-32 32-32h72" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" opacity="0.7" />
      <path d="M40 18l9 9-9 9-9-9 9-9z" stroke="currentColor" strokeWidth="0.9" />
      <path d="M18 40l6 6-6 6-6-6 6-6z" stroke="currentColor" strokeWidth="0.7" opacity="0.8" />
      <circle cx="40" cy="40" r="2.2" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

/** Original watercolour-inspired Marrakech scene. */
export function MarrakechIllustration() {
  return (
    <svg viewBox="0 0 560 430" fill="none" xmlns="http://www.w3.org/2000/svg" role="presentation">
      <defs>
        <radialGradient id="svc-sky" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(390 78) rotate(128) scale(330 300)">
          <stop stopColor="#FBE7D3" />
          <stop offset="0.5" stopColor="#F8EFE2" />
          <stop offset="1" stopColor="#DDE6D7" stopOpacity="0.5" />
        </radialGradient>
        <linearGradient id="svc-mountain-far" x1="90" y1="150" x2="470" y2="240" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C6A77B" stopOpacity="0.55" />
          <stop offset="1" stopColor="#DDE6D7" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="svc-mountain-near" x1="40" y1="190" x2="500" y2="290" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B8915C" stopOpacity="0.55" />
          <stop offset="1" stopColor="#C6A77B" stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id="svc-wall" x1="150" y1="230" x2="420" y2="380" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F3E5D3" />
          <stop offset="1" stopColor="#E7D3B2" />
        </linearGradient>
        <linearGradient id="svc-tower" x1="300" y1="120" x2="340" y2="330" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F0BFAE" />
          <stop offset="0.55" stopColor="#E69A80" />
          <stop offset="1" stopColor="#D65B32" />
        </linearGradient>
        <linearGradient id="svc-palm" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#4D9888" />
          <stop offset="1" stopColor="#064E43" />
        </linearGradient>
        <filter id="svc-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
      </defs>

      {/* Woven arch frame */}
      <path
        d="M40 402V208c0-104 64-168 240-168s240 64 240 168v194"
        stroke="#C6A77B"
        strokeOpacity="0.55"
        strokeWidth="1.6"
      />
      <path
        d="M54 402V212c0-96 60-156 226-156s226 60 226 156v190"
        stroke="#C6A77B"
        strokeOpacity="0.28"
        strokeWidth="1"
      />

      {/* Sky wash */}
      <ellipse cx="300" cy="190" rx="230" ry="170" fill="url(#svc-sky)" />

      {/* Sun */}
      <circle cx="404" cy="118" r="36" fill="#D65B32" opacity="0.16" />
      <circle cx="404" cy="118" r="24" fill="#D65B32" opacity="0.32" filter="url(#svc-soft)" />
      <circle cx="404" cy="118" r="18" fill="#DD7553" opacity="0.55" />

      {/* Atlas mountains */}
      <path
        d="M42 258l70-72 46 44 58-84 62 86 52-52 70 78 66-44 52 44v60H42v-60z"
        fill="url(#svc-mountain-far)"
      />
      <path
        d="M18 286l64-58 52 44 60-72 66 78 60-48 72 66 64-42 66 56v66H18v-90z"
        fill="url(#svc-mountain-near)"
      />
      <path d="M204 178l24 34 20-18 18 20-28 22-18-18-16 12z" fill="#FFF9F0" opacity="0.65" />
      <path d="M316 200l26 36 22-16 16 18-30 20-18-16-14 10z" fill="#FFF9F0" opacity="0.55" />

      {/* City wall and buildings */}
      <path d="M54 336h452v66H54z" fill="url(#svc-wall)" />
      <path d="M54 336h452" stroke="#C6A77B" strokeOpacity="0.5" strokeWidth="1.2" />

      {/* Left riad with horseshoe arches */}
      <path d="M76 336v-70c0-16 12-28 28-28s28 12 28 28v70" fill="#FFF9F0" stroke="#C6A77B" strokeOpacity="0.55" />
      <path d="M136 336v-52c0-13 10-23 23-23s23 10 23 23v52" fill="#F3E5D3" stroke="#C6A77B" strokeOpacity="0.45" />
      <path d="M96 336v-40c0-9 7-16 16-16s16 7 16 16v40" fill="#E69A80" opacity="0.55" />
      <path d="M148 336v-28c0-8 6-14 14-14s14 6 14 14v28" fill="#DD7553" opacity="0.4" />

      {/* Koutoubia minaret */}
      <path d="M292 336V186h44v150z" fill="url(#svc-tower)" />
      <path d="M292 336V186h44v150z" stroke="#B84A26" strokeOpacity="0.35" />
      <path d="M286 186h56l-8-14h-40l-8 14z" fill="#D65B32" />
      <path d="M306 172V140h16v32z" fill="#D65B32" />
      <path d="M314 118l10 22h-20l10-22z" fill="#C6A77B" />
      <path d="M314 104v14" stroke="#C6A77B" strokeWidth="2" strokeLinecap="round" />
      <circle cx="314" cy="100" r="4" fill="#C6A77B" />
      {/* Windows */}
      {[212, 244, 276, 308].map((y) => (
        <g key={y}>
          <path d={`M306 ${y}h16v10c0 5-4 8-8 8s-8-3-8-8v-10z`} fill="#064E43" opacity="0.55" />
          <path d={`M306 ${y}h16`} stroke="#FFF9F0" strokeOpacity="0.6" />
        </g>
      ))}
      {/* Decorative bands */}
      <path d="M292 196h44M292 226h44M292 256h44M292 286h44" stroke="#FFF9F0" strokeOpacity="0.35" strokeWidth="2" />

      {/* Right buildings */}
      <path d="M356 336v-86c0-18 14-32 32-32s32 14 32 32v86" fill="#FFF9F0" stroke="#C6A77B" strokeOpacity="0.55" />
      <path d="M432 336v-64c0-14 11-25 25-25s25 11 25 25v64" fill="#F3E5D3" stroke="#C6A77B" strokeOpacity="0.45" />
      <path d="M378 336v-52c0-10 8-18 18-18s18 8 18 18v52" fill="#E69A80" opacity="0.45" />
      <path d="M452 336v-34c0-8 6-14 14-14s14 6 14 14v34" fill="#DD7553" opacity="0.38" />

      {/* Palms */}
      <PalmTree x={122} y={336} scale={1.15} />
      <PalmTree x={486} y={336} scale={0.95} />
      <PalmTree x={40} y={336} scale={0.7} />

      {/* Ground */}
      <ellipse cx="280" cy="404" rx="250" ry="16" fill="#C6A77B" opacity="0.22" />
      <path d="M54 402h452" stroke="#C6A77B" strokeOpacity="0.4" strokeWidth="1.2" />

      {/* Small terracotta blossoms */}
      {[
        [92, 132],
        [498, 158],
        [172, 108],
      ].map(([x, y], i) => (
        <g key={i} opacity="0.7">
          <circle cx={x} cy={y} r="3" fill="#D65B32" />
          <circle cx={x + 7} cy={y - 6} r="2.4" fill="#DD7553" />
          <circle cx={x - 6} cy={y - 4} r="2" fill="#E69A80" />
          <path d={`M${x} ${y}v14`} stroke="#4D9888" strokeWidth="1" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

function PalmTree({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 0c0-26 3-52 10-78" stroke="#7A5B34" strokeWidth="5" strokeLinecap="round" />
      <path d="M10 -78c-16-14-30-18-44-16 12 8 22 18 30 30M10 -78c16-12 32-14 46-10-13 7-25 16-34 28M10 -78c-2-20 2-36 12-48 2 15 2 29 0 42M10 -78c10-18 22-28 38-32-6 14-16 26-28 35" fill="url(#svc-palm)" />
      <path d="M10 -78c-8-16-20-26-36-30 5 13 14 24 26 33" fill="url(#svc-palm)" opacity="0.85" />
    </g>
  );
}
