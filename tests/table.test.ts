import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { createMemoryBackend } from '../src/lib/store/memory-backend.ts'
import { ALL_TABLES, USUARIOS } from '../src/lib/store/schema.ts'
import { SchemaError, createMutex, createTable } from '../src/lib/store/table.ts'

const BASICO = { name: 'usuarios', columns: ['id', 'username', 'password_hash', 'created_at'] } as const

const setup = (rows: string[][]) => {
  const backend = createMemoryBackendWith({ usuarios: rows })
  return { backend, table: createTable(backend, BASICO, createMutex()) }
}

function createMemoryBackendWith(data: Record<string, string[][]>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'carta-'))
  const file = path.join(dir, 'db.json')
  fs.writeFileSync(file, JSON.stringify(data))
  return createMemoryBackend({ tables: [], filePath: file })
}

test('las columnas se localizan por nombre aunque estén reordenadas', async () => {
  const { table } = setup([
    ['created_at', 'username', 'id', 'password_hash'],
    ['2026-01-01', 'ana', '1', 'h1']
  ])
  assert.deepEqual(await table.all(), [
    { created_at: '2026-01-01', username: 'ana', id: '1', password_hash: 'h1' }
  ])
})

test('las columnas ajenas se conservan al modificar y las nuevas filas siguen la cabecera', async () => {
  const { backend, table } = setup([
    ['id', 'notas', 'username', 'password_hash', 'created_at'],
    ['1', 'VIP', 'ana', 'h1', '2026-01-01']
  ])
  const outcome = await table.update('1', () => ({ password_hash: 'h2' }))
  assert.equal(outcome.status, 'updated')
  await table.insert([{ id: '2', username: 'bea', password_hash: 'h3', created_at: '2026-02-02' }])
  assert.deepEqual(await backend.readRows('usuarios'), [
    ['id', 'notas', 'username', 'password_hash', 'created_at'],
    ['1', 'VIP', 'ana', 'h2', '2026-01-01'],
    ['2', '', 'bea', 'h3', '2026-02-02']
  ])
})

test('filas cortas se rellenan y las filas en blanco se ignoran sin desplazar índices', async () => {
  const { backend, table } = setup([
    ['id', 'username', 'password_hash', 'created_at'],
    ['1', 'ana'],
    [],
    ['', '', '', ''],
    ['2', 'bea', 'h', 'f']
  ])
  assert.deepEqual(await table.all(), [
    { id: '1', username: 'ana', password_hash: '', created_at: '' },
    { id: '2', username: 'bea', password_hash: 'h', created_at: 'f' }
  ])
  // el registro "2" está en la fila 5 de la hoja: la modificación debe caer ahí
  await table.update('2', () => ({ username: 'beatriz' }))
  assert.deepEqual((await backend.readRows('usuarios'))[4], ['2', 'beatriz', 'h', 'f'])
})

test('update: not_found, rejected y updated', async () => {
  const { table } = setup([USUARIOS.columns.slice(), ['1', 'ana', 'h', 'f']])
  assert.deepEqual(await table.update('99', () => ({})), { status: 'not_found' })
  assert.deepEqual(await table.update('1', () => null), { status: 'rejected' })
  const ok = await table.update('1', () => ({ username: 'ANA' }))
  assert.equal(ok.status === 'updated' && ok.row.username, 'ANA')
})

test('remove respeta not_found y guard', async () => {
  const { table } = setup([USUARIOS.columns.slice(), ['1', 'ana', 'h', 'f'], ['2', 'bea', 'h', 'f']])
  assert.equal(await table.remove('9'), 'not_found')
  assert.equal(await table.remove('1', () => false), 'rejected')
  assert.equal(await table.remove('1', () => true), 'removed')
  assert.deepEqual((await table.all()).map((r) => r.id), ['2'])
})

test('insert con `unless` es atómico frente a llamadas simultáneas', async () => {
  const { table } = setup([USUARIOS.columns.slice()])
  const attempts = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      table.insert(
        [{ id: String(i), username: 'ana', password_hash: 'h', created_at: 'f' }],
        { unless: (rows) => rows.some((r) => r.username === 'ana') }
      )
    )
  )
  assert.equal(attempts.filter((a) => a === 'inserted').length, 1)
  assert.equal((await table.all()).length, 1)
})

test('una pestaña vacía o sin columnas obligatorias da un SchemaError claro', async () => {
  await assert.rejects(setup([]).table.all(), (e: unknown) => e instanceof SchemaError && /sheet:setup/.test(e.message))
  await assert.rejects(
    setup([['id', 'username']]).table.all(),
    (e: unknown) => e instanceof SchemaError && /password_hash, created_at/.test(e.message)
  )
})

test('el backend de archivo persiste y crea las cabeceras que faltan', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'carta-'))
  const file = path.join(dir, 'sub', 'db.json')
  const first = createMemoryBackend({ tables: ALL_TABLES, filePath: file })
  await first.appendRows('usuarios', [['1', 'ana', 'h', 'f']])
  const second = createMemoryBackend({ tables: ALL_TABLES, filePath: file })
  assert.deepEqual(await second.readRows('usuarios'), [USUARIOS.columns.slice(), ['1', 'ana', 'h', 'f']])
  assert.deepEqual((await second.readRows('productos'))[0]?.[0], 'id')
})

test('el backend en memoria no filtra referencias internas', async () => {
  const backend = createMemoryBackend({ tables: ALL_TABLES })
  const rows = await backend.readRows('usuarios')
  rows[0][0] = 'ROTO'
  assert.equal((await backend.readRows('usuarios'))[0][0], 'id')
})
