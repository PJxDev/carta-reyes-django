import { createSign } from 'node:crypto'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets'

export interface TokenProvider {
  getToken(): Promise<string>
  /** Descarta el token en caché (p. ej. tras recibir un 401). */
  invalidate(): void
}

export interface TokenProviderOptions {
  clientEmail: string
  /** Clave privada PEM de la cuenta de servicio (ya con saltos de línea reales). */
  privateKey: string
  fetchImpl?: typeof fetch
  /** Reloj inyectable para tests (milisegundos). */
  now?: () => number
  tokenUrl?: string
}

const b64url = (input: Buffer | string): string =>
  Buffer.from(input).toString('base64url')

/** JWT RS256 firmado con la clave de la cuenta de servicio (flujo OAuth2 JWT bearer). */
export function signServiceAccountJwt(
  options: Pick<TokenProviderOptions, 'clientEmail' | 'privateKey'> & {
    nowSeconds: number
    audience?: string
  }
): string {
  const header = { alg: 'RS256', typ: 'JWT' }
  const claims = {
    iss: options.clientEmail,
    scope: SCOPE,
    aud: options.audience ?? TOKEN_URL,
    iat: options.nowSeconds,
    exp: options.nowSeconds + 3600
  }
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(options.privateKey)
  return `${unsigned}.${b64url(signature)}`
}

export function createTokenProvider(options: TokenProviderOptions): TokenProvider {
  const fetchImpl = options.fetchImpl ?? fetch
  const now = options.now ?? Date.now
  const tokenUrl = options.tokenUrl ?? TOKEN_URL

  let cached: { token: string; expiresAt: number } | null = null
  let inFlight: Promise<string> | null = null

  async function request(): Promise<string> {
    const assertion = signServiceAccountJwt({
      clientEmail: options.clientEmail,
      privateKey: options.privateKey,
      nowSeconds: Math.floor(now() / 1000),
      audience: tokenUrl
    })
    const response = await fetchImpl(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion
      })
    })
    const body = (await response.json().catch(() => ({}))) as {
      access_token?: string
      expires_in?: number
      error?: string
      error_description?: string
    }
    if (!response.ok || !body.access_token) {
      throw new Error(
        `No se pudo autenticar con Google (${response.status}): ` +
          `${body.error_description ?? body.error ?? 'respuesta inesperada'}. ` +
          'Revisa GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY.'
      )
    }
    // Se renueva con 60 s de margen para no usar un token a punto de caducar.
    cached = {
      token: body.access_token,
      expiresAt: now() + (body.expires_in ?? 3600) * 1000 - 60_000
    }
    return body.access_token
  }

  return {
    async getToken() {
      if (cached && cached.expiresAt > now()) return cached.token
      inFlight ??= request().finally(() => {
        inFlight = null
      })
      return inFlight
    },
    invalidate() {
      cached = null
    }
  }
}
