/**
 * Lectura y validación de variables de entorno. Solo para código de servidor.
 * Todas las funciones aceptan `env` para poder probarlas sin tocar process.env.
 */

export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

type Env = Record<string, string | undefined>

export interface SheetsConfig {
  sheetId: string
  clientEmail: string
  privateKey: string
}

export interface AppConfig {
  backend: 'sheets' | 'file'
  sheets: SheetsConfig | null
  /** Ruta del JSON usado por el backend "file". */
  dataFile: string
  /** Milisegundos de caché de lectura por pestaña (solo backend "sheets"). */
  cacheTtlMs: number
}

/** Acepta la clave tal cual viene en el JSON de Google (con "\n" literales y comillas). */
export function normalizePrivateKey(raw: string): string {
  let key = raw.trim()
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1)
  }
  return key.replace(/\\n/g, '\n')
}

export function loadConfig(env: Env = process.env): AppConfig {
  const requested = env.DATA_BACKEND?.trim().toLowerCase()
  if (requested && requested !== 'sheets' && requested !== 'file') {
    throw new ConfigError(
      `DATA_BACKEND debe ser "sheets" o "file" (valor actual: "${requested}").`
    )
  }

  // Sin configurar: Sheets si hay hoja; en producción siempre Sheets (y fallará
  // con un mensaje claro si faltan credenciales) para no usar un archivo local
  // en un servidor efímero por descuido.
  const backend: 'sheets' | 'file' =
    (requested as 'sheets' | 'file' | undefined) ??
    (env.GOOGLE_SHEET_ID || env.NODE_ENV === 'production' ? 'sheets' : 'file')

  const cacheRaw = env.SHEETS_CACHE_TTL_MS?.trim()
  const cacheTtlMs = cacheRaw ? Number.parseInt(cacheRaw, 10) : 5000
  if (!Number.isFinite(cacheTtlMs) || cacheTtlMs < 0) {
    throw new ConfigError('SHEETS_CACHE_TTL_MS debe ser un número entero ≥ 0.')
  }

  let sheets: SheetsConfig | null = null
  if (backend === 'sheets') {
    const missing = [
      'GOOGLE_SHEET_ID',
      'GOOGLE_SERVICE_ACCOUNT_EMAIL',
      'GOOGLE_PRIVATE_KEY'
    ].filter((name) => !env[name]?.trim())
    if (missing.length > 0) {
      throw new ConfigError(
        `Faltan variables de entorno para Google Sheets: ${missing.join(', ')}. ` +
          'Consulta el README (sección "Configurar Google Sheets").'
      )
    }
    sheets = {
      sheetId: env.GOOGLE_SHEET_ID!.trim(),
      clientEmail: env.GOOGLE_SERVICE_ACCOUNT_EMAIL!.trim(),
      privateKey: normalizePrivateKey(env.GOOGLE_PRIVATE_KEY!)
    }
  }

  return {
    backend,
    sheets,
    dataFile: env.DATA_FILE?.trim() || '.data/db.json',
    cacheTtlMs
  }
}

export function getSessionSecret(env: Env = process.env): string {
  const secret = env.SESSION_SECRET?.trim()
  if (!secret || secret.length < 32) {
    throw new ConfigError(
      'SESSION_SECRET debe definirse con al menos 32 caracteres ' +
        '(ver .env.example para generar una).'
    )
  }
  return secret
}

export interface MailConfig {
  apiKey: string
  /** Remitente, p. ej. `Carta de Reyes <hola@tudominio.com>`. */
  from: string
}

/** Configuración de Resend, o null si no hay clave (el envío no está disponible). */
export function loadMailConfig(env: Env = process.env): MailConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim()
  if (!apiKey) return null
  return { apiKey, from: env.MAIL_FROM?.trim() || 'Carta de Reyes <onboarding@resend.dev>' }
}

/**
 * URL pública de la web para construir enlaces de los emails. Nunca se deduce
 * de la petición en producción: un `Host` manipulado podría apuntar el enlace
 * de recuperación a otro sitio.
 */
export function getSiteUrl(env: Env = process.env): string | null {
  const explicit = env.SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`
  return null
}

/** ¿Está configurada la subida de imágenes (Vercel Blob)? */
export const isUploadConfigured = (env: Env = process.env): boolean =>
  Boolean(env.BLOB_READ_WRITE_TOKEN?.trim())
