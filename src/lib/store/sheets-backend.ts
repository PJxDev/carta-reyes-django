import { quoteTab, rowRange } from '../sheets/a1.ts'
import type { SheetsApi } from '../sheets/api.ts'
import type { Backend } from './backend.ts'

export interface SheetsBackendOptions {
  api: SheetsApi
  /** Milisegundos que se reutiliza una lectura. 0 desactiva la caché. */
  cacheTtlMs: number
  now?: () => number
}

/**
 * Backend sobre Google Sheets. Lee cada pestaña entera en una sola llamada y
 * la cachea unos segundos (la cuota de la API es baja); toda escritura
 * invalida la caché de su pestaña.
 */
export function createSheetsBackend(options: SheetsBackendOptions): Backend {
  const { api, cacheTtlMs } = options
  const now = options.now ?? Date.now

  const cache = new Map<string, { at: number; rows: Promise<string[][]> }>()
  let gids: Promise<Map<string, number>> | null = null

  const read = (tab: string): Promise<string[][]> => {
    const rows = api.getValues(quoteTab(tab))
    // Si falla, no se deja en caché para que el siguiente intento vuelva a probar.
    rows.catch(() => {
      if (cache.get(tab)?.rows === rows) cache.delete(tab)
    })
    cache.set(tab, { at: now(), rows })
    return rows
  }

  const sheetGid = async (tab: string): Promise<number> => {
    gids ??= api.getSheets().then(
      (sheets) => new Map(sheets.map((s) => [s.title, s.sheetId] as const)),
      (error) => {
        gids = null
        throw error
      }
    )
    const gid = (await gids).get(tab)
    if (gid === undefined) throw new Error(`No existe la pestaña "${tab}" en la hoja.`)
    return gid
  }

  return {
    async readRows(tab, options) {
      const hit = cache.get(tab)
      if (!options?.fresh && hit && now() - hit.at < cacheTtlMs) return hit.rows
      return read(tab)
    },

    async appendRows(tab, rows) {
      if (rows.length === 0) return
      cache.delete(tab)
      await api.appendValues(quoteTab(tab) + '!A1', rows)
      cache.delete(tab)
    },

    async updateRow(tab, rowNumber, values) {
      cache.delete(tab)
      await api.updateValues(rowRange(tab, rowNumber, values.length), [values])
      cache.delete(tab)
    },

    async deleteRow(tab, rowNumber) {
      cache.delete(tab)
      const sheetId = await sheetGid(tab)
      await api.batchUpdate([
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowNumber - 1,
              endIndex: rowNumber
            }
          }
        }
      ])
      cache.delete(tab)
    }
  }
}
