import { createHmac, timingSafeEqual } from 'node:crypto'

/** Nombre de la cookie de sesión. */
export const SESSION_COOKIE = 'carta_session'
/** Duración de la sesión: 30 días. */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30

export interface SessionPayload {
  /** id del usuario */
  uid: string
  /** caducidad, segundos desde epoch */
  exp: number
}

const sign = (data: string, secret: string): Buffer =>
  createHmac('sha256', secret).update(data).digest()

/** Token `payload.firma` (base64url + HMAC-SHA256). No va cifrado, solo firmado. */
export function createSessionToken(
  uid: string,
  secret: string,
  options: { now?: number; ttlSeconds?: number } = {}
): string {
  const now = options.now ?? Date.now()
  const payload: SessionPayload = {
    uid,
    exp: Math.floor(now / 1000) + (options.ttlSeconds ?? SESSION_TTL_SECONDS)
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body, secret).toString('base64url')}`
}

/** Devuelve el contenido si la firma es válida y no ha caducado; si no, null. */
export function verifySessionToken(
  token: string | undefined,
  secret: string,
  now: number = Date.now()
): SessionPayload | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, signature] = parts

  const expected = sign(body, secret)
  const given = Buffer.from(signature, 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Partial<SessionPayload>
    if (typeof payload.uid !== 'string' || typeof payload.exp !== 'number') return null
    if (payload.exp * 1000 <= now) return null
    return { uid: payload.uid, exp: payload.exp }
  } catch {
    return null
  }
}
