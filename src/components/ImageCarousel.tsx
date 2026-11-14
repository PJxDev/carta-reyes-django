'use client'

import { useState } from 'react'
import { SafeImage } from './SafeImage'

const arrow =
  'absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-orange-500/60 pb-1 font-header text-xl text-zinc-900 hover:bg-orange-500/80'

export function ImageCarousel({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0)
  const count = images.length

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg"
      role="group"
      aria-roledescription="carrusel"
      aria-label={`Imágenes de ${name}`}
    >
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(${index * -100}%)` }}
      >
        {images.map((src, i) => (
          <div key={src} className="min-w-full" aria-hidden={i !== index}>
            <SafeImage
              src={src}
              alt={`${name}, imagen ${i + 1} de ${count}`}
              className="h-60 w-full object-cover object-center"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-label="Imagen anterior"
        onClick={() => setIndex((index - 1 + count) % count)}
        className={`${arrow} left-2`}
      >
        &lt;
      </button>
      <button
        type="button"
        aria-label="Imagen siguiente"
        onClick={() => setIndex((index + 1) % count)}
        className={`${arrow} right-2`}
      >
        &gt;
      </button>
      <p className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 text-sm text-white" aria-hidden="true">
        {index + 1}/{count}
      </p>
    </div>
  )
}
