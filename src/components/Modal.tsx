'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { CloseCircleIcon } from './icons'

interface ModalProps {
  open: boolean
  onClose: () => void
  /** Nombre accesible del diálogo. */
  title: string
  children: ReactNode
  /** Clases extra para el ancho máximo, p. ej. "max-w-xl". */
  className?: string
}

/**
 * Diálogo modal sobre el elemento nativo <dialog>: gestiona el foco, Escape y
 * la capa de fondo. El contenido solo existe mientras está abierto, así los
 * formularios vuelven a su estado inicial cada vez que se abren.
 *
 * Estructura (clase `modal`, ver globals.css): el <dialog> es una capa transparente
 * que cubre el área VISIBLE de la pantalla y centra la tarjeta (`data-modal-panel`).
 * No se fía del centrado automático del navegador: en iOS Safari el teclado, la barra
 * de direcciones y el zoom mueven el viewport visual y los diálogos quedaban desplazados.
 * Mientras está abierto se copian a variables CSS la posición y el tamaño de
 * `window.visualViewport`, así la tarjeta siempre cabe en lo que se ve.
 */
export function Modal({ open, onClose, title, children, className = 'max-w-lg' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
    if (!open) return

    // Ajusta la capa al viewport visual (iOS: teclado, barra de direcciones, zoom).
    const viewport = window.visualViewport
    const fit = () => {
      if (!viewport) return
      dialog.style.setProperty('--modal-top', `${Math.round(viewport.offsetTop)}px`)
      dialog.style.setProperty('--modal-left', `${Math.round(viewport.offsetLeft)}px`)
      dialog.style.setProperty('--modal-w', `${Math.round(viewport.width)}px`)
      dialog.style.setProperty('--modal-h', `${Math.round(viewport.height)}px`)
    }
    fit()
    viewport?.addEventListener('resize', fit)
    viewport?.addEventListener('scroll', fit)

    // iOS puede desplazar la página al enfocar un campo; al cerrar volvemos donde estábamos.
    const { scrollX, scrollY } = window
    return () => {
      viewport?.removeEventListener('resize', fit)
      viewport?.removeEventListener('scroll', fit)
      if (window.scrollY !== scrollY || window.scrollX !== scrollX) window.scrollTo(scrollX, scrollY)
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        // La capa cubre toda la pantalla: solo llega aquí un toque fuera de la tarjeta.
        if (event.target === event.currentTarget) onClose()
      }}
      className="modal"
    >
      <div
        data-modal-panel
        className={`relative flex max-h-full w-full flex-col overflow-clip rounded-lg bg-etiqueta text-tinta shadow-xl ${className}`}
      >
        {/* El botón va fuera de la zona con scroll para no desaparecer al desplazarse */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-1 top-1 z-10 rounded-full bg-etiqueta transition-transform hover:scale-110"
        >
          <CloseCircleIcon />
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 pt-14 sm:p-8 sm:pt-14">
          {open ? children : null}
        </div>
      </div>
    </dialog>
  )
}
