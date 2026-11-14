import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hashPassword, verifyPassword } from '../src/lib/auth/password.ts'
import { authenticate, registerUser } from '../src/lib/services/accounts.ts'
import { makeRepos } from './support/helpers.ts'

const DJANGO_HASH = 'pbkdf2_sha256$870000$Ab3dEfGh1JkL$9OSNL+2wW0ZXWOVtoFLSyUegOussE0B0Hht0wzNij+0='
const good = { username: 'Pedro', password: 'clave-larga-1', password2: 'clave-larga-1' }

test('registro correcto: usuario en minúsculas y contraseña guardada con hash', async () => {
  const { repos } = makeRepos()
  const result = await registerUser(repos, good)
  assert.ok(result.ok)
  assert.equal(result.usuario.username, 'pedro')
  assert.match(result.usuario.passwordHash, /^scrypt\$/)
  assert.ok((await verifyPassword('clave-larga-1', result.usuario.passwordHash)).valid)
})

test('registro: errores en español y sin crear nada', async () => {
  const { repos } = makeRepos()
  assert.deepEqual(await registerUser(repos, { ...good, password2: 'otra' }), { ok: false, error: 'Las contraseñas no coinciden' })
  assert.match((await registerUser(repos, { ...good, password: 'corta', password2: 'corta' }) as any).error, /al menos 8/)
  assert.match((await registerUser(repos, { ...good, username: 'login' }) as any).error, /no está disponible/)
  assert.match((await registerUser(repos, { ...good, username: 'a' }) as any).error, /entre 3 y 30/)
  assert.equal((await registerUser(repos, { password: 'x' })).ok, false)
  assert.equal((await repos.usuarios.all()).length, 0)
})

test('registro: usuario repetido (sin distinguir mayúsculas)', async () => {
  const { repos } = makeRepos()
  assert.ok((await registerUser(repos, good)).ok)
  assert.deepEqual(await registerUser(repos, { ...good, username: 'PEDRO' }), { ok: false, error: 'Usuario ya existe' })
})

test('login correcto, sin distinguir mayúsculas del usuario', async () => {
  const { repos } = makeRepos()
  await registerUser(repos, good)
  const result = await authenticate(repos, { username: ' PEDRO ', password: 'clave-larga-1' })
  assert.ok(result.ok)
  assert.equal(result.usuario.username, 'pedro')
})

test('login: mismo mensaje si el usuario no existe o la contraseña es mala', async () => {
  const { repos } = makeRepos()
  await registerUser(repos, good)
  const expected = { ok: false, error: 'Usuario no existe o contraseña incorrecta' }
  assert.deepEqual(await authenticate(repos, { username: 'pedro', password: 'mala' }), expected)
  assert.deepEqual(await authenticate(repos, { username: 'nadie', password: 'clave-larga-1' }), expected)
  assert.deepEqual(await authenticate(repos, { username: '', password: '' }), expected)
  assert.deepEqual(await authenticate(repos, {}), expected)
})

test('login con hash de Django: entra y el hash se actualiza a scrypt', async () => {
  const { repos } = makeRepos()
  await repos.usuarios.createMany([{ id: '1', username: 'pedro', passwordHash: DJANGO_HASH, email: '', resetHash: '', resetExpires: '', createdAt: '2024-01-01T00:00:00.000Z' }])
  assert.ok((await authenticate(repos, { username: 'pedro', password: 'contraseña-secreta' })).ok)
  const after = await repos.usuarios.findById('1')
  assert.match(after!.passwordHash, /^scrypt\$/)
  assert.ok((await authenticate(repos, { username: 'pedro', password: 'contraseña-secreta' })).ok) // sigue entrando
  assert.equal((await authenticate(repos, { username: 'pedro', password: 'otra' })).ok, false)
})

test('login: usuario importado con contraseña inutilizable de Django no puede entrar', async () => {
  const { repos } = makeRepos()
  await repos.usuarios.createMany([{ id: '1', username: 'pedro', passwordHash: '!abcdef', email: '', resetHash: '', resetExpires: '', createdAt: '2024-01-01T00:00:00.000Z' }])
  assert.equal((await authenticate(repos, { username: 'pedro', password: '!abcdef' })).ok, false)
  assert.equal((await authenticate(repos, { username: 'pedro', password: '' })).ok, false)
  void hashPassword
})
