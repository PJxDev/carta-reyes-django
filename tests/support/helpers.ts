import { createRepos } from '../../src/lib/repos/index.ts'
import { createMemoryBackend } from '../../src/lib/store/memory-backend.ts'
import { ALL_TABLES } from '../../src/lib/store/schema.ts'
import { createStore } from '../../src/lib/store/index.ts'

/** Repositorios sobre un backend en memoria recién creado. */
export function makeRepos() {
  const backend = createMemoryBackend({ tables: ALL_TABLES })
  return { backend, repos: createRepos(createStore(backend)) }
}

export const PRODUCT_INPUT = {
  name: 'Bicicleta',
  description: 'Roja, talla M',
  links: ['https://tienda.example/bici'],
  images: ['https://img.example/bici.jpg']
}
