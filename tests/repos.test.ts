import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PRODUCT_INPUT, makeRepos } from './support/helpers.ts'

async function twoUsers() {
  const ctx = makeRepos()
  const a = await ctx.repos.usuarios.create({ username: 'Ana', passwordHash: 'h' })
  const b = await ctx.repos.usuarios.create({ username: 'bea', passwordHash: 'h' })
  const c = await ctx.repos.usuarios.create({ username: 'carla', passwordHash: 'h' })
  assert.ok(a.status === 'created' && b.status === 'created' && c.status === 'created')
  return { ...ctx, ana: a.usuario, bea: b.usuario, carla: c.usuario }
}

test('usuarios: se guardan en minúsculas y el nombre es único sin distinguir mayúsculas', async () => {
  const { repos, ana } = await twoUsers()
  assert.equal(ana.username, 'ana')
  assert.match(ana.id, /^[0-9a-f-]{36}$/)
  assert.deepEqual(await repos.usuarios.create({ username: 'ANA', passwordHash: 'x' }), {
    status: 'username_taken'
  })
  assert.equal((await repos.usuarios.findByUsername('  AnA ')) ?.id, ana.id)
  assert.equal(await repos.usuarios.findByUsername('nadie'), null)
  assert.equal((await repos.usuarios.findById(ana.id))?.username, 'ana')
  assert.equal(await repos.usuarios.findById('no-existe'), null)
})

test('usuarios: registros simultáneos con el mismo nombre solo crean uno', async () => {
  const { repos } = makeRepos()
  const results = await Promise.all(
    Array.from({ length: 6 }, () => repos.usuarios.create({ username: 'repe', passwordHash: 'h' }))
  )
  assert.equal(results.filter((r) => r.status === 'created').length, 1)
  assert.equal((await repos.usuarios.all()).length, 1)
})

test('usuarios: setPasswordHash cambia solo el hash', async () => {
  const { repos, ana } = await twoUsers()
  await repos.usuarios.setPasswordHash(ana.id, 'nuevo')
  const after = await repos.usuarios.findById(ana.id)
  assert.equal(after?.passwordHash, 'nuevo')
  assert.equal(after?.username, 'ana')
  assert.equal(after?.createdAt, ana.createdAt)
})

test('productos: crear, listar por usuario y recuperar tal cual', async () => {
  const { repos, ana, bea } = await twoUsers()
  const p1 = await repos.productos.create(ana.id, PRODUCT_INPUT)
  const p2 = await repos.productos.create(ana.id, { ...PRODUCT_INPUT, name: 'Libro', links: [], images: [], description: '' })
  await repos.productos.create(bea.id, { ...PRODUCT_INPUT, name: 'De Bea' })
  assert.deepEqual(await repos.productos.findById(p1.id), p1)
  assert.deepEqual((await repos.productos.listByUser(ana.id)).map((p) => p.name), ['Bicicleta', 'Libro'])
  assert.deepEqual(await repos.productos.findById(p2.id), { ...p2, links: [], images: [], description: '' })
  assert.equal((await repos.productos.listByUser(bea.id)).length, 1)
  assert.equal(p1.pilladoUserId, null)
})

test('productos: solo el autor puede modificar o borrar', async () => {
  const { repos, ana, bea } = await twoUsers()
  const p = await repos.productos.create(ana.id, PRODUCT_INPUT)
  const edit = { ...PRODUCT_INPUT, name: 'Nuevo nombre', links: [] }

  assert.equal(await repos.productos.update(p.id, bea.id, edit), 'forbidden')
  assert.equal(await repos.productos.remove(p.id, bea.id), 'forbidden')
  assert.equal((await repos.productos.findById(p.id))?.name, 'Bicicleta')

  assert.equal(await repos.productos.update(p.id, ana.id, edit), 'ok')
  assert.deepEqual(await repos.productos.findById(p.id), { ...p, name: 'Nuevo nombre', links: [] })

  assert.equal(await repos.productos.update('nope', ana.id, edit), 'not_found')
  assert.equal(await repos.productos.remove('nope', ana.id), 'not_found')
  assert.equal(await repos.productos.remove(p.id, ana.id), 'ok')
  assert.equal(await repos.productos.findById(p.id), null)
})

