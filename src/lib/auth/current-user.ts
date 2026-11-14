import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSessionSecret } from '../config.ts'
import { getRepos } from '../repos/index.ts'
import type { Usuario } from '../types.ts'
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  verifySessionToken
} from './session.ts'

// Solo para código de servidor: lee cookies y credenciales.

/** Usuario de la sesión actual, o null. Se calcula una vez por petición. */
export const getCurrentUser = cache(async (): Promise<Usuario | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null // anónimo: no hace falta ni leer el secreto
  const session = verifySessionToken(token, getSessionSecret())
  if (!session) return null
  // Se vuelve a consultar el usuario: si se borró de la hoja, la sesión deja de valer.
  return getRepos().usuarios.findById(session.uid)
})

/** Para páginas y acciones privadas: sin sesión, redirige al login. */
export async function requireUser(): Promise<Usuario> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function startSession(userId: string): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, createSessionToken(userId, getSessionSecret()), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS
  })
}

export async function endSession(): Promise<void> {
  ;(await cookies()).delete(SESSION_COOKIE)
}
