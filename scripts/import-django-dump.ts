/**
 * Importa a la hoja los usuarios y productos de la base de datos de Django.
 *
 *   # 1) En el proyecto Django (con su base de datos PostgreSQL configurada):
 *   python manage.py dumpdata auth.user cartas.producto --indent 2 > dump.json
 *   # 2) Aquí:
 *   npm run import:django -- dump.json --dry-run   # solo informa
 *   npm run import:django -- dump.json             # escribe en la hoja
 *
 * Se puede repetir sin duplicar datos.
 */
import fs from 'node:fs'
import { loadConfig } from '../src/lib/config.ts'
import { importDjangoDump } from '../src/lib/import/django-dump.ts'
import type { DjangoDumpEntry } from '../src/lib/import/django-dump.ts'
import { createRepos } from '../src/lib/repos/index.ts'
import { createBackend, createStore } from '../src/lib/store/index.ts'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const file = args.find((a) => !a.startsWith('--'))

if (!file) {
  console.error('Uso: npm run import:django -- <dump.json> [--dry-run]')
  process.exit(1)
}

const entries = JSON.parse(fs.readFileSync(file, 'utf8')) as DjangoDumpEntry[]
if (!Array.isArray(entries)) {
  console.error('El archivo no es un volcado de dumpdata (se esperaba una lista JSON).')
  process.exit(1)
}

const repos = createRepos(createStore(createBackend(loadConfig())))
const report = await importDjangoDump(entries, repos, { dryRun })

console.log(dryRun ? 'SIMULACIÓN (no se ha escrito nada)\n' : 'Importación completada\n')
console.log(`Usuarios:  ${report.usersToImport} nuevos, ${report.usersAlreadyThere} ya existían`)
console.log(`Productos: ${report.productosToImport} nuevos, ${report.productosAlreadyThere} ya existían`)
if (report.warnings.length > 0) {
  console.log(`\nAvisos (${report.warnings.length}):`)
  for (const warning of report.warnings) console.log(`  - ${warning}`)
}
