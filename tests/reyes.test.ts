import assert from 'node:assert/strict'
import { test } from 'node:test'
import { reyesMessage, reyesState } from '../src/lib/reyes.ts'

test('cuenta atrás: noviembre, víspera, día de Reyes y después', () => {
  assert.deepEqual(reyesState(new Date(2026, 10, 10)), { kind: 'countdown', days: 57 })
  assert.equal(reyesMessage(reyesState(new Date(2027, 0, 5, 23, 59))), 'Mañana llegan los Reyes')
  assert.deepEqual(reyesState(new Date(2027, 0, 6, 8)), { kind: 'today' })
  assert.deepEqual(reyesState(new Date(2027, 0, 7)), { kind: 'after' })
  assert.deepEqual(reyesState(new Date(2027, 0, 31)), { kind: 'after' })
  assert.deepEqual(reyesState(new Date(2027, 1, 1)), { kind: 'countdown', days: 339 })
  assert.deepEqual(reyesState(new Date(2026, 0, 1)), { kind: 'countdown', days: 5 })
})

test('cuenta atrás: el cambio de hora no desplaza los días', () => {
  assert.deepEqual(reyesState(new Date(2026, 9, 25, 12)), { kind: 'countdown', days: 73 })
  assert.deepEqual(reyesState(new Date(2026, 9, 24, 12)), { kind: 'countdown', days: 74 })
})
