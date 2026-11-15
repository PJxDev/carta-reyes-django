'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ThemeToggle } from './ThemeToggle'

const MENU_ID = 'menu-principal'

/**
 * Parte derecha de la barra: interruptor de tema, botón de menú y enlaces.
 * - Desde `nav` (1200 px) los enlaces van siempre en la fila y no hay botón.
 * - En móvil quedan tras un botón de menú (hamburguesa) y se despliegan debajo de la barra,
 *   apilados y a todo el ancho.
 * El menú se cierra al elegir un enlace, al cambiar de página y con Escape (el foco vuelve al botón).
 */
export function NavMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()

  // Al cambiar de página el menú se cierra.
  useEffect(() => setOpen(false), [pathname])

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      setOpen(false)
      button.current?.focus()
    }
  }

  return (
    <>
      <div className="ml-auto flex items-center gap-2 nav:order-last nav:ml-0 nav:gap-4" onKeyDown={onKeyDown}>
        <ThemeToggle />
        <button
          ref={button}
          type="button"
          aria-expanded={open}
          aria-controls={MENU_ID}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-12 min-w-12 items-center justify-center rounded-full bg-etiqueta text-tinta transition-transform hover:scale-105 nav:hidden"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      <ul
        id={MENU_ID}
        onKeyDown={onKeyDown}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('a, button')) setOpen(false)
        }}
        className={`order-last w-full flex-col gap-2 pt-1 nav:order-none nav:flex nav:w-auto nav:flex-1 nav:flex-row nav:items-center nav:gap-4 nav:pt-0 ${
          open ? 'flex' : 'hidden'
        }`}
      >
        {children}
      </ul>
    </>
  )
}
