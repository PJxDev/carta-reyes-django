'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth/current-user'
import { getRepos } from '@/lib/repos'

export interface FollowResult {
  ok: boolean
  error?: string
}

/** Sigue (`follow` = true) o deja de seguir la carta de `username`. */
export async function followAction(username: string, follow: boolean): Promise<FollowResult> {
  const user = await requireUser()
  const repos = getRepos()
  const owner = await repos.usuarios.findByUsername(String(username))
  if (!owner) return { ok: false, error: 'Esa carta no existe' }
  if (follow) {
    if ((await repos.seguidos.follow(user.id, owner.id)) === 'self') {
      return { ok: false, error: 'No hace falta seguir tu propia carta' }
    }
  } else {
    await repos.seguidos.unfollow(user.id, owner.id)
  }
  revalidatePath('/siguiendo')
  return { ok: true }
}
