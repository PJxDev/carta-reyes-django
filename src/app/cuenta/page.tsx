import type { Metadata } from 'next'
import { EmailForm } from '@/components/AuthForms'
import { requireUser } from '@/lib/auth/current-user'

export const metadata: Metadata = { title: 'Mi cuenta · Carta de Reyes' }

export default async function CuentaPage() {
  const user = await requireUser()
  return <EmailForm current={user.email} />
}
