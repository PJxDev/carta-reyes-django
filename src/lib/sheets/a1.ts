/** Utilidades de notación A1 de Google Sheets. */

/** 1 → "A", 26 → "Z", 27 → "AA". */
export function columnLetter(n: number): string {
  if (!Number.isInteger(n) || n < 1) throw new Error(`Columna inválida: ${n}`)
  let letters = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    letters = String.fromCharCode(65 + rem) + letters
    n = Math.floor((n - 1) / 26)
  }
  return letters
}

/** Nombre de pestaña entre comillas simples (las comillas internas se duplican). */
export function quoteTab(tab: string): string {
  return `'${tab.replace(/'/g, "''")}'`
}

/** Rango de una fila completa de `width` columnas, p. ej. 'productos'!A5:H5. */
export function rowRange(tab: string, rowNumber: number, width: number): string {
  return `${quoteTab(tab)}!A${rowNumber}:${columnLetter(width)}${rowNumber}`
}
