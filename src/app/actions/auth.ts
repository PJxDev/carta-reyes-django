'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { endSession, requireUser, startSession } from '@/lib/auth/current-user'
import { getSiteUrl, loadMailConfig } from '@/lib/config'
import { createConsoleMailer, createResendMailer, createUnavailableMailer } from '@/lib/mail/mailer'
import type { Mailer } from '@/lib/mail/mailer'
import { getRepos } from '@/lib/repos'
import { authenticate, registerUser } from '@/lib/services/accounts'
import { requestPasswordReset, resetPasswordWithToken } from '@/lib/services/recovery'
import { validateEmail } from '@/lib/validation'

export interface FormState {
  error?: string
  /** Valor del usuario para no obligar a reescribirlo tras un error. */
  username?: string
  /** Confirmación (p. ej. «te hemos enviado un enlace»). */
  message?: string
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get('username') ?? '')
  const result = await registerUser(getRepos(), {
    username,
    password: formData.get('password1'),
    password2: formData.get('password2'),
    email: formData.get('email')
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

function getMailer(): Mailer {
  const config = loadMailConfig()
  if (config) return createResendMailer(config)
  return process.env.NODE_ENV === 'production' ? createUnavailableMailer() : createConsoleMailer()
}

/** En producción solo se usa la URL configurada; en desarrollo se deduce de la petición. */
async function resolveSiteUrl(): Promise<string | null> {
  const configured = getSiteUrl()
  if (configured) return configured
  if (process.env.NODE_ENV === 'production') return null
  const h = await headers()
  const host = h.get('host')
  return host ? `${h.get('x-forwarded-proto') ?? 'http'}://${host}` : null
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const siteUrl = await resolveSiteUrl()
  if (!siteUrl) {
    return { error: 'La web no tiene configurada su dirección (SITE_URL), así que no puede enviar enlaces.' }
  }
  const result = await requestPasswordReset(getRepos(), getMailer(), {
    email: formData.get('email'),
    siteUrl
  })
  if (!result.ok) return { error: result.error }
  return {
    message: 'Si hay una cuenta con ese email, te hemos enviado un enlace para elegir una contraseña nueva. Puede tardar un par de minutos.'
  }
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await resetPasswordWithToken(getRepos(), {
    token: formData.get('token'),
    password: formData.get('password1'),
    password2: formData.get('password2')
  })
  if (!result.ok) return { error: result.error }
  await startSession(result.userId)
  redirect('/')
}

/** Cambia (o borra, con vacío) el email de la cuenta. */
export async function saveEmailAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()
  const email = validateEmail(formData.get('email'))
  if (!email.ok) return { error: email.error }
  const outcome = await getRepos().usuarios.setEmail(user.id, email.value)
  if (outcome === 'email_taken') return { error: 'Ese email ya está en uso' }
  return {
    message: email.value === '' ? 'Email borrado. Sin email no podrás recuperar la contraseña.' : 'Email guardado.'
  }
}
