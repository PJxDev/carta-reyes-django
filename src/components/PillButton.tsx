'use client'

import { useState, useTransition } from 'react'
import { despillarProductoAction, pillarProductoAction } from '@/app/actions/productos'
import type { PillStatus } from '@/lib/services/cartas'
import { ConfirmDialog } from './ConfirmDialog'

const banner =
  'flex min-h-11 w-full items-center justify-center rounded-lg px-3 py-2 text-center font-bold text-white'

export function PillButton({ id, status }: { id: string; status: PillStatus }) {
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (status === 'none') return null

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
      {status === 'taken' && <div className={`${banner} bg-red-400`}>PILLADO</div>}

      {status === 'free' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(pillarProductoAction)}
          className={`${banner} bg-emerald-400 hover:bg-emerald-500 disabled:opacity-60`}
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
            className={`${banner} bg-blue-400 hover:bg-blue-500 disabled:opacity-60`}
          >
            LO PILLASTE
          </button>
          <ConfirmDialog
            open={confirming}
            title="MODIFICAR ESTADO"
            message="Se va a proceder a cambiar el estado de este producto. ¿Desea proceder?"
            busy={pending}
            onConfirm={() => run(despillarProductoAction)}
            onCancel={() => setConfirming(false)}
          />
        </>
      )}

      {error && (
        <p role="alert" className="text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
