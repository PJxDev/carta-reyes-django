import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ForgotPasswordForm } from '@/components/AuthForms'
import { getCurrentUser } from '@/lib/auth/current-user'

export const metadata: Metadata = { title: 'Recuperar contraseña · Carta de Reyes' }

export default async function RecuperarPage() {
  if (await getCurrentUser()) redirect('/cuenta')
  return <ForgotPasswordForm />
}
