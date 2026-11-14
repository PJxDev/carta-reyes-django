import type { Row } from '../store/table.ts'
import { PRIORIDADES } from '../types.ts'
import type { Prioridad, Producto, Seguimiento, Usuario } from '../types.ts'
import { isHttpUrl } from '../validation.ts'

/**
 * Lee una lista de URLs guardada en una celda. Es tolerante a propósito: la
 * aplicación escribe un array JSON, pero alguien que edite la hoja a mano puede
 * poner las URLs separadas por comas o saltos de línea. Se descarta todo lo que
 * no sea http(s) para que una celda manipulada no acabe en un href/src.
 */
export function parseStoredList(cell: string | undefined): string[] {
  const text = (cell ?? '').trim()
  if (text === '') return []
  let items: unknown[]
  if (text.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(text)
      items = Array.isArray(parsed) ? parsed : []
    } catch {
      items = []
    }
  } else {
    items = text.split(/[\s,]+/)
  }
  return items
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item !== '' && isHttpUrl(item))
}

export const serializeList = (list: readonly string[]): string =>
  list.length === 0 ? '' : JSON.stringify(list)

/** Precio guardado en una celda; tolera la coma decimal de quien edite la hoja a mano. */
export function parseStoredPrice(cell: string | undefined): number | null {
  const text = (cell ?? '').trim().replace(',', '.')
  if (text === '') return null
  const value = Number(text)
  return Number.isFinite(value) && value >= 0 ? value : null
}

export const serializePrice = (price: number | null): string => (price === null ? '' : String(price))

export function parseStoredPriority(cell: string | undefined): Prioridad | null {
  const text = (cell ?? '').trim().toLowerCase()
  return (PRIORIDADES as readonly string[]).includes(text) ? (text as Prioridad) : null
}

export function rowToSeguimiento(row: Row): Seguimiento {
  return { userId: row.user_id, followedId: row.followed_id, createdAt: row.created_at }
}

export function rowToUsuario(row: Row): Usuario {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    email: (row.email ?? '').trim().toLowerCase(),
    resetHash: row.reset_hash ?? '',
    resetExpires: row.reset_expires ?? '',
    createdAt: row.created_at
  }
}

export function usuarioToRow(usuario: Usuario): Row {
  return {
    id: usuario.id,
    username: usuario.username,
    password_hash: usuario.passwordHash,
    created_at: usuario.createdAt,
    email: usuario.email,
    reset_hash: usuario.resetHash,
    reset_expires: usuario.resetExpires
  }
}

export function rowToProducto(row: Row): Producto {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? '',
    links: parseStoredList(row.links),
    images: parseStoredList(row.images),
    createdAt: row.created_at,
    pilladoUserId: row.pillado_user_id ? row.pillado_user_id : null,
    price: parseStoredPrice(row.price),
    priority: parseStoredPriority(row.priority)
  }
}

export function productoToRow(producto: Producto): Row {
  return {
    id: producto.id,
    user_id: producto.userId,
    name: producto.name,
    description: producto.description,
    links: serializeList(producto.links),
    images: serializeList(producto.images),
    created_at: producto.createdAt,
    pillado_user_id: producto.pilladoUserId ?? '',
    price: serializePrice(producto.price),
    priority: producto.priority ?? ''
  }
}
