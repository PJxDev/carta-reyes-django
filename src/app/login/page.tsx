import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/AuthForms'
import { getCurrentUser } from '@/lib/auth/current-user'

export const metadata: Metadata = { title: 'Iniciar sesión · Carta de Reyes' }

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/')
  return <LoginForm />
}
