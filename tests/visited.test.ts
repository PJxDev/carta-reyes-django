import assert from 'node:assert/strict'
import { test } from 'node:test'
import { VISITED_MAX, VISITED_TTL_MS, addVisit, parseVisits, removeVisit } from '../src/lib/visited.ts'

const NOW = Date.UTC(2026, 10, 10)

test('visitadas: se añaden arriba, sin duplicados y con un máximo', () => {
  let v = parseVisits(null, NOW)
  v = addVisit(v, 'Ana', NOW)
  v = addVisit(v, 'bea', NOW + 1)
  v = addVisit(v, 'ANA', NOW + 2)
  assert.deepEqual(v.map((x) => x.username), ['ana', 'bea'])
  for (let i = 0; i < 20; i++) v = addVisit(v, `u${i}`, NOW + 10 + i)
  assert.equal(v.length, VISITED_MAX)
  assert.equal(v[0].username, 'u19')
  assert.deepEqual(removeVisit(v, 'u19').map((x) => x.username).includes('u19'), false)
  assert.equal(addVisit(v, '   ', NOW), v)
})

test('visitadas: caducan a los 6 meses y se ignoran datos corruptos', () => {
  const raw = JSON.stringify([
    { username: 'vieja', at: NOW - VISITED_TTL_MS - 1 },
    { username: 'reciente', at: NOW - 1000 },
    { username: 'futura', at: NOW + 30 * 24 * 3600 * 1000 },
    { username: 5, at: NOW },
    { username: 'x'.repeat(61), at: NOW },
    null,
    'texto'
  ])
  assert.deepEqual(parseVisits(raw, NOW).map((x) => x.username), ['reciente'])
  for (const bad of ['{', '{"a":1}', '', undefined]) assert.deepEqual(parseVisits(bad, NOW), [])
})
