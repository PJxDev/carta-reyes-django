import path from 'node:path'
import { loadConfig } from '../config.ts'
import type { AppConfig } from '../config.ts'
import { createSheetsApi } from '../sheets/api.ts'
import { createTokenProvider } from '../sheets/google-auth.ts'
import type { Backend } from './backend.ts'
import { createMemoryBackend } from './memory-backend.ts'
import { ALL_TABLES, PRODUCTOS, USUARIOS } from './schema.ts'
import { createSheetsBackend } from './sheets-backend.ts'
import { createMutex, createTable } from './table.ts'
import type { Table } from './table.ts'

export interface Store {
  usuarios: Table
  productos: Table
}

/** Une un backend con las tablas del esquema. Todas las escrituras comparten cola. */
export function createStore(backend: Backend): Store {
  const mutex = createMutex()
  return {
    usuarios: createTable(backend, USUARIOS, mutex),
    productos: createTable(backend, PRODUCTOS, mutex)
  }
}

/** Elige el backend según la configuración de entorno. */
export function createBackend(config: AppConfig): Backend {
  if (config.backend === 'file') {
    return createMemoryBackend({
      tables: ALL_TABLES,
      filePath: path.resolve(process.cwd(), config.dataFile)
    })
  }
  const sheets = config.sheets!
  const tokens = createTokenProvider({
    clientEmail: sheets.clientEmail,
    privateKey: sheets.privateKey
  })
  const api = createSheetsApi({
    spreadsheetId: sheets.sheetId,
    tokens,
    serviceAccountEmail: sheets.clientEmail
  })
  return createSheetsBackend({ api, cacheTtlMs: config.cacheTtlMs })
}

// Se guarda en globalThis para que el recargado en caliente de `next dev` no
// cree un almacén (y una caché) nuevos en cada cambio de código.
const GLOBAL_KEY = Symbol.for('carta-reyes.store')
type GlobalWithStore = typeof globalThis & { [GLOBAL_KEY]?: Store }

export function getStore(): Store {
  const holder = globalThis as GlobalWithStore
  holder[GLOBAL_KEY] ??= createStore(createBackend(loadConfig()))
  return holder[GLOBAL_KEY]
}
