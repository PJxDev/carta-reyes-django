import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  isHttpUrl,
  parseUrlList,
  validatePassword,
  validateProductoInput,
  validateUsername
} from '../src/lib/validation.ts'

test('usuario: normaliza a minúsculas y valida el formato', () => {
  assert.deepEqual(validateUsername('  Pedro_J  '), { ok: true, value: 'pedro_j' })
  assert.deepEqual(validateUsername('a.b-c_9'), { ok: true, value: 'a.b-c_9' })
  for (const bad of ['ab', 'x'.repeat(31), 'con espacio', 'ñandú', '.oculto', '-guion', 'a/b', 'a?b']) {
    assert.equal(validateUsername(bad).ok, false, bad)
  }
})

test('usuario: no admite rutas reservadas (sin importar mayúsculas)', () => {
  for (const name of ['login', 'Registro', 'EDITOR', 'pillados', 'api', 'logout', 'admin']) {
    assert.equal(validateUsername(name).ok, false, name)
  }
})

test('contraseña: longitud y no igual al usuario', () => {
  assert.equal(validatePassword('corta', 'pedro').ok, false)
  assert.equal(validatePassword('x'.repeat(129), 'pedro').ok, false)
  assert.equal(validatePassword('PEDRO12345', 'pedro12345').ok, false)
  assert.equal(validatePassword('12345678', 'pedro').ok, true)
})

test('isHttpUrl solo acepta http y https', () => {
  assert.equal(isHttpUrl('https://a.com/x?y=1'), true)
  assert.equal(isHttpUrl('http://a.com'), true)
  for (const bad of ['javascript:alert(1)', 'data:text/html,hola', 'ftp://a.com', '//a.com', 'a.com', '']) {
    assert.equal(isHttpUrl(bad), false, bad)
  }
})

test('parseUrlList acepta array JSON, texto con comas y listas', () => {
  const expected = { ok: true, value: ['https://a.com', 'https://b.com'] }
  assert.deepEqual(parseUrlList('["https://a.com","https://b.com"]', 'L'), expected)
  assert.deepEqual(parseUrlList('https://a.com, https://b.com', 'L'), expected)
  assert.deepEqual(parseUrlList('https://a.com\nhttps://b.com', 'L'), expected)
  assert.deepEqual(parseUrlList(['https://a.com', ' https://b.com '], 'L'), expected)
  assert.deepEqual(parseUrlList('', 'L'), { ok: true, value: [] })
  assert.deepEqual(parseUrlList(undefined, 'L'), { ok: true, value: [] })
})

test('parseUrlList quita duplicados y rechaza lo no válido', () => {
  assert.deepEqual(parseUrlList('https://a.com, https://a.com', 'L'), { ok: true, value: ['https://a.com'] })
  assert.equal(parseUrlList('javascript:alert(1)', 'L').ok, false)
  assert.equal(parseUrlList('["https://a.com", 3]', 'L').ok, false)
  assert.equal(parseUrlList('[no es json', 'L').ok, false)
  assert.equal(parseUrlList('{"a":1}', 'L').ok, false)
  assert.equal(parseUrlList(42, 'L').ok, false)
  assert.equal(parseUrlList('https://a.com/' + 'x'.repeat(2000), 'L').ok, false)
  const eleven = Array.from({ length: 11 }, (_, i) => `https://a.com/${i}`)
  assert.equal(parseUrlList(eleven, 'L').ok, false)
})

test('validateProductoInput recorta y valida', () => {
  const ok = validateProductoInput({
    name: '  Bici  ',
    description: '  roja ',
    links: '["https://a.com"]',
    images: ''
  })
  assert.deepEqual(ok, {
    ok: true,
    value: { name: 'Bici', description: 'roja', links: ['https://a.com'], images: [], price: null, priority: null }
  })
  assert.equal(validateProductoInput({ name: '   ' }).ok, false)
  assert.equal(validateProductoInput({}).ok, false)
  assert.equal(validateProductoInput({ name: 'x'.repeat(201) }).ok, false)
  assert.equal(validateProductoInput({ name: 'x', description: 'y'.repeat(2001) }).ok, false)
  assert.equal(validateProductoInput({ name: 'x', links: 'ftp://a.com' }).ok, false)
})
