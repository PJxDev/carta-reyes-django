'use client'

import { useState } from 'react'

/** Muestra la URL pública de la carta y permite copiarla. */
export function CopyLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    const url = new URL(path, window.location.origin).toString()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copia este enlace:', url)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="min-h-11 max-w-full rounded-full bg-sky-200 px-5 py-2 text-lg font-semibold [overflow-wrap:anywhere] hover:bg-sky-300"
    >
      {copied ? '¡Enlace copiado!' : `Copiar enlace de mi carta (${path})`}
    </button>
  )
}
