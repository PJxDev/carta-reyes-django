/** Tipos del dominio. Es un módulo de solo tipos: puede importarse desde el cliente. */

export interface Usuario {
  id: string
  /** Siempre en minúsculas. */
  username: string
  passwordHash: string
  /** ISO 8601 (UTC). */
  createdAt: string
}

export interface Producto {
  id: string
  userId: string
  name: string
  description: string
  links: string[]
  images: string[]
  /** ISO 8601 (UTC). */
  createdAt: string
  /** Usuario que lo ha "pillado", o null si está libre. */
  pilladoUserId: string | null
}

/** Datos editables de un producto (lo que envía el formulario). */
export interface ProductoInput {
  name: string
  description: string
  links: string[]
  images: string[]
}
