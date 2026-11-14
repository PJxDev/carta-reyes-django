/**
 * Historial de cartas visitadas, guardado solo en el navegador (localStorage):
 * no se escribe nada en la hoja por cada visita. Módulo puro y sin dependencias
 * del navegador para poder probarlo.
 */

export const VISITED_KEY = 'carta:visitadas'
export const VISITED_MAX = 12
/** ~6 meses. */
export const VISITED_TTL_MS = 180 * 24 * 60 * 60 * 1000

export interface Visit {
  username: string
  /** Epoch en ms de la última visita. */
  at: number
}

/** Lee el valor guardado con tolerancia: cualquier cosa rara se descarta. */
export function parseVisits(raw: string | null | undefined, now = Date.now()): Visit[] {
  if (!raw) return []
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(data)) return []
  const visits: Visit[] = []
  for (const item of data) {
    if (typeof item !== 'object' || item === null) continue
    const { username, at } = item as Record<string, unknown>
    if (typeof username !== 'string' || username === '' || username.length > 60) continue
    if (typeof at !== 'number' || !Number.isFinite(at)) continue
    if (now - at > VISITED_TTL_MS || at > now + 24 * 60 * 60 * 1000) continue
    visits.push({ username, at })
  }
  return visits.sort((a, b) => b.at - a.at).slice(0, VISITED_MAX)
}

/** Añade o refresca una visita (la más reciente primero, sin duplicados). */
export function addVisit(current: Visit[], username: string, now = Date.now()): Visit[] {
  const name = username.trim().toLowerCase()
  if (name === '') return current
  return [{ username: name, at: now }, ...current.filter((v) => v.username !== name)].slice(0, VISITED_MAX)
}

export const removeVisit = (current: Visit[], username: string): Visit[] =>
  current.filter((v) => v.username !== username)
