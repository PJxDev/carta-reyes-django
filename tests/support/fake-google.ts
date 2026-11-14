/**
 * Simulación en memoria de las dos APIs de Google que usa la aplicación (token
 * OAuth y Google Sheets v4), con la semántica real que más importa:
 *  - las celdas vacías del final de cada fila (y las filas vacías del final) no se devuelven;
 *  - las escrituras deben usar valueInputOption=RAW;
 *  - los tokens se firman con RS256 y se verifican contra la clave pública.
 * Se inyecta como `fetchImpl`, así los tests no salen a la red.
 */
import { createVerify, generateKeyPairSync } from 'node:crypto'

interface FakeTab {
  gid: number
  rows: string[][]
}

export interface Failure {
  status: number
  headers?: Record<string, string>
  message?: string
}

export interface FakeGoogle {
  fetch: typeof fetch
  privateKey: string
  clientEmail: string
  spreadsheetId: string
  tabs: Map<string, FakeTab>
  /** Peticiones recibidas a la API de Sheets: "GET values/..." */
  calls: string[]
  tokenRequests: number
  /** Las próximas peticiones a Sheets fallarán con estos errores, en orden. */
  failures: Failure[]
  addTab(name: string, rows: string[][]): void
  /** Invalida los tokens emitidos hasta ahora (simula caducidad). */
  revokeTokens(): void
}

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  })

const trimRow = (row: string[]): string[] => {
  const copy = [...row]
  while (copy.length > 0 && copy[copy.length - 1] === '') copy.pop()
  return copy
}

