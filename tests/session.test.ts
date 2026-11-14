import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSessionToken, verifySessionToken } from '../src/lib/auth/session.ts'

const SECRET = 'a'.repeat(32)
const NOW = Date.UTC(2026, 10, 8)

test('un token válido se verifica y devuelve el usuario', () => {
  const token = createSessionToken('user-1', SECRET, { now: NOW })
  assert.deepEqual(verifySessionToken(token, SECRET, NOW + 1000), {
    uid: 'user-1',
    exp: Math.floor(NOW / 1000) + 60 * 60 * 24 * 30
  })
})

test('caduca', () => {
  const token = createSessionToken('user-1', SECRET, { now: NOW, ttlSeconds: 60 })
  assert.ok(verifySessionToken(token, SECRET, NOW + 59_000))
  assert.equal(verifySessionToken(token, SECRET, NOW + 60_000), null)
})

test('rechaza otro secreto', () => {
  const token = createSessionToken('user-1', SECRET, { now: NOW })
  assert.equal(verifySessionToken(token, 'b'.repeat(32), NOW), null)
})

test('rechaza un payload manipulado', () => {
  const token = createSessionToken('user-1', SECRET, { now: NOW })
  const [, signature] = token.split('.')
  const forged = Buffer.from(
    JSON.stringify({ uid: 'admin', exp: Math.floor(NOW / 1000) + 99999 })
  ).toString('base64url')
  assert.equal(verifySessionToken(`${forged}.${signature}`, SECRET, NOW), null)
})

test('rechaza basura sin lanzar', () => {
  for (const bad of [undefined, '', 'x', 'a.b.c', '.', 'a.', '.b', '%%%.%%%']) {
    assert.equal(verifySessionToken(bad, SECRET, NOW), null, String(bad))
  }
})