test('editar no altera quién pilló el producto ni su fecha', async () => {
  const { repos, ana, bea } = await twoUsers()
  const p = await repos.productos.create(ana.id, PRODUCT_INPUT)
  await repos.productos.pillar(p.id, bea.id)
  await repos.productos.update(p.id, ana.id, { ...PRODUCT_INPUT, name: 'Otro' })
  const after = await repos.productos.findById(p.id)
  assert.equal(after?.pilladoUserId, bea.id)
  assert.equal(after?.createdAt, p.createdAt)
})

test('pillar: no el propio, no uno ya pillado por otro; idempotente para quien lo pilló', async () => {
  const { repos, ana, bea, carla } = await twoUsers()
  const p = await repos.productos.create(ana.id, PRODUCT_INPUT)

  assert.equal(await repos.productos.pillar(p.id, ana.id), 'own_product')
  assert.equal(await repos.productos.pillar('nope', bea.id), 'not_found')
  assert.equal(await repos.productos.pillar(p.id, bea.id), 'ok')
  assert.equal(await repos.productos.pillar(p.id, bea.id), 'ok')
  assert.equal(await repos.productos.pillar(p.id, carla.id), 'taken')
  assert.equal((await repos.productos.findById(p.id))?.pilladoUserId, bea.id)
  assert.deepEqual((await repos.productos.listPilladosBy(bea.id)).map((x) => x.id), [p.id])
  assert.deepEqual(await repos.productos.listPilladosBy(carla.id), [])
})

test('pillar: con dos personas a la vez solo gana una', async () => {
  const { repos, ana, bea, carla } = await twoUsers()
  const p = await repos.productos.create(ana.id, PRODUCT_INPUT)
  const results = await Promise.all([
    repos.productos.pillar(p.id, bea.id),
    repos.productos.pillar(p.id, carla.id)
  ])
  assert.deepEqual([...results].sort(), ['ok', 'taken'])
  const winner = results[0] === 'ok' ? bea.id : carla.id
  assert.equal((await repos.productos.findById(p.id))?.pilladoUserId, winner)
})

test('despillar: solo quien lo pilló; liberar uno libre es inofensivo', async () => {
  const { repos, ana, bea, carla } = await twoUsers()
  const p = await repos.productos.create(ana.id, PRODUCT_INPUT)
  assert.equal(await repos.productos.despillar(p.id, bea.id), 'ok') // ya libre
  await repos.productos.pillar(p.id, bea.id)
  assert.equal(await repos.productos.despillar(p.id, carla.id), 'not_yours')
  assert.equal((await repos.productos.findById(p.id))?.pilladoUserId, bea.id)
  assert.equal(await repos.productos.despillar(p.id, bea.id), 'ok')
  assert.equal((await repos.productos.findById(p.id))?.pilladoUserId, null)
  assert.equal(await repos.productos.despillar('nope', bea.id), 'not_found')
})

test('al leer, las celdas editadas a mano se interpretan con tolerancia y sin URLs peligrosas', async () => {
  const { backend, repos, ana } = await twoUsers()
  await backend.appendRows('productos', [
    ['m1', ana.id, 'A mano', 'desc', 'https://a.com, https://b.com', '["https://i.com/1.png","javascript:alert(1)"]', 'f', ''],
    ['m2', ana.id, 'Roto', '', '[esto no es json', 'ftp://x.com', 'f', ''],
    ['m3', ana.id, 'Corto']
  ])
  const [m1, m2, m3] = (await repos.productos.listByUser(ana.id)).slice(-3)
  assert.deepEqual(m1.links, ['https://a.com', 'https://b.com'])
  assert.deepEqual(m1.images, ['https://i.com/1.png'])
  assert.deepEqual([m2.links, m2.images], [[], []])
  assert.deepEqual({ ...m3, createdAt: '' }, {
    id: 'm3', userId: ana.id, name: 'Corto', description: '', links: [], images: [], createdAt: '', pilladoUserId: null
  })
})

test('valores que parecen fórmulas se guardan como texto literal', async () => {
  const { backend, repos, ana } = await twoUsers()
  const p = await repos.productos.create(ana.id, {
    ...PRODUCT_INPUT,
    name: '=HYPERLINK("http://malo.example","clic")',
    description: '+cmd|calc'
  })
  const stored = (await backend.readRows('productos')).find((r) => r[0] === p.id)
  assert.equal(stored?.[2], '=HYPERLINK("http://malo.example","clic")')
  assert.equal((await repos.productos.findById(p.id))?.description, '+cmd|calc')
})
