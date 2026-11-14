import { quoteTab } from './a1.ts'
import type { TokenProvider } from './google-auth.ts'

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets'
const RETRYABLE = new Set([429, 500, 502, 503, 504])

export class SheetsApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'SheetsApiError'
    this.status = status
  }
}

export interface SheetMeta {
  /** gid numérico (necesario para borrar filas). */
  sheetId: number
  title: string
}

export interface SheetsApiOptions {
  spreadsheetId: string
  tokens: TokenProvider
  /** Solo para mejorar el mensaje de error 403. */
  serviceAccountEmail?: string
  fetchImpl?: typeof fetch
  /** Reintentos ante 429/5xx (por defecto 3). */
  retries?: number
  sleep?: (ms: number) => Promise<void>
  baseUrl?: string
}

export interface SheetsApi {
  getValues(range: string): Promise<string[][]>
  appendValues(range: string, rows: string[][]): Promise<void>
  updateValues(range: string, rows: string[][]): Promise<void>
  batchUpdate(requests: unknown[]): Promise<void>
  getSheets(): Promise<SheetMeta[]>
}

export function createSheetsApi(options: SheetsApiOptions): SheetsApi {
  const fetchImpl = options.fetchImpl ?? fetch
  const retries = options.retries ?? 3
  const sleep =
    options.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)))
  const root = `${options.baseUrl ?? BASE_URL}/${encodeURIComponent(options.spreadsheetId)}`

  function explain(status: number, apiMessage: string): string {
    let hint = ''
    if (status === 403) {
      hint =
        ` Comparte la hoja como "Editor" con ${options.serviceAccountEmail ?? 'la cuenta de servicio'}` +
        ' y comprueba que la API de Google Sheets está habilitada en el proyecto.'
    } else if (status === 404) {
      hint = ' No se encuentra la hoja: revisa GOOGLE_SHEET_ID.'
    }
    return `Google Sheets respondió ${status}: ${apiMessage}.${hint}`
  }

  async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
    let attempt = 0
    let refreshedToken = false
    for (;;) {
      const token = await options.tokens.getToken()
      const response = await fetchImpl(`${root}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...init.headers
        }
      })

      if (response.ok) return (await response.json().catch(() => ({}))) as T

      if (response.status === 401 && !refreshedToken) {
        refreshedToken = true
        options.tokens.invalidate()
        continue
      }
      if (RETRYABLE.has(response.status) && attempt < retries) {
        const retryAfter = Number(response.headers.get('Retry-After'))
        const wait =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : 500 * 2 ** attempt
        attempt++
        await sleep(wait)
        continue
      }

      const body = (await response.json().catch(() => ({}))) as {
        error?: { message?: string }
      }
      throw new SheetsApiError(
        explain(response.status, body.error?.message ?? response.statusText),
        response.status
      )
    }
  }

  const enc = encodeURIComponent

  return {
    async getValues(range) {
      const data = await call<{ values?: string[][] }>(
        `/values/${enc(range)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`
      )
      return data.values ?? []
    },

    async appendValues(range, rows) {
      await call(
        `/values/${enc(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        { method: 'POST', body: JSON.stringify({ majorDimension: 'ROWS', values: rows }) }
      )
    },

    async updateValues(range, rows) {
      await call(`/values/${enc(range)}?valueInputOption=RAW`, {
        method: 'PUT',
        body: JSON.stringify({ range, majorDimension: 'ROWS', values: rows })
      })
    },

    async batchUpdate(requests) {
      await call(':batchUpdate', {
        method: 'POST',
        body: JSON.stringify({ requests })
      })
    },

    async getSheets() {
      const data = await call<{
        sheets?: { properties: { sheetId: number; title: string } }[]
      }>('?fields=sheets.properties(sheetId,title)')
      return (data.sheets ?? []).map((s) => ({
        sheetId: s.properties.sheetId,
        title: s.properties.title
      }))
    }
  }
}

/** Rango que abarca toda una pestaña. */
export const wholeTab = (tab: string): string => quoteTab(tab)
