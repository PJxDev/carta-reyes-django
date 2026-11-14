import type { Table } from '../store/table.ts'
import type { Seguimiento } from '../types.ts'
import { rowToSeguimiento } from './mappers.ts'

export interface SeguidosRepo {
  /** Cartas que sigue `userId`, de la más reciente a la más antigua. */
  listFollowed(userId: string): Promise<Seguimiento[]>
  isFollowing(userId: string, followedId: string): Promise<boolean>
  /** Idempotente. No permite seguirse a uno mismo. */
  follow(userId: string, followedId: string): Promise<'ok' | 'self'>
  /** Idempotente. */
  unfollow(userId: string, followedId: string): Promise<void>
}

const keyOf = (userId: string, followedId: string) => `${userId}:${followedId}`

export function createSeguidosRepo(table: Table): SeguidosRepo {
  return {
    async listFollowed(userId) {
      return (await table.all())
        .filter((r) => r.user_id === userId)
        .map(rowToSeguimiento)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },

    async isFollowing(userId, followedId) {
      const id = keyOf(userId, followedId)
      return (await table.all()).some((r) => r.id === id)
    },

    async follow(userId, followedId) {
      if (userId === followedId) return 'self'
      const id = keyOf(userId, followedId)
      await table.insert(
        [{ id, user_id: userId, followed_id: followedId, created_at: new Date().toISOString() }],
        { unless: (existing) => existing.some((r) => r.id === id) }
      )
      return 'ok'
    },

    async unfollow(userId, followedId) {
      await table.remove(keyOf(userId, followedId))
    }
  }
}
