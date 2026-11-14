import { randomUUID } from 'node:crypto'
import type { Table } from '../store/table.ts'
import type { Usuario } from '../types.ts'
import { normalizeUsername } from '../validation.ts'
import { rowToUsuario, usuarioToRow } from './mappers.ts'

export type CreateUsuarioResult =
  | { status: 'created'; usuario: Usuario }
  | { status: 'username_taken' }

export interface UsuariosRepo {
  findById(id: string): Promise<Usuario | null>
  /** Búsqueda sin distinguir mayúsculas. */
  findByUsername(username: string): Promise<Usuario | null>
  /** Crea un usuario garantizando que el nombre es único (sin distinguir mayúsculas). */
  create(input: { username: string; passwordHash: string }): Promise<CreateUsuarioResult>
  setPasswordHash(id: string, passwordHash: string): Promise<void>
  /** Inserción masiva sin comprobar duplicados; la usa el importador. */
  createMany(usuarios: Usuario[]): Promise<void>
  all(): Promise<Usuario[]>
}

export function createUsuariosRepo(table: Table): UsuariosRepo {
  return {
    async all() {
      return (await table.all()).map(rowToUsuario)
    },

    async findById(id) {
      const row = (await table.all()).find((r) => r.id === id)
      return row ? rowToUsuario(row) : null
    },

    async findByUsername(username) {
      const wanted = normalizeUsername(username)
      const row = (await table.all()).find((r) => r.username.toLowerCase() === wanted)
      return row ? rowToUsuario(row) : null
    },

    async create({ username, passwordHash }) {
      const usuario: Usuario = {
        id: randomUUID(),
        username: normalizeUsername(username),
        passwordHash,
        createdAt: new Date().toISOString()
      }
      const outcome = await table.insert([usuarioToRow(usuario)], {
        unless: (existing) =>
          existing.some((r) => r.username.toLowerCase() === usuario.username)
      })
      return outcome === 'inserted'
        ? { status: 'created', usuario }
        : { status: 'username_taken' }
    },

    async setPasswordHash(id, passwordHash) {
      await table.update(id, () => ({ password_hash: passwordHash }))
    },

    async createMany(usuarios) {
      if (usuarios.length > 0) await table.insert(usuarios.map(usuarioToRow))
    }
  }
}
