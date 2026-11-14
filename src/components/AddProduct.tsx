'use client'

import { useState } from 'react'
import { Modal } from './Modal'
import { PlusCircleIcon } from './icons'
import { ProductForm } from './ProductForm'

export function AddProduct() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg bg-slate-50 p-4 text-center text-xl">
      <span>Puedes añadir cosas a tu carta haciendo click aquí:</span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Añadir producto"
        className="flex size-11 items-center justify-center rounded-full transition-transform hover:scale-110"
      >
        <PlusCircleIcon />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Añadir producto" className="max-w-xl">
        <ProductForm title="AÑADIR PRODUCTO" submitLabel="Crear Producto" onSaved={() => setOpen(false)} />
      </Modal>
    </div>
  )
}
