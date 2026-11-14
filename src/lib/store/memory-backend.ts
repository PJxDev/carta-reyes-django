import fs from 'node:fs'
import path from 'node:path'
import type { Backend } from './backend.ts'
import type { TableSchema } from './schema.ts'

export interface MemoryBackendOptions {
  /** Pestañas que deben existir; si faltan se crean con su cabecera. */
  tables: readonly TableSchema[]
  /** Si se indica, el contenido se carga y se guarda en este JSON. */
  filePath?: string
}

type Data = Record<string, string[][]>

/**
 * Backend en memoria con persistencia opcional en un archivo JSON. Pensado para
 * desarrollo local y tests: no necesita credenciales de Google.
 */
export function createMemoryBackend(options: MemoryBackendOptions): Backend {
  const { filePath } = options
  let data: Data = {}

  if (filePath && fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Data
  }
  for (const table of options.tables) {
    if (!data[table.name] || data[table.name].length === 0) {
      data[table.name] = [[...table.columns]]
    }
  }

  const persist = () => {
    if (!filePath) return
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    const tmp = `${filePath}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
    fs.renameSync(tmp, filePath)
  }

  const tab = (name: string): string[][] => {
    const rows = data[name]
    if (!rows) throw new Error(`La pestaña "${name}" no existe.`)
    return rows
  }

  return {
    async readRows(name) {
      return tab(name).map((row) => [...row]) // copia: nadie muta el estado
    },
    async appendRows(name, rows) {
      tab(name).push(...rows.map((row) => [...row]))
      persist()
    },
    async updateRow(name, rowNumber, values) {
      const rows = tab(name)
      if (rowNumber < 2 || rowNumber > rows.length) {
        throw new Error(`Fila ${rowNumber} fuera de rango en "${name}".`)
      }
      rows[rowNumber - 1] = [...values]
      persist()
    },
    async deleteRow(name, rowNumber) {
      const rows = tab(name)
      if (rowNumber < 2 || rowNumber > rows.length) {
        throw new Error(`Fila ${rowNumber} fuera de rango en "${name}".`)
      }
      rows.splice(rowNumber - 1, 1)
      persist()
    }
  }
}