export function createFakeGoogle(): FakeGoogle {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' }
  })
  const clientEmail = 'bot@proyecto.iam.gserviceaccount.com'
  const spreadsheetId = 'SHEET123'
  const tabs = new Map<string, FakeTab>()
  let nextGid = 100
  let validTokens = new Set<string>()

  const fake: FakeGoogle = {
    privateKey,
    clientEmail,
    spreadsheetId,
    tabs,
    calls: [],
    tokenRequests: 0,
    failures: [],
    addTab(name, rows) {
      tabs.set(name, { gid: nextGid++, rows: rows.map((r) => [...r]) })
    },
    revokeTokens() {
      validTokens = new Set()
    },
    fetch: async (input, init) => {
      const url = new URL(String(input))
      const method = (init?.method ?? 'GET').toUpperCase()

      // ---- OAuth -----------------------------------------------------------
      if (url.origin === 'https://oauth2.googleapis.com') {
        fake.tokenRequests++
        const body = new URLSearchParams(String(init?.body))
        if (body.get('grant_type') !== 'urn:ietf:params:oauth:grant-type:jwt-bearer') {
          return json(400, { error: 'unsupported_grant_type' })
        }
        const [h, c, s] = (body.get('assertion') ?? '').split('.')
        const valid = createVerify('RSA-SHA256')
          .update(`${h}.${c}`)
          .verify(publicKey, Buffer.from(s ?? '', 'base64url'))
        const claims = JSON.parse(Buffer.from(c ?? '', 'base64url').toString())
        if (
          !valid ||
          claims.iss !== clientEmail ||
          claims.aud !== 'https://oauth2.googleapis.com/token' ||
          claims.scope !== 'https://www.googleapis.com/auth/spreadsheets'
        ) {
          return json(400, { error: 'invalid_grant', error_description: 'JWT inválido' })
        }
        const token = `token-${fake.tokenRequests}`
        validTokens.add(token)
        return json(200, { access_token: token, expires_in: 3600 })
      }

      // ---- Sheets ----------------------------------------------------------
      const auth = new Headers(init?.headers).get('Authorization')
      if (!auth || !validTokens.has(auth.replace('Bearer ', ''))) {
        return json(401, { error: { message: 'Invalid Credentials' } })
      }
      const root = `/v4/spreadsheets/${spreadsheetId}`
      const path = decodeURIComponent(url.pathname)
      if (!path.startsWith(root)) return json(404, { error: { message: 'Requested entity was not found.' } })
      const rest = path.slice(root.length)
      fake.calls.push(`${method} ${rest || '/'}${url.search}`)

      const failure = fake.failures.shift()
      if (failure) {
        return json(failure.status, { error: { message: failure.message ?? 'fallo simulado' } }, failure.headers)
      }

      // metadatos
      if (method === 'GET' && rest === '') {
        return json(200, {
          sheets: [...tabs].map(([title, t]) => ({ properties: { sheetId: t.gid, title } }))
        })
      }

      // lectura
      if (method === 'GET' && rest.startsWith('/values/')) {
        const range = rest.slice('/values/'.length)
        const [, tab, spec] = /^'((?:[^']|'')+)'(?:!(.+))?$/.exec(range) ?? []
        const t = tabs.get((tab ?? '').replace(/''/g, "'"))
        if (!t) return json(400, { error: { message: `Unable to parse range: ${range}` } })
        let rows = t.rows.map(trimRow)
        if (spec === '1:1') rows = rows.slice(0, 1)
        while (rows.length > 0 && rows[rows.length - 1].length === 0) rows.pop()
        return json(200, rows.length ? { range, majorDimension: 'ROWS', values: rows } : { range })
      }

      // alta (append)
      if (method === 'POST' && rest.endsWith(':append')) {
        if (url.searchParams.get('valueInputOption') !== 'RAW') {
          return json(400, { error: { message: 'Se esperaba valueInputOption=RAW' } })
        }
        const tab = /^\/values\/'((?:[^']|'')+)'/.exec(rest)?.[1]?.replace(/''/g, "'") ?? ''
        const t = tabs.get(tab)
        if (!t) return json(400, { error: { message: 'Unable to parse range' } })
        const { values } = JSON.parse(String(init?.body)) as { values: string[][] }
        while (t.rows.length > 0 && trimRow(t.rows[t.rows.length - 1]).length === 0) t.rows.pop()
        t.rows.push(...values.map((r) => r.map(String)))
        return json(200, { updates: { updatedRows: values.length } })
      }

      // modificación de una fila
      if (method === 'PUT' && rest.startsWith('/values/')) {
        if (url.searchParams.get('valueInputOption') !== 'RAW') {
          return json(400, { error: { message: 'Se esperaba valueInputOption=RAW' } })
        }
        const m = /^\/values\/'((?:[^']|'')+)'!A(\d+):([A-Z]+)(\d+)$/.exec(rest)
        if (!m || m[2] !== m[4]) return json(400, { error: { message: 'Unable to parse range' } })
        const t = tabs.get(m[1].replace(/''/g, "'"))
        if (!t) return json(400, { error: { message: 'Unable to parse range' } })
        const rowIndex = Number(m[2]) - 1
        const { values } = JSON.parse(String(init?.body)) as { values: string[][] }
        while (t.rows.length <= rowIndex) t.rows.push([])
        t.rows[rowIndex] = values[0].map(String)
        return json(200, { updatedRows: 1 })
      }

      // operaciones estructurales
      if (method === 'POST' && rest === ':batchUpdate') {
        const { requests } = JSON.parse(String(init?.body)) as { requests: Record<string, any>[] }
        for (const req of requests) {
          if (req.addSheet) {
            tabs.set(req.addSheet.properties.title, { gid: nextGid++, rows: [] })
          } else if (req.deleteDimension) {
            const { sheetId, dimension, startIndex, endIndex } = req.deleteDimension.range
            const t = [...tabs.values()].find((x) => x.gid === sheetId)
            if (!t || dimension !== 'ROWS') return json(400, { error: { message: 'Invalid request' } })
            t.rows.splice(startIndex, endIndex - startIndex)
          } else if (!req.updateSheetProperties) {
            return json(400, { error: { message: 'Solicitud no soportada por el simulador' } })
          }
        }
        return json(200, { replies: requests.map(() => ({})) })
      }

      return json(400, { error: { message: `Ruta no soportada por el simulador: ${method} ${rest}` } })
    }
  }
  return fake
}
