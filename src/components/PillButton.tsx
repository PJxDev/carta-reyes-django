'use client'

import { useState, useTransition } from 'react'
import { despillarProductoAction, pillarProductoAction } from '@/app/actions/productos'
import type { PillStatus } from '@/lib/services/cartas'
import { ConfirmDialog } from './ConfirmDialog'

const banner =
  'flex min-h-11 w-full items-center justify-center rounded-full px-4 py-2 text-center font-bold tracking-wide text-white shadow-sm'

export function PillButton({ id, status }: { id: string; status: PillStatus }) {
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 'taken' lo dibuja la tarjeta como un sello sobre la imagen
  if (status === 'none' || status === 'taken') return null

  const run = (action: (id: string) => Promise<{ ok: boolean; error?: string }>) => {
    setError(null)
    startTransition(async () => {
      try {
        const result = await action(id)
        if (!result.ok) setError(result.error ?? 'No se ha podido completar la acción')
      } catch {
        setError('No se ha podido completar la acción. Inténtalo de nuevo.')
      }
      setConfirming(false)
    })
  }

  return (
    <div className="flex w-full flex-col gap-1">
      {status === 'free' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(pillarProductoAction)}
          className={`${banner} bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60`}
        >
          {pending ? '…' : 'PILLAR'}
        </button>
      )}

      {status === 'mine' && (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirming(true)}
            className={`${banner} bg-blue-700 hover:bg-blue-800 disabled:opacity-60`}
          >
            LO PILLASTE
          </button>
          <ConfirmDialog
            open={confirming}
            title="¿Liberar este regalo?"
            message="Volverá a estar disponible para que otra persona pueda pillarlo."
            confirmLabel="Sí, liberar"
            cancelLabel="Cancelar"
            busy={pending}
            onConfirm={() => run(despillarProductoAction)}
            onCancel={() => setConfirming(false)}
          />
        </>
      )}

      {error && (
        <p role="alert" className="text-center text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
