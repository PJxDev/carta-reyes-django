'use client'

import { useState, useTransition } from 'react'
import { deleteProductoAction } from '@/app/actions/productos'
import type { ProductoView } from '@/lib/services/cartas'
import { ConfirmDialog } from './ConfirmDialog'
import { PencilIcon } from './icons'
import { Modal } from './Modal'
import { ProductCard } from './ProductCard'
import { ProductForm } from './ProductForm'

/** Tarjeta del editor: botón de lápiz, diálogo de edición y borrado con confirmación. */
export function EditableCard({ product }: { product: ProductoView }) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, startDelete] = useTransition()

  const remove = () =>
    startDelete(async () => {
      try {
        const result = await deleteProductoAction(product.id)
        if (result.ok) {
          setConfirming(false)
          setEditing(false)
        } else {
          setError(result.error ?? 'No se ha podido borrar')
          setConfirming(false)
        }
      } catch {
        setError('No se ha podido borrar. Inténtalo de nuevo.')
        setConfirming(false)
      }
    })

  return (
    <ProductCard
      product={product}
      corner={
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`Editar ${product.name}`}
          className="absolute right-1 top-1 flex size-11 items-center justify-center rounded-full bg-white text-tinta shadow transition-transform hover:scale-110"
        >
          <PencilIcon />
        </button>
      }
    >
      <Modal open={editing} onClose={() => setEditing(false)} title={`Editar ${product.name}`} className="max-w-xl">
        {error && (
          <p role="alert" className="mb-3 text-center text-lg font-semibold text-red-700">
            {error}
          </p>
        )}
        <ProductForm
          product={product}
          title="Editar regalo"
          submitLabel="Guardar"
          onSaved={() => setEditing(false)}
          extraAction={
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="min-h-11 rounded-md bg-red-700 px-5 font-semibold text-white hover:bg-red-800"
            >
              Eliminar
            </button>
          }
        />
        <ConfirmDialog
          open={confirming}
          title="¿Borrar este regalo?"
          message="Se quitará de tu carta y no se puede deshacer."
          confirmLabel="Sí, borrar"
          cancelLabel="Cancelar"
          tone="danger"
          busy={deleting}
          onConfirm={remove}
          onCancel={() => setConfirming(false)}
        />
      </Modal>
    </ProductCard>
  )
}
