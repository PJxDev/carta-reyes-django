import assert from 'node:assert/strict'
import { test } from 'node:test'
import { burnPasswordCheck, hashPassword, verifyPassword } from '../src/lib/auth/password.ts'

// Hash en formato Django generado con el mismo algoritmo que PBKDF2PasswordHasher
// (PBKDF2-HMAC-SHA256, 870000 iteraciones, salt como texto, hash en base64).
const DJANGO_HASH =
  'pbkdf2_sha256$870000$Ab3dEfGh1JkL$9OSNL+2wW0ZXWOVtoFLSyUegOussE0B0Hht0wzNij+0='

test('hashPassword genera un hash scrypt que se verifica', async () => {
  const hash = await hashPassword('una contraseña larga')
  assert.match(hash, /^scrypt\$16384\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/)
  assert.deepEqual(await verifyPassword('una contraseña larga', hash), {
    valid: true,
    needsRehash: false
  })
})

test('una contraseña incorrecta no valida', async () => {
  const hash = await hashPassword('correcta-123')
  assert.equal((await verifyPassword('incorrecta-123', hash)).valid, false)
  assert.equal((await verifyPassword('', hash)).valid, false)
})

test('dos hashes de la misma contraseña son distintos (salt aleatorio)', async () => {
  assert.notEqual(await hashPassword('misma'), await hashPassword('misma'))
})

test('acepta hashes de Django y pide actualizarlos', async () => {
  assert.deepEqual(await verifyPassword('contraseña-secreta', DJANGO_HASH), {
    valid: true,
    needsRehash: true
  })
  assert.deepEqual(await verifyPassword('contraseña-secreta!', DJANGO_HASH), {
    valid: false,
    needsRehash: false
  })
})

test('formatos desconocidos o corruptos nunca validan ni lanzan', async () => {
  for (const stored of [
    '',
    '!sinclave',
    'md5$abc$def',
    'scrypt$a$b$c$d$e',
    'scrypt$3$8$1$c2FsdA==$',
    'scrypt$16384$8$1$c2FsdA==$',
    'pbkdf2_sha256$0$salt$aGFzaA==',
    'pbkdf2_sha256$x$salt$aGFzaA=='
  ]) {
    assert.equal((await verifyPassword('lo-que-sea', stored)).valid, false, stored)
  }
})

test('las contraseñas Unicode equivalentes (NFC/NFD) coinciden', async () => {
  const hash = await hashPassword('contraseña') // ñ compuesta
  assert.equal((await verifyPassword('contraseña', hash)).valid, true) // n + tilde
})

test('burnPasswordCheck termina sin error', async () => {
  await burnPasswordCheck('cualquiera')
})
