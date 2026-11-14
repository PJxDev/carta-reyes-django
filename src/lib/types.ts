/** Tipos del dominio. Es un módulo de solo tipos: puede importarse desde el cliente. */

export interface Usuario {
  id: string
  /** Siempre en minúsculas. */
  username: string
  passwordHash: string
  /** Email opcional para recuperar la contraseña. Vacío = sin email. Siempre en minúsculas. */
  email: string
  /** Hash (sha256) del token de recuperación vigente. Vacío = no hay petición. */
  resetHash: string
  /** ISO 8601 (UTC) en que caduca el token de recuperación. */
  resetExpires: string
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
  /** Precio aproximado en euros, o null si no se indica. */
  price: number | null
  /** Cuánta ilusión hace, o null si no se indica. */
  priority: Prioridad | null
}

export const PRIORIDADES = ['alta', 'media', 'baja'] as const
export type Prioridad = (typeof PRIORIDADES)[number]

/** Una carta que `userId` sigue. */
export interface Seguimiento {
  userId: string
  followedId: string
  /** ISO 8601 (UTC). */
  createdAt: string
}

/** Datos editables de un producto (lo que envía el formulario). */
export interface ProductoInput {
  name: string
  description: string
  links: string[]
  images: string[]
  price: number | null
  priority: Prioridad | null
}
