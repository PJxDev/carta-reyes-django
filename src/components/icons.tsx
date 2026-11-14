/**
 * Iconos SVG inline. Se mantienen aquí para no repetir el mismo SVG en cada
 * plantilla (en la versión Django estaban copiados en 6 sitios).
 * Los que usan `stroke="currentColor"` heredan el color del texto.
 */

type IconProps = { className?: string; size?: number }

export function HomeIcon({ className }: IconProps) {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 9.77746V16.2C5 17.8802 5 18.7203 5.32698 19.362C5.6146 19.9265 6.07354 20.3854 6.63803 20.673C7.27976 21 8.11984 21 9.8 21H14.2C15.8802 21 16.7202 21 17.362 20.673C17.9265 20.3854 18.3854 19.9265 18.673 19.362C19 18.7203 19 17.8802 19 16.2V5.00002M21 12L15.5668 5.96399C14.3311 4.59122 13.7133 3.90484 12.9856 3.65144C12.3466 3.42888 11.651 3.42893 11.0119 3.65159C10.2843 3.90509 9.66661 4.59157 8.43114 5.96452L3 12"
        stroke="#000000"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function StoreIcon({ className, size = 44 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="3" y1="21" x2="21" y2="21" />
      <path d="M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1h-18l2 -4h14l2 4" />
      <line x1="5" y1="21" x2="5" y2="10.85" />
      <line x1="19" y1="21" x2="19" y2="10.85" />
      <path d="M9 21v-4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v4" />
    </svg>
  )
}

export function CloseCircleIcon({ className, size = 44 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#e60000"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <line x1="14.1213" y1="9.87866" x2="9.8787" y2="14.1213" />
      <line x1="9.87866" y1="9.87866" x2="14.1213" y2="14.1213" />
    </svg>
  )
}

export function PencilIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 20h4L18.5 9.5a2.828 2.828 0 0 0-4-4L4 16v4" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  )
}

export function PlusCircleIcon({ className, size = 30 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} aria-hidden="true">
      <circle fill="#7ab9e8" cx="256" cy="256" r="256" />
      <path fill="#579adf" d="M256,0v512c141.385,0,256-114.615,256-256S397.385,0,256,0z" />
      <polygon
        fill="#f2f2f4"
        points="384,228.571 283.429,228.571 283.429,128 228.571,128 228.571,228.571 128,228.571 128,283.429 228.571,283.429 228.571,384 283.429,384 283.429,283.429 384,283.429"
      />
    </svg>
  )
}
