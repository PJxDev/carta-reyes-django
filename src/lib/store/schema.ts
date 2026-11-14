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
  columns: ['id', 'username', 'password_hash', 'created_at']
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
    'pillado_user_id'
  ]
}

export const ALL_TABLES: readonly TableSchema[] = [USUARIOS, PRODUCTOS]
