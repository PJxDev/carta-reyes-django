import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { hashPassword } from '../auth/password.ts'
import type { Mailer } from '../mail/mailer.ts'
import type { Repos } from '../repos/index.ts'
import { validateEmail, validatePassword } from '../validation.ts'

/** Validez del enlace de recuperación. */
export const RESET_TTL_MS = 60 * 60 * 1000
/** Tiempo mínimo entre dos emails de recuperación para la misma cuenta. */
export const RESET_MIN_INTERVAL_MS = 2 * 60 * 1000

export const INVALID_LINK = 'El enlace no es válido o ha caducado. Pide uno nuevo.'

const sha256 = (text: string): string => createHash('sha256').update(text).digest('hex')

/** Token que viaja en el enlace: `<id de usuario>.<secreto>`. En la hoja solo se guarda el hash del secreto. */
export function createResetToken(
  userId: string,
  now: number
): { token: string; hash: string; expires: string } {
  const secret = randomBytes(32).toString('base64url')
  return {
    token: `${userId}.${secret}`,
    hash: sha256(secret),
    expires: new Date(now + RESET_TTL_MS).toISOString()
  }
}

export type RequestResetResult = { ok: true } | { ok: false; error: string }

/**
 * Envía un enlace de recuperación al email indicado. La respuesta es la misma
 * exista o no la cuenta (y también si se limita la frecuencia), para no revelar
 * qué emails están registrados. Solo se devuelve error si el email no tiene
 * forma de email o si el envío falla.
 */
export async function requestPasswordReset(
  repos: Repos,
  mailer: Mailer,
  input: { email?: unknown; siteUrl: string; now?: number }
): Promise<RequestResetResult> {
  const now = input.now ?? Date.now()
  const email = validateEmail(input.email)
  if (!email.ok) return { ok: false, error: email.error }
  if (email.value === '') return { ok: false, error: 'Escribe el email de tu cuenta' }

  const usuario = await repos.usuarios.findByEmail(email.value)
  if (!usuario) return { ok: true }

  const lastIssued = Date.parse(usuario.resetExpires) - RESET_TTL_MS
  if (Number.isFinite(lastIssued) && now - lastIssued < RESET_MIN_INTERVAL_MS) return { ok: true }

  const reset = createResetToken(usuario.id, now)
  await repos.usuarios.setReset(usuario.id, reset.hash, reset.expires)

  const link = `${input.siteUrl}/restablecer?token=${encodeURIComponent(reset.token)}`
  try {
    await mailer.send({
      to: email.value,
      subject: 'Restablece tu contraseña de Carta de Reyes',
      text:
        `Hola ${usuario.username},\n\nPara elegir una contraseña nueva abre este enlace ` +
        `(vale durante una hora):\n${link}\n\n` +
        'Si no lo has pedido tú, ignora este mensaje: tu contraseña no ha cambiado.',
      html:
        `<p>Hola ${escapeHtml(usuario.username)},</p>` +
        `<p>Para elegir una contraseña nueva abre este enlace (vale durante una hora):</p>` +
        `<p><a href="${escapeHtml(link)}">Restablecer mi contraseña</a></p>` +
        '<p>Si no lo has pedido tú, ignora este mensaje: tu contraseña no ha cambiado.</p>'
    })
  } catch (error) {
    console.error('No se pudo enviar el email de recuperación:', error)
    return { ok: false, error: 'No se pudo enviar el email. Inténtalo de nuevo más tarde.' }
  }
  return { ok: true }
}

const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

/** Busca al usuario de un token y comprueba hash y caducidad. */
export async function findUserByResetToken(repos: Repos, token: unknown, now = Date.now()) {
  if (typeof token !== 'string') return null
  const dot = token.indexOf('.')
  if (dot <= 0) return null
  const usuario = await repos.usuarios.findById(token.slice(0, dot))
  if (!usuario || usuario.resetHash === '') return null
  if (!(Date.parse(usuario.resetExpires) > now)) return null
  const given = Buffer.from(sha256(token.slice(dot + 1)))
  const expected = Buffer.from(usuario.resetHash)
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  return usuario
}

export type ResetResult = { ok: true; userId: string } | { ok: false; error: string }

/** Cambia la contraseña con un token válido y lo invalida. */
export async function resetPasswordWithToken(
  repos: Repos,
  input: { token?: unknown; password?: unknown; password2?: unknown; now?: number }
): Promise<ResetResult> {
  const usuario = await findUserByResetToken(repos, input.token, input.now)
  if (!usuario) return { ok: false, error: INVALID_LINK }

  const password = typeof input.password === 'string' ? input.password : ''
  if (password !== (typeof input.password2 === 'string' ? input.password2 : '')) {
    return { ok: false, error: 'Las contraseñas no coinciden' }
  }
  const checked = validatePassword(password, usuario.username)
  if (!checked.ok) return { ok: false, error: checked.error }

  await repos.usuarios.resetPassword(usuario.id, await hashPassword(password))
  return { ok: true, userId: usuario.id }
}
