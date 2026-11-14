import assert from 'node:assert/strict'
import { test } from 'node:test'
import { verifyPassword } from '../src/lib/auth/password.ts'
import { importDjangoDump } from '../src/lib/import/django-dump.ts'
import type { DjangoDumpEntry } from '../src/lib/import/django-dump.ts'
import { makeRepos } from './support/helpers.ts'

const DJANGO_HASH = 'pbkdf2_sha256$870000$Ab3dEfGh1JkL$9OSNL+2wW0ZXWOVtoFLSyUegOussE0B0Hht0wzNij+0='

const dump = (): DjangoDumpEntry[] => [
  { model: 'auth.user', pk: 1, fields: { username: 'pedro', password: DJANGO_HASH, date_joined: '2024-11-20T10:00:00Z', is_staff: true } },
  { model: 'auth.user', pk: 2, fields: { username: 'Lucia', password: 'pbkdf2_sha256$1$s$aA==', date_joined: '2024-12-01T09:30:00Z' } },
  { model: 'auth.user', pk: 3, fields: { username: 'editor', password: '!x', date_joined: '2024-12-02T00:00:00Z' } },
  {
    model: 'cartas.producto', pk: 10,
    fields: { name: 'Bici', description: 'roja', links: ['https://a.com', 'https://b.com'], images: ['https://i.com/1.jpg'], created: '2024-12-05T12:00:00Z', user_id: 1, pillado_user: 2 }
  },
  {
    model: 'cartas.producto', pk: 11,
    fields: { name: 'Libro', description: null, links: null, images: '["https://i.com/2.jpg","javascript:x"]', created: '2024-12-06T12:00:00Z', user_id: 1, pillado_user: null }
  },
  { model: 'cartas.producto', pk: 12, fields: { name: 'Huérfano', links: [], images: [], created: '2024-12-07T12:00:00Z', user_id: 99, pillado_user: null } },
  { model: 'cartas.producto', pk: 13, fields: { name: 'Pillador fantasma', links: [], images: [], created: '2024-12-07T12:00:00Z', user_id: 2, pillado_user: 77 } },
  { model: 'otra.cosa', pk: 1, fields: {} }
]

test('simulación: informa sin escribir', async () => {
  const { repos } = makeRepos()
  const report = await importDjangoDump(dump(), repos, { dryRun: true })
  assert.equal(report.usersToImport, 3)
  assert.equal(report.productosToImport, 3)
  assert.equal((await repos.usuarios.all()).length, 0)
  assert.equal((await repos.productos.all()).length, 0)
})

test('importa usuarios (conservando ids y hashes) y productos con sus relaciones', async () => {
  const { repos } = makeRepos()
  const report = await importDjangoDump(dump(), repos)
  assert.equal(report.usersToImport, 3)
  assert.equal(report.productosToImport, 3)

  const pedro = await repos.usuarios.findByUsername('pedro')
  const lucia = await repos.usuarios.findByUsername('lucia') // pasa a minúsculas
  assert.equal(pedro?.id, '1')
  assert.equal(pedro?.createdAt, '2024-11-20T10:00:00.000Z')
  assert.equal(lucia?.id, '2')

  // el usuario importado puede entrar con su contraseña de Django
  assert.equal((await verifyPassword('contraseña-secreta', pedro!.passwordHash)).valid, true)

  const bici = await repos.productos.findById('10')
  assert.deepEqual(bici, {
    id: '10', userId: '1', name: 'Bici', description: 'roja',
    links: ['https://a.com', 'https://b.com'], images: ['https://i.com/1.jpg'],
    createdAt: '2024-12-05T12:00:00.000Z', pilladoUserId: '2', price: null, priority: null
  })
  const libro = await repos.productos.findById('11')
  assert.deepEqual([libro?.description, libro?.links, libro?.images, libro?.pilladoUserId], ['', [], ['https://i.com/2.jpg'], null])
  assert.equal((await repos.productos.findById('13'))?.pilladoUserId, null)
  assert.equal(await repos.productos.findById('12'), null)
})

test('avisa de huérfanos, pilladores desconocidos, URLs descartadas y nombres reservados', async () => {
  const { repos } = makeRepos()
  const { warnings } = await importDjangoDump(dump(), repos)
  const text = warnings.join('\n')
  assert.match(text, /"editor": coincide con una ruta/)
  assert.match(text, /pk=12.*usuario \(pk=99\)/)
  assert.match(text, /pk=13.*pk=77.*queda libre/)
  assert.match(text, /pk=11: 1 imágenes descartados/)
})

test('es idempotente: repetirlo no duplica nada', async () => {
  const { repos } = makeRepos()
  await importDjangoDump(dump(), repos)
  const second = await importDjangoDump(dump(), repos)
  assert.equal(second.usersToImport, 0)
  assert.equal(second.usersAlreadyThere, 3)
  assert.equal(second.productosToImport, 0)
  assert.equal(second.productosAlreadyThere, 3)
  assert.equal((await repos.usuarios.all()).length, 3)
  assert.equal((await repos.productos.all()).length, 3)
})

test('si el id numérico ya lo usa otro usuario, se asigna uno nuevo y los productos siguen al usuario correcto', async () => {
  const { repos } = makeRepos()
  await repos.usuarios.createMany([{ id: '1', username: 'otra-persona', passwordHash: 'h', email: '', resetHash: '', resetExpires: '', createdAt: '2024-01-01T00:00:00.000Z' }])
  await importDjangoDump(dump(), repos)
  const pedro = await repos.usuarios.findByUsername('pedro')
  assert.notEqual(pedro?.id, '1')
  assert.equal((await repos.productos.findById('10'))?.userId, pedro?.id)
})

test('un usuario que ya existe en la hoja se reutiliza para sus productos', async () => {
  const { repos } = makeRepos()
  const created = await repos.usuarios.create({ username: 'pedro', passwordHash: 'nuevo' })
  assert.ok(created.status === 'created')
  const report = await importDjangoDump(dump(), repos)
  assert.equal(report.usersAlreadyThere, 1)
  assert.equal((await repos.usuarios.findByUsername('pedro'))?.passwordHash, 'nuevo') // no se pisa
  assert.equal((await repos.productos.findById('10'))?.userId, created.usuario.id)
})
