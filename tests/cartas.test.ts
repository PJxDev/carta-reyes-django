import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadCarta, loadEditor, loadPillados, statusFor } from '../src/lib/services/cartas.ts'
import { PRODUCT_INPUT, makeRepos } from './support/helpers.ts'

async function scenario() {
  const { repos } = makeRepos()
  const mk = async (username: string) => {
    const r = await repos.usuarios.create({ username, passwordHash: 'h' })
    assert.ok(r.status === 'created')
    return r.usuario
  }
  const ana = await mk('ana')
  const bea = await mk('bea')
  const carla = await mk('carla')
  const libre = await repos.productos.create(ana.id, { ...PRODUCT_INPUT, name: 'Libre' })
  const deBea = await repos.productos.create(ana.id, { ...PRODUCT_INPUT, name: 'De Bea' })
  await repos.productos.pillar(deBea.id, bea.id)
  return { repos, ana, bea, carla, libre, deBea }
}

test('carta inexistente', async () => {
  const { repos } = await scenario()
  assert.deepEqual(await loadCarta(repos, 'nadie', null), { found: false })
})

test('anónimo: ve la carta sin estados', async () => {
  const { repos } = await scenario()
  const page = await loadCarta(repos, 'ANA', null)
  assert.ok(page.found)
  assert.equal(page.isOwner, false)
  assert.deepEqual(page.productos.map((p) => p.status), ['none', 'none'])
})

test('el autor NO puede saber qué le han pillado', async () => {
  const { repos, ana } = await scenario()
  const page = await loadCarta(repos, 'ana', ana)
  assert.ok(page.found)
  assert.equal(page.isOwner, true)
  assert.deepEqual(page.productos.map((p) => p.status), ['none', 'none'])
  assert.ok(!JSON.stringify(page).includes('pillado'))
  assert.deepEqual((await loadEditor(repos, ana)).map((p) => p.status), ['none', 'none'])
})

test('otro usuario ve libre / pillado por él / pillado por otro', async () => {
  const { repos, bea, carla } = await scenario()
  const asBea = await loadCarta(repos, 'ana', bea)
  assert.ok(asBea.found)
  assert.deepEqual(asBea.productos.map((p) => [p.name, p.status]), [['Libre', 'free'], ['De Bea', 'mine']])
  const asCarla = await loadCarta(repos, 'ana', carla)
  assert.ok(asCarla.found)
  assert.deepEqual(asCarla.productos.map((p) => p.status), ['free', 'taken'])
})

test('a la vista del cliente no viajan ids de usuarios ni fechas', async () => {
  const { repos, carla, ana, bea } = await scenario()
  const json = JSON.stringify(await loadCarta(repos, 'ana', carla))
  for (const secret of [ana.id, bea.id, carla.id, 'createdAt', 'passwordHash', 'userId']) {
    assert.ok(!json.includes(secret), secret)
  }
})

test('pillados: solo los míos, con el nombre del dueño', async () => {
  const { repos, ana, bea } = await scenario()
  const mine = await loadPillados(repos, bea)
  assert.deepEqual(mine.map((p) => [p.name, p.ownerUsername, p.status]), [['De Bea', 'ana', 'mine']])
  assert.deepEqual(await loadPillados(repos, ana), [])
})

test('statusFor cubre todos los casos', async () => {
  const { repos, ana, bea, deBea, libre } = await scenario()
  const p = (await repos.productos.findById(deBea.id))!
  const q = (await repos.productos.findById(libre.id))!
  assert.equal(statusFor(p, null), 'none')
  assert.equal(statusFor(p, ana), 'none')
  assert.equal(statusFor(p, bea), 'mine')
  assert.equal(statusFor(q, bea), 'free')
})
