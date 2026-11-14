import assert from 'node:assert/strict'
import { createVerify } from 'node:crypto'
import { test } from 'node:test'
import { createRepos } from '../src/lib/repos/index.ts'
import { columnLetter, quoteTab, rowRange } from '../src/lib/sheets/a1.ts'
import { SheetsApiError, createSheetsApi } from '../src/lib/sheets/api.ts'
import { createTokenProvider, signServiceAccountJwt } from '../src/lib/sheets/google-auth.ts'
import { ALL_TABLES } from '../src/lib/store/schema.ts'
import { createStore } from '../src/lib/store/index.ts'
import { createSheetsBackend } from '../src/lib/store/sheets-backend.ts'
import { createFakeGoogle } from './support/fake-google.ts'
import { PRODUCT_INPUT } from './support/helpers.ts'

/** Un libro con las dos pestañas y sus cabeceras, y todo cableado a la API simulada. */
function setup(options: { cacheTtlMs?: number; retries?: number } = {}) {
  const google = createFakeGoogle()
  for (const table of ALL_TABLES) google.addTab(table.name, [[...table.columns]])

  let clock = 1_000_000
  const sleeps: number[] = []
  const tokens = createTokenProvider({
    clientEmail: google.clientEmail,
    privateKey: google.privateKey,
    fetchImpl: google.fetch,
    now: () => clock
  })
  const api = createSheetsApi({
    spreadsheetId: google.spreadsheetId,
    tokens,
    serviceAccountEmail: google.clientEmail,
    fetchImpl: google.fetch,
    retries: options.retries,
    sleep: async (ms) => {
      sleeps.push(ms)
    }
  })
  const backend = createSheetsBackend({
    api,
    cacheTtlMs: options.cacheTtlMs ?? 5000,
    now: () => clock
  })
  const repos = createRepos(createStore(backend))
  return {
    google,
    api,
    backend,
    repos,
    sleeps,
    tokens,
    advance: (ms: number) => {
      clock += ms
    }
  }
}

test('notación A1', () => {
  assert.deepEqual([1, 8, 26, 27, 52, 53, 702, 703].map(columnLetter), ['A', 'H', 'Z', 'AA', 'AZ', 'BA', 'ZZ', 'AAA'])
  assert.throws(() => columnLetter(0))
  assert.equal(quoteTab("o'brien"), "'o''brien'")
  assert.equal(rowRange('productos', 5, 8), "'productos'!A5:H5")
})

test('el JWT de la cuenta de servicio está bien formado y firmado con RS256', () => {
  const google = createFakeGoogle()
  const jwt = signServiceAccountJwt({
    clientEmail: google.clientEmail,
    privateKey: google.privateKey,
    nowSeconds: 1_700_000_000
  })
  const [header, claims, signature] = jwt.split('.')
  assert.deepEqual(JSON.parse(Buffer.from(header, 'base64url').toString()), { alg: 'RS256', typ: 'JWT' })
  assert.deepEqual(JSON.parse(Buffer.from(claims, 'base64url').toString()), {
    iss: google.clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: 1_700_000_000,
    exp: 1_700_003_600
  })
  assert.ok(signature.length > 100)
  assert.doesNotThrow(() => createVerify('RSA-SHA256')) // la verificación real la hace el simulador
})

test('el token se reutiliza, se comparte entre llamadas simultáneas y se renueva al caducar', async () => {
  const { google, tokens, advance } = setup()
  const [a, b, c] = await Promise.all([tokens.getToken(), tokens.getToken(), tokens.getToken()])
  assert.equal(a, b)
  assert.equal(b, c)
  assert.equal(google.tokenRequests, 1)
  await tokens.getToken()
  assert.equal(google.tokenRequests, 1)
  advance(3600 * 1000 - 30_000) // a menos de 60 s de caducar → renueva
  const fresh = await tokens.getToken()
  assert.equal(google.tokenRequests, 2)
  assert.notEqual(fresh, a)
})

