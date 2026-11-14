'use client'

import { useState } from 'react'

interface SafeImageProps {
  src: string
  alt: string
  className?: string
}

/** <img> externa que, si no carga, muestra un hueco con un regalo en vez de un icono roto. */
export function SafeImage({ src, alt, className = '' }: SafeImageProps) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-slate-300 text-4xl ${className}`}
      >
        🎁
      </div>
    )
  }
  return (
    // <img> a propósito: las URLs son de cualquier dominio y next/image exigiría declararlos.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  )
}
