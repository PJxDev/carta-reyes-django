import type { Backend } from './backend.ts'
import type { TableSchema } from './schema.ts'

/** Un registro: nombre de columna → texto. */
export type Row = Record<string, string>

export class SchemaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SchemaError'
  }
}

/** Cola que ejecuta de uno en uno las operaciones de escritura. */
export interface Mutex {
  run<T>(fn: () => Promise<T>): Promise<T>
}

export function createMutex(): Mutex {
  let tail: Promise<void> = Promise.resolve()
  return {
    run<T>(fn: () => Promise<T>): Promise<T> {
      const result = tail.then(() => fn())
      tail = result.then(
        () => undefined,
        () => undefined
      )
      return result
    }
  }
}

interface ParsedRow {
  rowNumber: number
  data: Row
}

interface ParsedTable {
  header: string[]
  rows: ParsedRow[]
}

function parseRows(schema: TableSchema, raw: string[][]): ParsedTable {
  const headerRow = raw[0]
  if (!headerRow || headerRow.every((cell) => cell.trim() === '')) {
    throw new SchemaError(
      `La pestaña "${schema.name}" está vacía o no existe. ` +
        'Ejecuta "npm run sheet:setup" para crearla con sus cabeceras.'
    )
  }

  const header = headerRow.map((cell) => cell.trim())
  const missing = schema.columns.filter((column) => !header.includes(column))
  if (missing.length > 0) {
    throw new SchemaError(
      `A la pestaña "${schema.name}" le faltan las columnas: ${missing.join(', ')}. ` +
        'Ejecuta "npm run sheet:setup" o añádelas a mano en la fila 1.'
    )
  }

  const rows: ParsedRow[] = []
  for (let i = 1; i < raw.length; i++) {
    const cells = raw[i] ?? []
    if (cells.every((cell) => cell === '')) continue // fila en blanco
    const data: Row = {}
    header.forEach((name, index) => {
      if (name) data[name] = cells[index] ?? ''
    })
    rows.push({ rowNumber: i + 1, data })
  }
  return { header, rows }
}

export type UpdateOutcome =
  | { status: 'updated'; row: Row }
  | { status: 'not_found' }
  | { status: 'rejected' }

export interface Table {
  /** Todos los registros (puede venir de la caché de lectura). */
  all(): Promise<Row[]>
  /**
   * Añade registros. Si se pasa `unless` y devuelve true para el estado actual
   * de la tabla, no se inserta nada ("rejected"). La comprobación y la
   * escritura son atómicas dentro de este proceso.
   */
  insert(
    rows: Row[],
    options?: { unless?: (existing: Row[]) => boolean }
  ): Promise<'inserted' | 'rejected'>
  /**
   * Modifica el registro con ese `id`. `change` recibe el estado actual (leído
   * sin caché) y devuelve los campos a cambiar, o null para cancelar.
   */
  update(
    id: string,
    change: (current: Row) => Partial<Row> | null
  ): Promise<UpdateOutcome>
  /** Borra el registro. `guard` puede impedirlo devolviendo false. */
  remove(
    id: string,
    guard?: (current: Row) => boolean
  ): Promise<'removed' | 'not_found' | 'rejected'>
}

export function createTable(
  backend: Backend,
  schema: TableSchema,
  mutex: Mutex
): Table {
  const readParsed = async (fresh: boolean): Promise<ParsedTable> =>
    parseRows(schema, await backend.readRows(schema.name, { fresh }))

  const toValues = (header: string[], row: Row): string[] =>
    header.map((name) => (name ? (row[name] ?? '') : ''))

  return {
    async all() {
      return (await readParsed(false)).rows.map((r) => r.data)
    },

    insert(rows, options) {
      return mutex.run(async () => {
        const { header, rows: existing } = await readParsed(true)
        if (options?.unless?.(existing.map((r) => r.data))) return 'rejected'
        await backend.appendRows(
          schema.name,
          rows.map((row) => toValues(header, row))
        )
        return 'inserted'
      })
    },

    update(id, change) {
      return mutex.run(async (): Promise<UpdateOutcome> => {
        const { header, rows } = await readParsed(true)
        const found = rows.find((r) => r.data.id === id)
        if (!found) return { status: 'not_found' }
        const patch = change(found.data)
        if (patch === null) return { status: 'rejected' }
        const updated: Row = { ...found.data }
        for (const [name, value] of Object.entries(patch)) {
          if (value !== undefined) updated[name] = value
        }
        await backend.updateRow(
          schema.name,
          found.rowNumber,
          toValues(header, updated)
        )
        return { status: 'updated', row: updated }
      })
    },

    remove(id, guard) {
      return mutex.run(async () => {
        const { rows } = await readParsed(true)
        const found = rows.find((r) => r.data.id === id)
        if (!found) return 'not_found'
        if (guard && !guard(found.data)) return 'rejected'
        await backend.deleteRow(schema.name, found.rowNumber)
        return 'removed'
      })
    }
  }
}