test('un fallo de autenticación da un mensaje útil', async () => {
  const google = createFakeGoogle()
  const tokens = createTokenProvider({
    clientEmail: 'otra@cuenta.iam.gserviceaccount.com', // no coincide con la clave
    privateKey: google.privateKey,
    fetchImpl: google.fetch
  })
  await assert.rejects(tokens.getToken(), /No se pudo autenticar con Google \(400\).*GOOGLE_PRIVATE_KEY/s)
})

test('lectura: se recortan las celdas vacías del final pero las filas llegan completas', async () => {
  const { repos, google } = setup()
  const user = await repos.usuarios.create({ username: 'ana', passwordHash: 'h' })
  assert.ok(user.status === 'created')
  const p = await repos.productos.create(user.usuario.id, { name: 'Solo nombre', description: '', links: [], images: [] })
  // la API de Sheets omite las celdas finales vacías, pero el repositorio no se entera
  assert.deepEqual(google.tabs.get('productos')!.rows.at(-1)!.slice(3), ['', '', '', p.createdAt, ''])
  assert.deepEqual(await repos.productos.findById(p.id), { ...p, description: '', links: [], images: [], pilladoUserId: null })
})

test('flujo completo sobre la API simulada: alta, edición, pillar, liberar y borrar', async () => {
  const { repos, google } = setup({ cacheTtlMs: 0 })
  const ana = await repos.usuarios.create({ username: 'Ana', passwordHash: 'h1' })
  const bea = await repos.usuarios.create({ username: 'bea', passwordHash: 'h2' })
  assert.ok(ana.status === 'created' && bea.status === 'created')

  const p1 = await repos.productos.create(ana.usuario.id, PRODUCT_INPUT)
  const p2 = await repos.productos.create(ana.usuario.id, { ...PRODUCT_INPUT, name: 'Segundo' })
  const p3 = await repos.productos.create(ana.usuario.id, { ...PRODUCT_INPUT, name: 'Tercero' })

  const rows = () => google.tabs.get('productos')!.rows
  assert.deepEqual(rows().map((r) => r[2]), ['name', 'Bicicleta', 'Segundo', 'Tercero'])
  assert.equal(rows()[1][4], '["https://tienda.example/bici"]') // JSON en la celda

  assert.equal(await repos.productos.update(p2.id, ana.usuario.id, { ...PRODUCT_INPUT, name: 'Segundo (editado)' }), 'ok')
  assert.equal(rows()[2][2], 'Segundo (editado)')
  assert.equal(rows().length, 4) // se modificó, no se añadió

  assert.equal(await repos.productos.pillar(p3.id, bea.usuario.id), 'ok')
  assert.equal(rows()[3][7], bea.usuario.id)
  assert.equal(await repos.productos.despillar(p3.id, bea.usuario.id), 'ok')
  assert.equal(rows()[3][7], '')

  // borrar el de en medio: las filas siguientes suben una posición
  assert.equal(await repos.productos.remove(p2.id, ana.usuario.id), 'ok')
  assert.deepEqual(rows().map((r) => r[2]), ['name', 'Bicicleta', 'Tercero'])
  assert.ok(google.calls.some((c) => c.startsWith('POST :batchUpdate')))

  // y lo que queda sigue siendo coherente al volver a leer
  assert.deepEqual((await repos.productos.listByUser(ana.usuario.id)).map((p) => p.id), [p1.id, p3.id])
})

test('la caché de lectura se respeta, se salta con fresh y se invalida al escribir', async () => {
  const { backend, google, advance } = setup({ cacheTtlMs: 5000 })
  const reads = () => google.calls.filter((c) => c.startsWith('GET /values/')).length

  await backend.readRows('usuarios')
  await backend.readRows('usuarios')
  assert.equal(reads(), 1)

  await backend.readRows('usuarios', { fresh: true })
  assert.equal(reads(), 2)

  advance(5001)
  await backend.readRows('usuarios')
  assert.equal(reads(), 3)

  await backend.appendRows('usuarios', [['1', 'ana', 'h', 'f']])
  const rows = await backend.readRows('usuarios') // tras escribir no debe servir lo viejo
  assert.equal(reads(), 4)
  assert.equal(rows.length, 2)
})

