/**
 * Contrato mínimo que debe cumplir un almacén de filas. Hay dos
 * implementaciones: Google Sheets (producción) y memoria/archivo
 * (desarrollo y tests).
 *
 * Todas las filas son arrays de texto. `rowNumber` es 1-based igual que en
 * Sheets: la fila 1 es la cabecera y los datos empiezan en la 2.
 */

export interface ReadOptions {
  /** Ignora cualquier caché y lee el estado actual. */
  fresh?: boolean
}

export interface Backend {
  /**
   * Todas las filas de la pestaña, cabecera incluida. Las filas pueden ser más
   * cortas que la cabecera (Sheets omite las celdas vacías del final).
   * Devuelve `[]` si la pestaña no tiene nada.
   */
  readRows(tab: string, options?: ReadOptions): Promise<string[][]>
  appendRows(tab: string, rows: string[][]): Promise<void>
  updateRow(tab: string, rowNumber: number, values: string[]): Promise<void>
  deleteRow(tab: string, rowNumber: number): Promise<void>
}
