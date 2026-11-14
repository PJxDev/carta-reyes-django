/**
 * Pestañas y columnas del libro de Google Sheets. Ver SCHEMA.md.
 * El orden de este array es el que usa `npm run sheet:setup` al crear las
 * cabeceras, pero la aplicación localiza las columnas por nombre.
 */

export interface TableSchema {
  readonly name: string
  readonly columns: readonly string[]
}

export const USUARIOS: TableSchema = {
  name: 'usuarios',
  columns: ['id', 'username', 'password_hash', 'created_at', 'email', 'reset_hash', 'reset_expires']
}

export const PRODUCTOS: TableSchema = {
  name: 'productos',
  columns: [
    'id',
    'user_id',
    'name',
    'description',
    'links',
    'images',
    'created_at',
    'pillado_user_id',
    'price',
    'priority'
  ]
}

/** Qué cartas sigue cada usuario. `id` es `<user_id>:<followed_id>` y evita duplicados. */
export const SEGUIDOS: TableSchema = {
  name: 'seguidos',
  columns: ['id', 'user_id', 'followed_id', 'created_at']
}

export const ALL_TABLES: readonly TableSchema[] = [USUARIOS, PRODUCTOS, SEGUIDOS]
