'use server'

import { redirect } from 'next/navigation'
import { endSession, startSession } from '@/lib/auth/current-user'
import { getRepos } from '@/lib/repos'
import { authenticate, registerUser } from '@/lib/services/accounts'

export interface FormState {
  error?: string
  /** Valor del usuario para no obligar a reescribirlo tras un error. */
  username?: string
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get('username') ?? '')
  const result = await registerUser(getRepos(), {
    username,
    password: formData.get('password1'),
    password2: formData.get('password2')
  })
  if (!result.ok) return { error: result.error, username }
  await startSession(result.usuario.id)
  redirect('/')
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get('username') ?? '')
  const result = await authenticate(getRepos(), {
    username,
    password: formData.get('password')
  })
  if (!result.ok) return { error: result.error, username }
  await startSession(result.usuario.id)
  redirect('/')
}

export async function logoutAction(): Promise<void> {
  await endSession()
  redirect('/')
}
