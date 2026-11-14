'use client'

import { useSyncExternalStore } from 'react'
import { CopyLink } from './CopyLink'

const noopSubscribe = () => () => {}
const canShareNatively = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function'

/** Botones para compartir una carta: WhatsApp, el menú del móvil y copiar el enlace. */
export function ShareCarta({ path, text }: { path: string; text: string }) {
  // En el servidor no hay origen: los botones que lo necesitan aparecen al hidratar.
  const origin = useSyncExternalStore(noopSubscribe, () => window.location.origin, () => '')
  const native = useSyncExternalStore(noopSubscribe, canShareNatively, () => false)
  const url = origin ? new URL(path, origin).toString() : ''
  const button = 'inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2 text-lg font-semibold'

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {url && (
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${button} bg-green-700 text-white hover:bg-green-800`}
        >
          Enviar por WhatsApp
        </a>
      )}
      {url && native && (
        <button
          type="button"
          onClick={() => void navigator.share({ title: text, text, url }).catch(() => {})}
          className={`${button} bg-amber-200 text-tinta hover:bg-amber-300`}
        >
          Compartir…
        </button>
      )}
      <CopyLink path={path} />
    </div>
  )
}
