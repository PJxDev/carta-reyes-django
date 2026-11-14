'use client'

import Link from 'next/link'
import { useEffect, useSyncExternalStore } from 'react'
import { VISITED_KEY, addVisit, parseVisits, removeVisit } from '@/lib/visited'

// localStorage puede faltar o lanzar (modo privado, datos bloqueados): todo va en try/catch.
const readRaw = (): string => {
  try {
    return window.localStorage.getItem(VISITED_KEY) ?? ''
  } catch {
    return ''
  }
}
const writeRaw = (value: string) => {
  try {
    window.localStorage.setItem(VISITED_KEY, value)
    window.dispatchEvent(new Event('carta:visitadas'))
  } catch {
    /* sin almacenamiento: simplemente no se recuerda */
  }
}
const subscribe = (callback: () => void) => {
  window.addEventListener('carta:visitadas', callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener('carta:visitadas', callback)
    window.removeEventListener('storage', callback)
  }
}

/** Apunta la carta que se está viendo en el historial de este navegador. */
export function RecordVisit({ username }: { username: string }) {
  useEffect(() => {
    writeRaw(JSON.stringify(addVisit(parseVisits(readRaw()), username)))
  }, [username])
  return null
}

/** Lista de cartas visitadas en los últimos meses. No se pinta si no hay ninguna. */
export function VisitedList({ exclude }: { exclude?: string }) {
  const raw = useSyncExternalStore(subscribe, readRaw, () => '')
  const visits = parseVisits(raw).filter((v) => v.username !== exclude)
  if (visits.length === 0) return null
  return (
    <section aria-labelledby="visitadas-titulo" className="flex w-full max-w-2xl flex-col items-center gap-3 px-4">
      <h2 id="visitadas-titulo" className="font-header text-2xl">
        Cartas que has visitado
      </h2>
      <ul className="flex flex-wrap justify-center gap-2">
        {visits.map((visit) => (
          <li key={visit.username} className="flex items-center overflow-hidden rounded-full bg-etiqueta shadow">
            <Link
              href={`/${visit.username}`}
              className="flex min-h-11 items-center px-4 text-lg font-semibold [overflow-wrap:anywhere] hover:bg-sky-100"
            >
              {visit.username}
            </Link>
            <button
              type="button"
              aria-label={`Quitar ${visit.username} del historial`}
              onClick={() => writeRaw(JSON.stringify(removeVisit(parseVisits(readRaw()), visit.username)))}
              className="flex size-11 items-center justify-center text-xl text-tinta/70 hover:bg-red-100"
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
      <p className="text-center text-sm text-texto/80">Se guardan solo en este navegador durante unos 6 meses.</p>
    </section>
  )
}
