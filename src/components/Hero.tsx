import { HERO_IMAGE_ALT, HERO_IMAGE_URL } from '@/lib/site'

/** Posiciones fijas (no aleatorias) para que el servidor y el navegador pinten lo mismo. */
const STARS: ReadonlyArray<readonly [number, number, number]> = [
  [60, 40, 1.6], [140, 120, 1.2], [210, 60, 2], [300, 150, 1.3], [390, 35, 1.5], [455, 105, 1.2],
  [520, 25, 1.8], [690, 30, 1.4], [760, 125, 1.7], [835, 55, 1.3], [905, 150, 1.2], [980, 40, 2],
  [1050, 110, 1.4], [1120, 60, 1.7], [1170, 150, 1.2], [260, 210, 1.1], [850, 215, 1.2], [1010, 205, 1.3],
  [110, 215, 1.2], [610, 200, 1.0]
]

/** Cielo de noche en el desierto con la estrella que guía a los Reyes. Ilustración propia. */
function Sky() {
  return (
    <svg
      viewBox="0 0 1200 400"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hero-cielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2559" />
          <stop offset="0.55" stopColor="#4a3f8f" />
          <stop offset="1" stopColor="#e8896b" />
        </linearGradient>
        <radialGradient id="hero-brillo">
          <stop offset="0" stopColor="#fde68a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hero-cola" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" stopOpacity="0.8" />
          <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1200" height="400" fill="url(#hero-cielo)" />
      {STARS.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#fff7d6" opacity="0.85" />
      ))}
      {/* cola de la estrella */}
      <path d="M600 70 L250 215 L262 200 Z" fill="url(#hero-cola)" />
      {/* la estrella: lo único que se mueve */}
      <g className="origin-[600px_70px] motion-safe:animate-twinkle" style={{ transformBox: 'view-box' }}>
        <circle cx="600" cy="70" r="70" fill="url(#hero-brillo)" />
        <path d="M600 14 L610 60 L656 70 L610 80 L600 126 L590 80 L544 70 L590 60 Z" fill="#fde68a" />
        <path d="M600 40 L605 65 L630 70 L605 75 L600 100 L595 75 L570 70 L595 65 Z" fill="#fff" transform="rotate(45 600 70)" />
      </g>
      {/* dunas */}
      <path d="M0 318 C150 280 300 292 450 322 S760 352 910 312 S1100 284 1200 312 V400 H0 Z" fill="#2c2b63" />
      <path d="M0 362 C200 334 380 352 560 366 S900 380 1200 344 V400 H0 Z" fill="#1b2559" />
    </svg>
  )
}

export function Hero() {
  return (
    <div className="relative w-11/12 max-w-5xl overflow-hidden rounded-3xl bg-noche shadow-lg">
      {HERO_IMAGE_URL ? (
        <>
          {/* <img> a propósito: ruta propia o externa; next/image exigiría declarar el dominio */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_IMAGE_URL} alt={HERO_IMAGE_ALT} className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-noche/70 to-noche/10" aria-hidden="true" />
        </>
      ) : (
        <Sky />
      )}
      <div className="relative flex min-h-64 flex-col items-center justify-center px-4 pb-14 pt-20 text-center md:min-h-80 md:pt-24">
        <h1 className="font-header text-3xl text-amber-50 [text-shadow:0_2px_14px_rgb(27_37_89/0.9)] sm:text-4xl md:text-5xl">
          Queridos Reyes Magos ...
        </h1>
      </div>
    </div>
  )
}