test('lecturas simultáneas comparten una sola llamada', async () => {
  const { backend, google } = setup()
  await Promise.all(Array.from({ length: 10 }, () => backend.readRows('productos')))
  assert.equal(google.calls.filter((c) => c.startsWith('GET /values/')).length, 1)
})

test('un error de lectura no se queda en caché', async () => {
  const { backend, google } = setup({ retries: 0 })
  google.failures.push({ status: 500, message: 'caído' })
  await assert.rejects(backend.readRows('usuarios'), SheetsApiError)
  assert.equal((await backend.readRows('usuarios')).length, 1) // reintento correcto
})

test('429/5xx se reintentan con espera y respetan Retry-After', async () => {
  const { backend, google, sleeps } = setup({ cacheTtlMs: 0 })
  google.failures.push({ status: 429, headers: { 'Retry-After': '2' } }, { status: 503 }, { status: 500 })
  const rows = await backend.readRows('usuarios')
  assert.equal(rows.length, 1)
  assert.deepEqual(sleeps, [2000, 1000, 2000]) // Retry-After, luego 500·2^1, 500·2^2
})

test('si los reintentos se agotan se lanza SheetsApiError con el estado', async () => {
  const { backend, google } = setup({ retries: 2 })
  google.failures.push({ status: 503 }, { status: 503 }, { status: 503 })
  await assert.rejects(backend.readRows('usuarios'), (e: unknown) => e instanceof SheetsApiError && e.status === 503)
})

test('un 403 explica cómo compartir la hoja; un 404 apunta al ID', async () => {
  const { backend, google } = setup({ retries: 0 })
  google.failures.push({ status: 403, message: 'The caller does not have permission' })
  await assert.rejects(
    backend.readRows('usuarios', { fresh: true }),
    (e: unknown) => e instanceof SheetsApiError && e.status === 403 && e.message.includes(google.clientEmail) && /Editor/.test(e.message)
  )
  google.failures.push({ status: 404, message: 'Requested entity was not found.' })
  await assert.rejects(backend.readRows('usuarios', { fresh: true }), /GOOGLE_SHEET_ID/)
})

test('un 401 renueva el token una vez y reintenta', async () => {
  const { backend, google } = setup({ cacheTtlMs: 0 })
  await backend.readRows('usuarios')
  assert.equal(google.tokenRequests, 1)
  google.revokeTokens() // el token en caché deja de valer
  await backend.readRows('usuarios')
  assert.equal(google.tokenRequests, 2)
})

test('borrar una pestaña inexistente falla con un mensaje claro', async () => {
  const { backend } = setup()
  await assert.rejects(backend.deleteRow('fantasma', 2), /No existe la pestaña "fantasma"/)
})

test('operaciones simultáneas de escritura no corrompen la hoja', async () => {
  const { repos, google } = setup({ cacheTtlMs: 0 })
  const ana = await repos.usuarios.create({ username: 'ana', passwordHash: 'h' })
  assert.ok(ana.status === 'created')
  const created = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      repos.productos.create(ana.usuario.id, { ...PRODUCT_INPUT, name: `P${i}` })
    )
  )
  // borra los pares a la vez que modifica los impares
  await Promise.all(
    created.map((p, i) =>
      i % 2 === 0
        ? repos.productos.remove(p.id, ana.usuario.id)
        : repos.productos.update(p.id, ana.usuario.id, { ...PRODUCT_INPUT, name: `Editado ${i}` })
    )
  )
  const names = google.tabs.get('productos')!.rows.slice(1).map((r) => r[2]).sort()
  assert.deepEqual(names, [1, 3, 5, 7, 9, 11].map((i) => `Editado ${i}`).sort())
})
