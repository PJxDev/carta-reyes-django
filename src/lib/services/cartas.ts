import type { Repos } from '../repos/index.ts'
import type { Producto, Usuario } from '../types.ts'

/**
 * Estado de un regalo tal y como lo ve quien mira la carta:
 *  - none:  no se muestra nada (anónimo, o es el autor: no debe saber qué le han pillado)
 *  - free:  se puede pillar
 *  - taken: lo ha pillado otra persona
 *  - mine:  lo has pillado tú
 */
export type PillStatus = 'none' | 'free' | 'taken' | 'mine'

/** Lo único que viaja al navegador de cada producto. No incluye ids de terceros. */
export interface ProductoView {
  id: string
  name: string
  description: string
  links: string[]
  images: string[]
  /** Solo se rellena en "pillados" (de quién es el regalo). */
  ownerUsername?: string
  status: PillStatus
}

export function statusFor(producto: Producto, viewer: Usuario | null): PillStatus {
  if (!viewer || viewer.id === producto.userId) return 'none'
  if (!producto.pilladoUserId) return 'free'
  return producto.pilladoUserId === viewer.id ? 'mine' : 'taken'
}

const toView = (p: Producto, status: PillStatus, ownerUsername?: string): ProductoView => ({
  id: p.id,
  name: p.name,
  description: p.description,
  links: p.links,
  images: p.images,
  status,
  ...(ownerUsername ? { ownerUsername } : {})
})

export type CartaPage =
  | { found: false }
  | { found: true; owner: { username: string }; isOwner: boolean; productos: ProductoView[] }

/** Carta pública de `/<username>`. */
export async function loadCarta(
  repos: Repos,
  username: string,
  viewer: Usuario | null
): Promise<CartaPage> {
  const owner = await repos.usuarios.findByUsername(username)
  if (!owner) return { found: false }
  const productos = await repos.productos.listByUser(owner.id)
  return {
    found: true,
    owner: { username: owner.username },
    isOwner: viewer?.id === owner.id,
    productos: productos.map((p) => toView(p, statusFor(p, viewer)))
  }
}

/** Productos de la propia carta, para el editor. Sin información de pillados. */
export async function loadEditor(repos: Repos, viewer: Usuario): Promise<ProductoView[]> {
  return (await repos.productos.listByUser(viewer.id)).map((p) => toView(p, 'none'))
}

/** Regalos que ha pillado `viewer`, con el nombre del dueño de cada uno. */
export async function loadPillados(repos: Repos, viewer: Usuario): Promise<ProductoView[]> {
  const [productos, usuarios] = await Promise.all([
    repos.productos.listPilladosBy(viewer.id),
    repos.usuarios.all()
  ])
  const names = new Map(usuarios.map((u) => [u.id, u.username]))
  return productos.map((p) => toView(p, 'mine', names.get(p.userId) ?? '(usuario eliminado)'))
}
