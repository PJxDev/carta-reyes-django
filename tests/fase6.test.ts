import assert from 'node:assert/strict'
import { test } from 'node:test'
import { verifyPassword } from '../src/lib/auth/password.ts'
import { createResendMailer } from '../src/lib/mail/mailer.ts'
import type { MailMessage, Mailer } from '../src/lib/mail/mailer.ts'
import { registerUser, authenticate } from '../src/lib/services/accounts.ts'
import {
  RESET_MIN_INTERVAL_MS,
  RESET_TTL_MS,
  requestPasswordReset,
  resetPasswordWithToken
} from '../src/lib/services/recovery.ts'
import { checkImage, MAX_IMAGE_BYTES } from '../src/lib/uploads/images.ts'
import { parsePrice, parsePriority, validateEmail, validateProductoInput } from '../src/lib/validation.ts'
import { PRODUCT_INPUT, makeRepos } from './support/helpers.ts'

const SITE = 'https://carta.example'

function outbox() {
  const sent: MailMessage[] = []
  const mailer: Mailer = { async send(m) { sent.push(m) } }
  return { sent, mailer }
}

async function ana(email = 'ana@example.com') {
  const ctx = makeRepos()
  const r = await registerUser(ctx.repos, { username: 'ana', password: 'clave-larga-1', password2: 'clave-larga-1', email })
  assert.ok(r.ok)
  return { ...ctx, usuario: r.usuario }
}

