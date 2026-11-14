'use client'

import { useState } from 'react'
import { Modal } from './Modal'
import { PlusCircleIcon } from './icons'
import { ProductForm } from './ProductForm'

/** Etiqueta en blanco, con el mismo tamaño que las demás, para añadir un regalo. */
export function AddProduct() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-64 w-full max-w-xs flex-col items-center justify-center gap-3 rounded-2xl border-[3px] border-dashed border-orange-600 bg-orange-50/70 p-6 text-center font-hand text-3xl text-tinta transition-colors hover:bg-orange-50"
      >
        <PlusCircleIcon size={48} />
        Añadir un regalo
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Añadir un regalo" className="max-w-xl">
        <ProductForm title="Añadir un regalo" submitLabel="Crear regalo" onSaved={() => setOpen(false)} />
      </Modal>
    </>
  )
}
