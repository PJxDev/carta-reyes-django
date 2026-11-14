'use client'

import { useSyncExternalStore } from 'react'
import { reyesMessage, reyesState } from '@/lib/reyes'

const noop = () => () => {}
// El día cambia, pero solo hace falta calcularlo al cargar: la cadena es estable dentro del mismo día.
const snapshot = () => reyesMessage(reyesState(new Date()))

/** Frase con los días que faltan para los Reyes. Se calcula en el navegador (su fecha y su zona horaria). */
export function ReyesCountdown() {
  const message = useSyncExternalStore(noop, snapshot, () => '')
  // Reserva el hueco en el servidor para que la portada no "salte" al hidratar.
  return (
    <p className="min-h-7 font-hand text-xl text-oro [text-shadow:0_1px_8px_rgb(27_37_89/0.9)] sm:text-2xl">
      {message}
    </p>
  )
}
