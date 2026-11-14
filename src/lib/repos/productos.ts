import { randomUUID } from 'node:crypto'
import type { Table } from '../store/table.ts'
import type { Producto, ProductoInput } from '../types.ts'
import { productoToRow, rowToProducto, serializeList } from './mappers.ts'

export type UpdateResult = 'ok' | 'not_found' | 'forbidden'
export type PillarResult = 'ok' | 'not_found' | 'own_product' | 'taken'
export type DespillarResult = 'ok' | 'not_found' | 'not_yours'

export interface ProductosRepo {
  all(): Promise<Producto[]>
  findById(id: string): Promise<Producto | null>
  /** Productos de la carta de un usuario, en orden de creación. */
  listByUser(userId: string): Promise<Producto[]>
  /** Productos que ha pillado un usuario. */
  listPilladosBy(userId: string): Promise<Producto[]>
  create(userId: string, input: ProductoInput): Promise<Producto>
  /** Solo el autor puede modificar. */
  update(id: string, userId: string, input: ProductoInput): Promise<UpdateResult>
  /** Solo el autor puede borrar. */
  remove(id: string, userId: string): Promise<UpdateResult>
  /** Pilla un regalo ajeno que esté libre. Es idempotente si ya lo pillaste tú. */
  pillar(id: string, userId: string): Promise<PillarResult>
  /** Libera un regalo que pillaste tú. */
  despillar(id: string, userId: string): Promise<DespillarResult>
  /** Inserción masiva sin validar; la usa el importador. */
  createMany(productos: Producto[]): Promise<void>
}

export function createProductosRepo(table: Table): ProductosRepo {
  const all = async () => (await table.all()).map(rowToProducto)

  return {
    all,

    async findById(id) {
      return (await all()).find((p) => p.id === id) ?? null
    },

    async listByUser(userId) {
      return (await all()).filter((p) => p.userId === userId)
    },

    async listPilladosBy(userId) {
      return (await all()).filter((p) => p.pilladoUserId === userId)
    },

    async create(userId, input) {
      const producto: Producto = {
        id: randomUUID(),
        userId,
        ...input,
        createdAt: new Date().toISOString(),
        pilladoUserId: null
      }
      await table.insert([productoToRow(producto)])
      return producto
    },

    async update(id, userId, input) {
      const outcome = await table.update(id, (current) =>
        current.user_id === userId
          ? {
              name: input.name,
              description: input.description,
              links: serializeList(input.links),
              images: serializeList(input.images)
            }
          : null
      )
      if (outcome.status === 'updated') return 'ok'
      return outcome.status === 'rejected' ? 'forbidden' : 'not_found'
    },

    async remove(id, userId) {
      const outcome = await table.remove(id, (current) => current.user_id === userId)
      if (outcome === 'removed') return 'ok'
      return outcome === 'rejected' ? 'forbidden' : 'not_found'
    },

    async pillar(id, userId) {
      const why: { blocked: 'own_product' | 'taken' | null } = { blocked: null }
      const outcome = await table.update(id, (current) => {
        if (current.user_id === userId) {
          why.blocked = 'own_product'
          return null
        }
        if (current.pillado_user_id && current.pillado_user_id !== userId) {
          why.blocked = 'taken'
          return null
        }
        return { pillado_user_id: userId }
      })
      if (outcome.status === 'updated') return 'ok'
      if (outcome.status === 'not_found') return 'not_found'
      return why.blocked ?? 'taken'
    },

    async despillar(id, userId) {
      const outcome = await table.update(id, (current) =>
        current.pillado_user_id && current.pillado_user_id !== userId
          ? null
          : { pillado_user_id: '' }
      )
      if (outcome.status === 'updated') return 'ok'
      return outcome.status === 'rejected' ? 'not_yours' : 'not_found'
    },

    async createMany(productos) {
      if (productos.length > 0) await table.insert(productos.map(productoToRow))
    }
  }
}
