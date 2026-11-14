'use client'

import { useState } from 'react'
import { StoreIcon } from './icons'
import { Modal } from './Modal'

const storeClass =
  'inline-flex min-h-11 items-center justify-center gap-2 self-center rounded-full border-2 border-teal-700 px-4 py-1 font-semibold text-teal-800 transition-colors hover:bg-teal-700 hover:text-white'

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
      <a href={links[0]} target="_blank" rel="noopener noreferrer" className={storeClass}>
        <StoreIcon size={24} />
        <span>
          Comprar en {shortDomain(links[0])}
          <span className="sr-only">: {name}</span>
        </span>
      </a>
    )
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={storeClass}>
        <StoreIcon size={24} />
        <span>
          Ver {links.length} opciones de compra
          <span className="sr-only"> de {name}</span>
        </span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Dónde comprar ${name}`} className="max-w-xl">
        <h2 className="mb-4 text-center font-header text-2xl">Dónde comprar</h2>
        <ul className="flex flex-row flex-wrap justify-center gap-4">
          {links.map((link, i) => (
            <li key={link} className="rounded-2xl border-2 border-solid border-teal-700 px-6 py-4">
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center text-teal-800 transition-all hover:scale-105 hover:text-red-700"
              >
                <StoreIcon />
                <span className="text-xl font-semibold text-tinta">Opción {i + 1}</span>
                <span className="text-sm text-tinta/80">{shortDomain(link)}</span>
              </a>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  )
}
