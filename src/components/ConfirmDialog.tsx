'use client'

import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  busy?: boolean
  /** 'danger' pinta el botón de confirmar en rojo (borrados). */
  tone?: 'ok' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Sí',
  cancelLabel = 'Cancelar',
  busy = false,
  tone = 'ok',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} className="max-w-sm">
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="font-header text-2xl">{title}</h2>
        <p>{message}</p>
        <div className="flex w-full flex-wrap justify-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`min-h-11 min-w-24 rounded-full px-5 font-semibold text-white disabled:opacity-60 ${
              tone === 'danger' ? 'bg-red-700 hover:bg-red-800' : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
          >
            {busy ? '…' : confirmLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="min-h-11 min-w-24 rounded-full bg-orange-100 px-5 font-semibold text-tinta hover:bg-orange-200 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
