import { randomUUID } from 'node:crypto'
import type { Repos } from '../repos/index.ts'
import type { Producto, Usuario } from '../types.ts'
import { LIMITS, RESERVED_USERNAMES, isHttpUrl, validateUsername } from '../validation.ts'

/** Un objeto de `python manage.py dumpdata`. */
export interface DjangoDumpEntry {
  model: string
  pk: number | string
  fields: Record<string, unknown>
}

export interface ImportReport {
  usersToImport: number
  usersAlreadyThere: number
  productosToImport: number
  productosAlreadyThere: number
  warnings: string[]
}

const asString = (value: unknown): string => (typeof value === 'string' ? value : '')

function toIso(value: unknown): string {
  const date = typeof value === 'string' ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString()
}

/** `links`/`images` salen de dumpdata como lista, como JSON en texto o como null. */
function toList(value: unknown): string[] {
  let items: unknown = value
  if (typeof value === 'string') {
    try {
      items = JSON.parse(value)
    } catch {
      items = value.split(',')
    }
  }
  if (!Array.isArray(items)) return []
  return items.filter((i): i is string => typeof i === 'string').map((i) => i.trim()).filter(Boolean)
}

/**
 * Convierte el volcado de Django (modelos `auth.user` y `cartas.producto`) y lo
 * escribe en la base de datos configurada. Es idempotente: lo que ya existe
 * (mismo usuario / mismo id de producto) se salta, así que puede repetirse.
 *
 * Con `dryRun` calcula y devuelve el informe sin escribir nada.
 */
export async function importDjangoDump(
  entries: DjangoDumpEntry[],
  repos: Repos,
  options: { dryRun?: boolean } = {}
): Promise<ImportReport> {
  const warnings: string[] = []
  const existingUsers = await repos.usuarios.all()
  const existingProductIds = new Set((await repos.productos.all()).map((p) => p.id))

  const byUsername = new Map(existingUsers.map((u) => [u.username.toLowerCase(), u]))
  const usedIds = new Set(existingUsers.map((u) => u.id))
  const pkToUserId = new Map<string, string>() // pk de Django → id en la hoja

  const newUsers: Usuario[] = []
  let usersAlreadyThere = 0

  for (const entry of entries.filter((e) => e.model === 'auth.user')) {
    const username = asString(entry.fields.username).trim().toLowerCase()
    if (username === '') {
      warnings.push(`Usuario pk=${entry.pk}: sin nombre, se omite.`)
      continue
    }
    const found = byUsername.get(username)
    if (found) {
      pkToUserId.set(String(entry.pk), found.id)
      usersAlreadyThere++
      continue
    }
    if (RESERVED_USERNAMES.has(username)) {
      warnings.push(
        `Usuario "${username}": coincide con una ruta de la aplicación, su carta no será accesible en /${username}. Renómbralo en la hoja.`
      )
    } else if (!validateUsername(username).ok) {
      warnings.push(
        `Usuario "${username}": no cumple las reglas de nombres actuales (se importa igualmente; no podrá registrarse de nuevo con ese nombre).`
      )
    }
    let id = String(entry.pk)
    if (usedIds.has(id)) id = randomUUID() // el id numérico ya lo usa otro usuario
    usedIds.add(id)
    const usuario: Usuario = {
      id,
      username,
      passwordHash: asString(entry.fields.password),
      email: '',
      resetHash: '',
      resetExpires: '',
      createdAt: toIso(entry.fields.date_joined)
    }
    newUsers.push(usuario)
    byUsername.set(username, usuario)
    pkToUserId.set(String(entry.pk), id)
  }

  const newProductos: Producto[] = []
  let productosAlreadyThere = 0

  for (const entry of entries.filter((e) => e.model === 'cartas.producto')) {
    const id = String(entry.pk)
    if (existingProductIds.has(id)) {
      productosAlreadyThere++
      continue
    }
    const userId = pkToUserId.get(String(entry.fields.user_id))
    if (!userId) {
      warnings.push(`Producto pk=${id}: su usuario (pk=${String(entry.fields.user_id)}) no está en el volcado, se omite.`)
      continue
    }
    let pilladoUserId: string | null = null
    if (entry.fields.pillado_user != null) {
      pilladoUserId = pkToUserId.get(String(entry.fields.pillado_user)) ?? null
      if (!pilladoUserId) {
        warnings.push(`Producto pk=${id}: quien lo pilló (pk=${String(entry.fields.pillado_user)}) no está en el volcado; queda libre.`)
      }
    }
    const clean = (list: string[], label: string) => {
      const valid = list.filter(isHttpUrl).slice(0, LIMITS.urlsPerList)
      if (valid.length !== list.length) {
        warnings.push(`Producto pk=${id}: ${list.length - valid.length} ${label} descartados (no son http(s) o exceden el máximo).`)
      }
      return valid
    }
    let description = asString(entry.fields.description)
    if (description.length > LIMITS.descriptionMax) {
      warnings.push(`Producto pk=${id}: descripción truncada a ${LIMITS.descriptionMax} caracteres.`)
      description = description.slice(0, LIMITS.descriptionMax)
    }
    newProductos.push({
      id,
      userId,
      name: asString(entry.fields.name).slice(0, LIMITS.nameMax),
      description,
      links: clean(toList(entry.fields.links), 'enlaces'),
      images: clean(toList(entry.fields.images), 'imágenes'),
      createdAt: toIso(entry.fields.created),
      pilladoUserId,
      price: null,
      priority: null
    })
  }

  if (!options.dryRun) {
    await repos.usuarios.createMany(newUsers)
    await repos.productos.createMany(newProductos)
  }

  return {
    usersToImport: newUsers.length,
    usersAlreadyThere,
    productosToImport: newProductos.length,
    productosAlreadyThere,
    warnings
  }
}
