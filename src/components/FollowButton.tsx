'use client'

import { useState, useTransition } from 'react'
import { followAction } from '@/app/actions/seguidos'

/** Seguir / dejar de seguir una carta. El cambio se ve al instante y se revierte si falla. */
export function FollowButton({ username, following }: { username: string; following: boolean }) {
  const [value, setValue] = useState(following)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const toggle = () => {
    const next = !value
    setValue(next)
    setError(null)
    start(async () => {
      try {
        const result = await followAction(username, next)
        if (!result.ok) {
          setValue(!next)
          setError(result.error ?? 'No se ha podido cambiar')
        }
      } catch {
        setValue(!next)
        setError('No se ha podido cambiar. Inténtalo de nuevo.')
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={value}
        disabled={pending}
        className={`min-h-11 rounded-full px-5 py-2 text-lg font-semibold transition-colors disabled:opacity-70 ${
          value ? 'bg-sky-700 text-white hover:bg-sky-800' : 'border-2 border-sky-800 bg-etiqueta text-sky-900 hover:bg-sky-100'
        }`}
      >
        {value ? '✓ Siguiendo' : '+ Seguir esta carta'}
      </button>
      {error && (
        <p role="alert" className="rounded-md bg-etiqueta px-2 py-1 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
