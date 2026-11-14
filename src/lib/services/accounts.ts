import { burnPasswordCheck, hashPassword, verifyPassword } from '../auth/password.ts'
import type { Repos } from '../repos/index.ts'
import type { Usuario } from '../types.ts'
import { normalizeUsername, validatePassword, validateUsername } from '../validation.ts'

export type AccountResult =
  | { ok: true; usuario: Usuario }
  | { ok: false; error: string }

const text = (value: unknown): string => (typeof value === 'string' ? value : '')

/** Alta de usuario. Mensajes en español, los mismos que daba la versión Django cuando existían. */
export async function registerUser(
  repos: Repos,
  input: { username?: unknown; password?: unknown; password2?: unknown }
): Promise<AccountResult> {
  const username = validateUsername(text(input.username))
  if (!username.ok) return { ok: false, error: username.error }

  const password = text(input.password)
  if (password !== text(input.password2)) {
    return { ok: false, error: 'Las contraseñas no coinciden' }
  }
  const checked = validatePassword(password, username.value)
  if (!checked.ok) return { ok: false, error: checked.error }

  const created = await repos.usuarios.create({
    username: username.value,
    passwordHash: await hashPassword(password)
  })
  if (created.status === 'username_taken') return { ok: false, error: 'Usuario ya existe' }
  return { ok: true, usuario: created.usuario }
}

const BAD_CREDENTIALS = 'Usuario no existe o contraseña incorrecta'

/**
 * Comprueba credenciales. Tarda lo mismo exista o no el usuario y devuelve el
 * mismo mensaje en ambos casos. Si el hash es de un formato antiguo (Django) lo
 * actualiza a scrypt.
 */
export async function authenticate(
  repos: Repos,
  input: { username?: unknown; password?: unknown }
): Promise<AccountResult> {
  const username = normalizeUsername(text(input.username))
  const password = text(input.password)

  const usuario = username ? await repos.usuarios.findByUsername(username) : null
  if (!usuario) {
    await burnPasswordCheck(password)
    return { ok: false, error: BAD_CREDENTIALS }
  }

  const check = await verifyPassword(password, usuario.passwordHash)
  if (!check.valid) return { ok: false, error: BAD_CREDENTIALS }

  if (check.needsRehash) {
    // Si falla la escritura, el login sigue siendo válido: se reintentará la próxima vez.
    await repos.usuarios
      .setPasswordHash(usuario.id, await hashPassword(password))
      .catch(() => undefined)
  }
  return { ok: true, usuario }
}
