'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth/current-user'
import { getRepos } from '@/lib/repos'
import { validateProductoInput } from '@/lib/validation'

export interface SaveState {
  error?: string
  /** Cambia en cada guardado correcto para que el cliente pueda reaccionar. */
  savedAt?: number
}

export interface ActionResult {
  ok: boolean
  error?: string
}

const refresh = () => revalidatePath('/', 'layout')

/** Crea (sin `id`) o modifica (con `id`) un producto de la carta del usuario. */
export async function saveProductoAction(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const user = await requireUser()
  const parsed = validateProductoInput({
    name: formData.get('name'),
    description: formData.get('description'),
    links: formData.get('links'),
    images: formData.get('images')
  })
  if (!parsed.ok) return { error: parsed.error }

  const repos = getRepos()
  const id = String(formData.get('id') ?? '')
  if (id === '') {
    await repos.productos.create(user.id, parsed.value)
  } else {
    const result = await repos.productos.update(id, user.id, parsed.value)
    if (result !== 'ok') return { error: 'No se puede modificar este producto' }
  }
  refresh()
  return { savedAt: Date.now() }
}

export async function deleteProductoAction(id: string): Promise<ActionResult> {
  const user = await requireUser()
  const result = await getRepos().productos.remove(String(id), user.id)
  if (result !== 'ok') return { ok: false, error: 'No se puede borrar este producto' }
  refresh()
  return { ok: true }
}

export async function pillarProductoAction(id: string): Promise<ActionResult> {
  const user = await requireUser()
  const result = await getRepos().productos.pillar(String(id), user.id)
  refresh()
  if (result === 'ok') return { ok: true }
  const messages = {
    not_found: 'Ese regalo ya no existe',
    own_product: 'No puedes pillar tus propios regalos',
    taken: 'Alguien se te ha adelantado: ya está pillado'
  } as const
  return { ok: false, error: messages[result] }
}

export async function despillarProductoAction(id: string): Promise<ActionResult> {
  const user = await requireUser()
  const result = await getRepos().productos.despillar(String(id), user.id)
  refresh()
  if (result === 'ok') return { ok: true }
  return {
    ok: false,
    error: result === 'not_found' ? 'Ese regalo ya no existe' : 'Solo quien lo pilló puede liberarlo'
  }
}