const tokenOf = (m: MailMessage) => decodeURIComponent(/token=([^\s"]+)/.exec(m.text)![1])

test('email, precio y prioridad se validan y normalizan', () => {
  assert.deepEqual(validateEmail('  Ana@Example.COM '), { ok: true, value: 'ana@example.com' })
  assert.deepEqual(validateEmail(''), { ok: true, value: '' })
  assert.equal(validateEmail('sin-arroba').ok, false)
  assert.deepEqual(parsePrice('24,95'), { ok: true, value: 24.95 })
  assert.deepEqual(parsePrice('25 €'), { ok: true, value: 25 })
  assert.deepEqual(parsePrice(''), { ok: true, value: null })
  for (const bad of ['-3', '1e3', 'mucho', '1,234', '100001']) assert.equal(parsePrice(bad).ok, false, bad)
  assert.deepEqual(parsePriority('alta'), { ok: true, value: 'alta' })
  assert.deepEqual(parsePriority(''), { ok: true, value: null })
  assert.equal(parsePriority('urgente').ok, false)
  const v = validateProductoInput({ name: 'Bici', price: '12,5', priority: 'media' })
  assert.ok(v.ok && v.value.price === 12.5 && v.value.priority === 'media')
})

test('precio y prioridad se guardan y se leen de la hoja', async () => {
  const { repos, usuario } = await ana()
  const p = await repos.productos.create(usuario.id, { ...PRODUCT_INPUT, price: 24.95, priority: 'alta' })
  const read = await repos.productos.findById(p.id)
  assert.equal(read?.price, 24.95)
  assert.equal(read?.priority, 'alta')
})

test('registro con email: lo guarda, y no admite uno repetido', async () => {
  const { repos, usuario } = await ana()
  assert.equal(usuario.email, 'ana@example.com')
  assert.equal((await repos.usuarios.findByEmail('ANA@example.com'))?.id, usuario.id)
  const dup = await registerUser(repos, { username: 'bea', password: 'clave-larga-1', password2: 'clave-larga-1', email: 'ana@example.com' })
  assert.deepEqual(dup, { ok: false, error: 'Ese email ya está en uso' })
  const sin = await registerUser(repos, { username: 'bea', password: 'clave-larga-1', password2: 'clave-larga-1' })
  assert.ok(sin.ok && sin.usuario.email === '')
})

test('recuperación: envía un enlace, el token vale una vez y cambia la contraseña', async () => {
  const { repos, usuario } = await ana()
  const { sent, mailer } = outbox()
  const now = Date.now()
  assert.deepEqual(await requestPasswordReset(repos, mailer, { email: 'ana@example.com', siteUrl: SITE, now }), { ok: true })
  assert.equal(sent.length, 1)
  assert.match(sent[0].text, /^Hola ana/)
  assert.ok(sent[0].text.includes(`${SITE}/restablecer?token=`))
  const token = tokenOf(sent[0])
  // en la hoja solo queda el hash, nunca el secreto
  const stored = (await repos.usuarios.findById(usuario.id))!
  assert.equal(stored.resetHash.length, 64)
  assert.ok(!token.includes(stored.resetHash) && !stored.resetHash.includes(token.split('.')[1]))

  const bad = await resetPasswordWithToken(repos, { token, password: 'otra-clave-9', password2: 'distinta', now })
  assert.deepEqual(bad, { ok: false, error: 'Las contraseñas no coinciden' })
  const ok = await resetPasswordWithToken(repos, { token, password: 'otra-clave-9', password2: 'otra-clave-9', now })
  assert.ok(ok.ok)
  assert.ok((await authenticate(repos, { username: 'ana', password: 'otra-clave-9' })).ok)
  assert.ok(!(await authenticate(repos, { username: 'ana', password: 'clave-larga-1' })).ok)
  // el token ya no sirve
  const again = await resetPasswordWithToken(repos, { token, password: 'tercera-clave-7', password2: 'tercera-clave-7', now })
  assert.equal(again.ok, false)
  assert.equal((await verifyPassword('otra-clave-9', (await repos.usuarios.findById(usuario.id))!.passwordHash)).valid, true)
})

test('recuperación: caducidad, token manipulado y token de otro usuario', async () => {
  const { repos } = await ana()
  const { sent, mailer } = outbox()
  const now = Date.now()
  await requestPasswordReset(repos, mailer, { email: 'ana@example.com', siteUrl: SITE, now })
  const token = tokenOf(sent[0])
  const input = { password: 'otra-clave-9', password2: 'otra-clave-9' }
  assert.equal((await resetPasswordWithToken(repos, { ...input, token, now: now + RESET_TTL_MS + 1 })).ok, false)
  assert.equal((await resetPasswordWithToken(repos, { ...input, token: token + 'x', now })).ok, false)
  assert.equal((await resetPasswordWithToken(repos, { ...input, token: 'sin-punto', now })).ok, false)
  assert.equal((await resetPasswordWithToken(repos, { ...input, token: undefined, now })).ok, false)
  assert.equal((await resetPasswordWithToken(repos, { ...input, token: `otro-id.${token.split('.')[1]}`, now })).ok, false)
})

test('recuperación: misma respuesta exista o no la cuenta, y límite de frecuencia', async () => {
  const { repos } = await ana()
  const { sent, mailer } = outbox()
  const now = Date.now()
  assert.deepEqual(await requestPasswordReset(repos, mailer, { email: 'nadie@example.com', siteUrl: SITE, now }), { ok: true })
  assert.equal(sent.length, 0)
  await requestPasswordReset(repos, mailer, { email: 'ana@example.com', siteUrl: SITE, now })
  await requestPasswordReset(repos, mailer, { email: 'ana@example.com', siteUrl: SITE, now: now + 1000 })
  assert.equal(sent.length, 1) // el segundo se ignora
  await requestPasswordReset(repos, mailer, { email: 'ana@example.com', siteUrl: SITE, now: now + RESET_MIN_INTERVAL_MS + 1 })
  assert.equal(sent.length, 2)
  assert.equal((await requestPasswordReset(repos, mailer, { email: 'mal', siteUrl: SITE })).ok, false)
  assert.equal((await requestPasswordReset(repos, mailer, { email: '', siteUrl: SITE })).ok, false)
})

test('recuperación: si el envío falla se avisa, y el HTML escapa el nombre', async () => {
  const { repos } = await ana()
  const failing: Mailer = { async send() { throw new Error('caído') } }
  const original = console.error
  console.error = () => {}
  try {
    const r = await requestPasswordReset(repos, failing, { email: 'ana@example.com', siteUrl: SITE })
    assert.equal(r.ok, false)
  } finally {
    console.error = original
  }
})

test('Resend: petición correcta y error con detalle', async () => {
  const calls: { url: string; init: RequestInit }[] = []
  const mailer = createResendMailer({
    apiKey: 're_clave',
    from: 'Carta <a@b.com>',
    fetch: async (url, init) => {
      calls.push({ url, init })
      return new Response('{"id":"1"}', { status: 200 })
    }
  })
  await mailer.send({ to: 'x@y.com', subject: 's', text: 't', html: 'h' })
  assert.equal(calls[0].url, 'https://api.resend.com/emails')
  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, 'Bearer re_clave')
  assert.deepEqual(JSON.parse(calls[0].init.body as string), { from: 'Carta <a@b.com>', to: ['x@y.com'], subject: 's', text: 't', html: 'h' })
  const broken = createResendMailer({ apiKey: 'k', from: 'f', fetch: async () => new Response('domain not verified', { status: 403 }) })
  await assert.rejects(broken.send({ to: 'x@y.com', subject: 's', text: 't', html: 'h' }), /403.*domain not verified/)
})

test('imágenes: se reconocen por contenido, no por lo que diga el navegador', () => {
  const jpg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0])
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])
  const webp = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])
  assert.deepEqual(checkImage(jpg), { ok: true, kind: { contentType: 'image/jpeg', extension: 'jpg' } })
  assert.ok(checkImage(png).ok && checkImage(webp).ok)
  assert.equal(checkImage(new TextEncoder().encode('<svg onload=alert(1)>')).ok, false)
  assert.equal(checkImage(new TextEncoder().encode('GIF89a')).ok, false)
  assert.equal(checkImage(new Uint8Array(0)).ok, false)
  const big = new Uint8Array(MAX_IMAGE_BYTES + 1)
  big.set(jpg)
  assert.deepEqual(checkImage(big), { ok: false, error: 'La imagen pesa demasiado (máximo 2 MB)' })
})

test('seguidos: seguir es idempotente, no se puede seguir a uno mismo y se ordena por fecha', async () => {
  const { repos, usuario } = await ana()
  const b = await repos.usuarios.create({ username: 'bea', passwordHash: 'h' })
  const c = await repos.usuarios.create({ username: 'carla', passwordHash: 'h' })
  assert.ok(b.status === 'created' && c.status === 'created')
  assert.equal(await repos.seguidos.follow(usuario.id, usuario.id), 'self')
  await repos.seguidos.follow(usuario.id, b.usuario.id)
  await repos.seguidos.follow(usuario.id, b.usuario.id)
  await new Promise((r) => setTimeout(r, 5))
  await repos.seguidos.follow(usuario.id, c.usuario.id)
  assert.deepEqual((await repos.seguidos.listFollowed(usuario.id)).map((s) => s.followedId), [c.usuario.id, b.usuario.id])
  assert.equal(await repos.seguidos.isFollowing(usuario.id, b.usuario.id), true)
  assert.equal(await repos.seguidos.isFollowing(b.usuario.id, usuario.id), false)
  await repos.seguidos.unfollow(usuario.id, b.usuario.id)
  await repos.seguidos.unfollow(usuario.id, b.usuario.id)
  assert.deepEqual((await repos.seguidos.listFollowed(usuario.id)).map((s) => s.followedId), [c.usuario.id])
})
