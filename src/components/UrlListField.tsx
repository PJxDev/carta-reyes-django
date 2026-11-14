'use client'

import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { LIMITS, isHttpUrl } from '@/lib/validation'
import { shortDomain } from './LinksButton'
import { SafeImage } from './SafeImage'

interface UrlListFieldProps {
  /** Nombre del campo oculto que se envía con el formulario (lista JSON). */
  name: string
  label: string
  kind: 'link' | 'image'
  initial?: string[]
}

/**
 * Lista editable de URLs. Se envía como un único campo oculto con un array JSON.
 * Si queda una URL válida escrita sin pulsar "Añadir", también se incluye para
 * que no se pierda al guardar.
 */
export function UrlListField({ name, label, kind, initial = [] }: UrlListFieldProps) {
  const [items, setItems] = useState<string[]>(initial)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const add = () => {
    const url = draft.trim()
    if (url === '') return
    if (!isHttpUrl(url)) return setError('Escribe un enlace completo que empiece por http:// o https://')
    if (items.includes(url)) return setError('Ese enlace ya está en la lista')
    if (items.length >= LIMITS.urlsPerList) return setError(`Máximo ${LIMITS.urlsPerList} enlaces`)
    setItems([...items, url])
    setDraft('')
    setError(null)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault() // Enter no debe enviar el formulario entero
      add()
    }
  }

  const pending = draft.trim()
  const submitted =
    pending !== '' && isHttpUrl(pending) && !items.includes(pending) && items.length < LIMITS.urlsPerList
      ? [...items, pending]
      : items

  const inputId = `${name}-input`

  return (
    <div className="flex w-full flex-col gap-2">
      <input type="hidden" name={name} value={JSON.stringify(submitted)} />
      <label htmlFor={inputId} className="text-lg">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="url"
          inputMode="url"
          value={draft}
          placeholder="Pega aquí tu enlace"
          onChange={(event) => {
            setDraft(event.target.value)
            setError(null)
          }}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 rounded-md bg-slate-200 p-2 text-lg"
        />
        <button
          type="button"
          onClick={add}
          className="min-h-11 shrink-0 rounded-md bg-sky-600 px-4 font-semibold text-white hover:bg-sky-700"
        >
          Añadir
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
      {items.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {items.map((url) => (
            <li key={url} className="relative flex w-24 flex-col items-center rounded-md bg-slate-100 p-1 text-center">
              <SafeImage
                src={kind === 'image' ? url : faviconFor(url)}
                alt=""
                className="size-16 object-cover"
              />
              {kind === 'link' && <span className="w-full truncate text-sm">{shortDomain(url)}</span>}
              <button
                type="button"
                aria-label={`Quitar ${url}`}
                onClick={() => setItems(items.filter((item) => item !== url))}
                className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-red-600 text-lg leading-none text-white"
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function faviconFor(url: string): string {
  try {
    return `${new URL(url).origin}/favicon.ico`
  } catch {
    return ''
  }
}
