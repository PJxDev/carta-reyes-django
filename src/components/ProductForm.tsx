'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { saveProductoAction } from '@/app/actions/productos'
import type { SaveState } from '@/app/actions/productos'
import type { ProductoView } from '@/lib/services/cartas'
import { LIMITS } from '@/lib/validation'
import { UrlListField } from './UrlListField'

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 rounded-md bg-emerald-700 px-5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
    >
      {pending ? 'Guardando…' : children}
    </button>
  )
}

interface ProductFormProps {
  /** Sin producto → formulario de alta. */
  product?: ProductoView
  title: string
  submitLabel: string
  onSaved: () => void
  /** Botón extra (p. ej. "Eliminar") a la izquierda de guardar. */
  extraAction?: React.ReactNode
}

export function ProductForm({ product, title, submitLabel, onSaved, extraAction }: ProductFormProps) {
  const [state, action] = useActionState<SaveState, FormData>(saveProductoAction, {})
  // Campos controlados: React 19 vacía los no controlados tras cada envío, también si hubo error.
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')

  useEffect(() => {
    if (state.savedAt) onSaved()
    // onSaved cambia en cada render del padre; solo importa el instante de guardado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.savedAt])

  return (
    <form action={action} className="flex flex-col items-stretch gap-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      <h3 className="text-center font-header text-2xl">{title}</h3>

      {state.error && (
        <p role="alert" className="text-center text-lg font-semibold text-red-700">
          {state.error}
        </p>
      )}

      <input
        name="name"
        type="text"
        required
        maxLength={LIMITS.nameMax}
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nombre"
        aria-label="Nombre"
        className="w-full rounded-md bg-white p-2 text-lg"
      />

      <UrlListField name="links" label="Enlaces de compra:" kind="link" initial={product?.links} />
      <UrlListField name="images" label="Imágenes:" kind="image" initial={product?.images} />

      <textarea
        name="description"
        rows={4}
        maxLength={LIMITS.descriptionMax}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Descripción"
        aria-label="Descripción"
        className="h-28 w-full resize-none rounded-md bg-white p-2 text-lg"
      />

      <div className="flex flex-row flex-wrap justify-center gap-4">
        {extraAction}
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  )
}
