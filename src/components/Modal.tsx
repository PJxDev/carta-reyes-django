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
 */
export function Modal({ open, onClose, title, children, className = 'max-w-lg' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        // Con padding 0 en <dialog>, solo la capa de fondo llega con target === dialog.
        if (event.target === event.currentTarget) onClose()
      }}
      className={`m-auto w-[calc(100%-1.5rem)] ${className} relative overflow-clip rounded-lg bg-etiqueta p-0 text-tinta shadow-xl`}
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
      <div className="max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain p-5 pt-14 sm:p-8 sm:pt-14">
        {open ? children : null}
      </div>
    </dialog>
  )
}
