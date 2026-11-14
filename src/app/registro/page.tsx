import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { RegisterForm } from '@/components/AuthForms'
import { getCurrentUser } from '@/lib/auth/current-user'

export const metadata: Metadata = { title: 'Registrarse · Carta de Reyes' }

export default async function RegistroPage() {
  if (await getCurrentUser()) redirect('/')
  return <RegisterForm />
}
