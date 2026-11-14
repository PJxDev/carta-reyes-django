/** Cuenta atrás hasta el Día de Reyes (6 de enero). Módulo puro: recibe la fecha, no la lee. */

export type ReyesState =
  | { kind: 'countdown'; days: number }
  | { kind: 'today' }
  | { kind: 'after' }

const DAY_MS = 24 * 60 * 60 * 1000

/** Días de calendario entre dos fechas locales (inmune al cambio de hora). */
const calendarDays = (from: Date, to: Date): number =>
  Math.round(
    (Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) -
      Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) /
      DAY_MS
  )

/**
 * Del 7 al 31 de enero la web dice que los Reyes ya han pasado; el resto del
 * año cuenta los días que faltan para el próximo 6 de enero.
 */
export function reyesState(now: Date): ReyesState {
  const year = now.getFullYear()
  const thisYear = new Date(year, 0, 6)
  const diff = calendarDays(now, thisYear)
  if (diff === 0) return { kind: 'today' }
  if (diff < 0 && now.getMonth() === 0) return { kind: 'after' }
  const next = diff > 0 ? thisYear : new Date(year + 1, 0, 6)
  return { kind: 'countdown', days: calendarDays(now, next) }
}

export function reyesMessage(state: ReyesState): string {
  switch (state.kind) {
    case 'today':
      return '¡Hoy es Día de Reyes!'
    case 'after':
      return 'Los Reyes ya han pasado. ¡Que los disfrutéis!'
    case 'countdown':
      return state.days === 1 ? 'Mañana llegan los Reyes' : `Faltan ${state.days} días para los Reyes`
  }
}
