import type { ProductoInput } from './types.ts'

/** Rutas que no pueden usarse como nombre de usuario porque colisionan con páginas. */
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  'login',
  'logout',
  'registro',
  'editor',
  'pillados',
  'api',
  'admin',
  'static',
  'public',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml'
])

export const LIMITS = {
  usernameMin: 3,
  usernameMax: 30,
  passwordMin: 8,
  passwordMax: 128,
  nameMax: 200,
  descriptionMax: 2000,
  urlMax: 2000,
  urlsPerList: 10
} as const

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string }

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error })

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase()
}

const USERNAME_RE = /^[a-z0-9][a-z0-9._-]*$/

export function validateUsername(raw: string): Validated<string> {
  const username = normalizeUsername(raw)
  if (username.length < LIMITS.usernameMin || username.length > LIMITS.usernameMax) {
    return fail(
      `El usuario debe tener entre ${LIMITS.usernameMin} y ${LIMITS.usernameMax} caracteres`
    )
  }
  if (!USERNAME_RE.test(username)) {
    return fail(
      'El usuario solo puede tener letras sin tildes, números, punto, guion y guion bajo, y debe empezar por letra o número'
    )
  }
  if (RESERVED_USERNAMES.has(username)) return fail('Ese nombre de usuario no está disponible')
  return { ok: true, value: username }
}

export function validatePassword(password: string, username: string): Validated<string> {
  if (password.length < LIMITS.passwordMin) {
    return fail(`La contraseña debe tener al menos ${LIMITS.passwordMin} caracteres`)
  }
  if (password.length > LIMITS.passwordMax) {
    return fail(`La contraseña no puede superar los ${LIMITS.passwordMax} caracteres`)
  }
  if (password.toLowerCase() === normalizeUsername(username)) {
    return fail('La contraseña no puede ser igual que el usuario')
  }
  return { ok: true, value: password }
}

/** Solo se admiten enlaces http(s): evita `javascript:` y similares en href/src. */
export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Convierte la entrada de un campo de URLs en una lista limpia. Acepta un
 * array JSON (lo que envía el formulario) o texto separado por comas,
 * espacios o saltos de línea (formato de la versión Django y de ediciones
 * manuales en la hoja).
 */
export function parseUrlList(raw: unknown, label: string): Validated<string[]> {
  let items: unknown[]
  if (Array.isArray(raw)) {
    items = raw
  } else if (typeof raw === 'string') {
    const text = raw.trim()
    if (text === '') {
      items = []
    } else if (text.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(text)
        if (!Array.isArray(parsed)) return fail(`${label}: formato no válido`)
        items = parsed
      } catch {
        return fail(`${label}: formato no válido`)
      }
    } else {
      items = text.split(/[\s,]+/)
    }
  } else if (raw === undefined || raw === null) {
    items = []
  } else {
    return fail(`${label}: formato no válido`)
  }

  const urls: string[] = []
  for (const item of items) {
    if (typeof item !== 'string') return fail(`${label}: formato no válido`)
    const url = item.trim()
    if (url === '') continue
    if (url.length > LIMITS.urlMax) return fail(`${label}: un enlace es demasiado largo`)
    if (!isHttpUrl(url)) return fail(`${label}: "${url}" no es un enlace http(s) válido`)
    if (!urls.includes(url)) urls.push(url)
  }
  if (urls.length > LIMITS.urlsPerList) {
    return fail(`${label}: máximo ${LIMITS.urlsPerList} enlaces`)
  }
  return { ok: true, value: urls }
}

export function validateProductoInput(input: {
  name?: unknown
  description?: unknown
  links?: unknown
  images?: unknown
}): Validated<ProductoInput> {
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  if (name === '') return fail('El nombre es obligatorio')
  if (name.length > LIMITS.nameMax) {
    return fail(`El nombre no puede superar los ${LIMITS.nameMax} caracteres`)
  }

  const description = typeof input.description === 'string' ? input.description.trim() : ''
  if (description.length > LIMITS.descriptionMax) {
    return fail(`La descripción no puede superar los ${LIMITS.descriptionMax} caracteres`)
  }

  const links = parseUrlList(input.links, 'Enlaces')
  if (!links.ok) return links
  const images = parseUrlList(input.images, 'Imágenes')
  if (!images.ok) return images

  return {
    ok: true,
    value: { name, description, links: links.value, images: images.value }
  }
}
