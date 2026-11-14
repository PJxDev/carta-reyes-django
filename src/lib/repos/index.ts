import { getStore } from '../store/index.ts'
import type { Store } from '../store/index.ts'
import { createProductosRepo } from './productos.ts'
import type { ProductosRepo } from './productos.ts'
import { createSeguidosRepo } from './seguidos.ts'
import type { SeguidosRepo } from './seguidos.ts'
import { createUsuariosRepo } from './usuarios.ts'
import type { UsuariosRepo } from './usuarios.ts'

export interface Repos {
  usuarios: UsuariosRepo
  productos: ProductosRepo
  seguidos: SeguidosRepo
}

export function createRepos(store: Store): Repos {
  return {
    usuarios: createUsuariosRepo(store.usuarios),
    productos: createProductosRepo(store.productos),
    seguidos: createSeguidosRepo(store.seguidos)
  }
}

const GLOBAL_KEY = Symbol.for('carta-reyes.repos')
type GlobalWithRepos = typeof globalThis & { [GLOBAL_KEY]?: Repos }

/** Repositorios de la aplicación (singleton por proceso). */
export function getRepos(): Repos {
  const holder = globalThis as GlobalWithRepos
  holder[GLOBAL_KEY] ??= createRepos(getStore())
  return holder[GLOBAL_KEY]
}
