/**
 * Prepara el libro de Google Sheets: crea las pestañas `usuarios` y `productos`
 * si faltan, escribe sus cabeceras y congela la primera fila. Es seguro
 * repetirlo: no toca los datos existentes.
 *
 *   npm run sheet:setup
 */
import { loadConfig } from '../src/lib/config.ts'
import { quoteTab, rowRange } from '../src/lib/sheets/a1.ts'
import { createSheetsApi } from '../src/lib/sheets/api.ts'
import { createTokenProvider } from '../src/lib/sheets/google-auth.ts'
import { ALL_TABLES } from '../src/lib/store/schema.ts'

const config = loadConfig()
if (config.backend !== 'sheets' || !config.sheets) {
  console.log('DATA_BACKEND=file: no hay nada que preparar (.data/db.json se crea solo).')
  process.exit(0)
}

const api = createSheetsApi({
  spreadsheetId: config.sheets.sheetId,
  tokens: createTokenProvider({
    clientEmail: config.sheets.clientEmail,
    privateKey: config.sheets.privateKey
  }),
  serviceAccountEmail: config.sheets.clientEmail
})

let sheets = await api.getSheets()

for (const table of ALL_TABLES) {
  if (!sheets.some((s) => s.title === table.name)) {
    await api.batchUpdate([{ addSheet: { properties: { title: table.name } } }])
    sheets = await api.getSheets()
    console.log(`+ Pestaña "${table.name}" creada`)
  }

  const [header = []] = await api.getValues(`${quoteTab(table.name)}!1:1`)
  const present = header.map((h) => h.trim())

  if (present.every((h) => h === '')) {
    await api.updateValues(rowRange(table.name, 1, table.columns.length), [[...table.columns]])
    console.log(`+ "${table.name}": cabecera escrita (${table.columns.join(', ')})`)
  } else {
    const missing = table.columns.filter((c) => !present.includes(c))
    if (missing.length > 0) {
      const next = [...header, ...missing]
      await api.updateValues(rowRange(table.name, 1, next.length), [next])
      console.log(`+ "${table.name}": columnas añadidas (${missing.join(', ')})`)
    } else {
      console.log(`✓ "${table.name}": cabecera correcta`)
    }
  }

  const gid = sheets.find((s) => s.title === table.name)!.sheetId
  await api.batchUpdate([
    {
      updateSheetProperties: {
        properties: { sheetId: gid, gridProperties: { frozenRowCount: 1 } },
        fields: 'gridProperties.frozenRowCount'
      }
    }
  ])
}

console.log('\nListo. Ya puedes arrancar la aplicación con "npm run dev".')
