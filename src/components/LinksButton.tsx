'use client'

import { useState } from 'react'
import { StoreIcon } from './icons'
import { Modal } from './Modal'

const storeClass =
  'self-center text-[#00bfd8] transition-all hover:scale-110 hover:text-red-500 rounded-full p-1'

/** Dominio legible de una URL: "www.amazon.es" → "amazon.es". */
export function shortDomain(url: string): string {
  try {
    return new URL(url).hostname.split('.').slice(-2).join('.')
  } catch {
    return url
  }
}

/** Un enlace → botón directo. Varios → botón que abre una lista. Ninguno → nada. */
export function LinksButton({ links, name }: { links: string[]; name: string }) {
  const [open, setOpen] = useState(false)
  if (links.length === 0) return null

  if (links.length === 1) {
    return (
      <a
        href={links[0]}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Ver ${name} en ${shortDomain(links[0])}`}
        className={storeClass}
      >
        <StoreIcon />
      </a>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ver las ${links.length} opciones de compra de ${name}`}
        className={storeClass}
      >
        <StoreIcon />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Dónde comprar ${name}`} className="max-w-xl">
        <ul className="flex flex-row flex-wrap justify-center gap-4">
          {links.map((link, i) => (
            <li key={link} className="rounded-full border-2 border-solid border-[#00bfd8] px-6 py-5">
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center text-[#00bfd8] transition-all hover:scale-110 hover:text-red-500"
              >
                <StoreIcon />
                <span className="text-xl font-semibold text-zinc-900">Opción {i + 1}</span>
                <span className="text-sm text-zinc-600">{shortDomain(link)}</span>
              </a>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  )
}

