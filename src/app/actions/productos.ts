'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth/current-user'
import { isUploadConfigured } from '@/lib/config'
import { getRepos } from '@/lib/repos'
import { checkImage } from '@/lib/uploads/images'
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
    images: formData.get('images'),
    price: formData.get('price'),
    priority: formData.get('priority')
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

export interface UploadResult {
  ok: boolean
  url?: string
  error?: string
}

/** Sube una imagen (ya reducida por el navegador) y devuelve su URL pública. */
export async function uploadImageAction(formData: FormData): Promise<UploadResult> {
  const user = await requireUser()
  if (!isUploadConfigured()) {
    return { ok: false, error: 'La subida de imágenes no está activada. Pega la dirección de una imagen.' }
  }
  const file = formData.get('file')
  if (!(file instanceof File)) return { ok: false, error: 'No se recibió ninguna imagen' }
  const bytes = new Uint8Array(await file.arrayBuffer())
  const checked = checkImage(bytes)
  if (!checked.ok) return { ok: false, error: checked.error }
  try {
    const { uploadToBlob } = await import('@/lib/uploads/blob')
    return { ok: true, url: await uploadToBlob(user.id, bytes, checked.kind) }
  } catch (error) {
    console.error('Fallo al subir la imagen:', error)
    return { ok: false, error: 'No se pudo subir la imagen. Inténtalo de nuevo.' }
  }
}
