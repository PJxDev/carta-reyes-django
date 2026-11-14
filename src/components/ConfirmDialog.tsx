'use client'

import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Sí',
  cancelLabel = 'No',
  busy = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} className="max-w-sm">
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-xl font-bold">{title}</h2>
        <p>{message}</p>
        <div className="flex w-full flex-wrap justify-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="min-h-11 min-w-24 rounded-full bg-emerald-300 px-5 font-semibold disabled:opacity-60"
          >
            {busy ? '…' : confirmLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="min-h-11 min-w-24 rounded-full bg-red-300 px-5 font-semibold disabled:opacity-60"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
