import { pbkdf2, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number }
) => Promise<Buffer>
const pbkdf2Async = promisify(pbkdf2)

// Parámetros de scrypt: los valores por defecto de Node (N=16384, r=8, p=1),
// que usan unos 16 MiB y caben en su límite de memoria por defecto (32 MiB).
// Si se quieren endurecer, basta con subirlos aquí (y pasar `maxmem` a scrypt):
// `verifyPassword` marca `needsRehash` y los hashes antiguos se actualizan solos
// en el siguiente inicio de sesión.
const N = 16384
const R = 8
const P = 1
const KEY_LENGTH = 64

const equal = (a: Buffer, b: Buffer): boolean =>
  a.length === b.length && timingSafeEqual(a, b)

/** Genera un hash `scrypt$N$r$p$salt$hash` (base64). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scryptAsync(password.normalize('NFKC'), salt, KEY_LENGTH, { N, r: R, p: P })
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`
}

export interface PasswordCheck {
  valid: boolean
  /** true si la contraseña es correcta pero el hash es de un formato antiguo. */
  needsRehash: boolean
}

const INVALID: PasswordCheck = { valid: false, needsRehash: false }

/**
 * Comprueba una contraseña contra un hash guardado. Soporta el formato propio
 * (scrypt) y el de Django (`pbkdf2_sha256$iteraciones$salt$hash`) para poder
 * importar usuarios existentes sin obligarles a cambiar de contraseña.
 */
export async function verifyPassword(password: string, stored: string): Promise<PasswordCheck> {
  try {
    return await check(password, stored)
  } catch {
    // Hash corrupto (parámetros imposibles, base64 vacío…): equivale a "no coincide".
    return INVALID
  }
}

async function check(password: string, stored: string): Promise<PasswordCheck> {
  const parts = stored.split('$')

  if (parts[0] === 'scrypt' && parts.length === 6) {
    const [, n, r, p, salt, hash] = parts
    const params = { N: Number(n), r: Number(r), p: Number(p) }
    if (![params.N, params.r, params.p].every((v) => Number.isInteger(v) && v > 0)) return INVALID
    const expected = Buffer.from(hash, 'base64')
    if (expected.length === 0) return INVALID
    const actual = await scryptAsync(
      password.normalize('NFKC'),
      Buffer.from(salt, 'base64'),
      expected.length,
      params
    )
    const valid = equal(actual, expected)
    const outdated = params.N !== N || params.r !== R || params.p !== P
    return { valid, needsRehash: valid && outdated }
  }

  if (parts[0] === 'pbkdf2_sha256' && parts.length === 4) {
    const [, iterations, salt, hash] = parts
    const count = Number(iterations)
    if (!Number.isInteger(count) || count < 1) return INVALID
    const expected = Buffer.from(hash, 'base64')
    if (expected.length === 0) return INVALID
    // Django no normaliza la contraseña; el salt se usa como texto, no decodificado.
    const actual = await pbkdf2Async(password, salt, count, expected.length, 'sha256')
    const valid = equal(actual, expected)
    return { valid, needsRehash: valid }
  }

  return INVALID // formato desconocido o contraseña inutilizable de Django ("!...")
}

let dummyHash: Promise<string> | undefined

/**
 * Consume el mismo tiempo que una verificación real. Se usa cuando el usuario
 * no existe, para que el tiempo de respuesta no delate qué usuarios hay.
 */
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= hashPassword('no-existe-este-usuario')
  await verifyPassword(password, await dummyHash)
}
