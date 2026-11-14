import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ConfigError, getSessionSecret, loadConfig, normalizePrivateKey } from '../src/lib/config.ts'

const SHEETS_ENV = {
  GOOGLE_SHEET_ID: ' abc ',
  GOOGLE_SERVICE_ACCOUNT_EMAIL: 'bot@x.iam.gserviceaccount.com',
  GOOGLE_PRIVATE_KEY: '"-----BEGIN PRIVATE KEY-----\\nAAA\\n-----END PRIVATE KEY-----\\n"'
}

test('sin nada configurado en desarrollo usa el backend de archivo', () => {
  const config = loadConfig({ NODE_ENV: 'development' })
  assert.equal(config.backend, 'file')
  assert.equal(config.sheets, null)
  assert.equal(config.dataFile, '.data/db.json')
  assert.equal(config.cacheTtlMs, 5000)
})

test('con GOOGLE_SHEET_ID usa Sheets y normaliza la clave', () => {
  const config = loadConfig(SHEETS_ENV)
  assert.equal(config.backend, 'sheets')
  assert.equal(config.sheets?.sheetId, 'abc')
  assert.equal(
    config.sheets?.privateKey,
    '-----BEGIN PRIVATE KEY-----\nAAA\n-----END PRIVATE KEY-----\n'
  )
})

test('en producción sin credenciales falla indicando qué falta', () => {
  assert.throws(
    () => loadConfig({ NODE_ENV: 'production' }),
    (error: unknown) =>
      error instanceof ConfigError &&
      /GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY/.test(error.message)
  )
  assert.throws(
    () => loadConfig({ ...SHEETS_ENV, GOOGLE_PRIVATE_KEY: '  ' }),
    /GOOGLE_PRIVATE_KEY/
  )
})

test('DATA_BACKEND=file se respeta incluso en producción', () => {
  assert.equal(loadConfig({ NODE_ENV: 'production', DATA_BACKEND: 'file' }).backend, 'file')
})

test('valores inválidos se rechazan', () => {
  assert.throws(() => loadConfig({ DATA_BACKEND: 'mongo' }), ConfigError)
  assert.throws(() => loadConfig({ DATA_BACKEND: 'file', SHEETS_CACHE_TTL_MS: 'abc' }), ConfigError)
  assert.throws(() => loadConfig({ DATA_BACKEND: 'file', SHEETS_CACHE_TTL_MS: '-1' }), ConfigError)
  assert.equal(loadConfig({ DATA_BACKEND: 'file', SHEETS_CACHE_TTL_MS: '0' }).cacheTtlMs, 0)
})

test('normalizePrivateKey admite comillas simples, dobles y saltos reales', () => {
  assert.equal(normalizePrivateKey("'a\\nb'"), 'a\nb')
  assert.equal(normalizePrivateKey('a\nb'), 'a\nb')
})

test('SESSION_SECRET exige 32 caracteres', () => {
  assert.throws(() => getSessionSecret({}), ConfigError)
  assert.throws(() => getSessionSecret({ SESSION_SECRET: 'corto' }), ConfigError)
  assert.equal(getSessionSecret({ SESSION_SECRET: 'x'.repeat(32) }), 'x'.repeat(32))
})
