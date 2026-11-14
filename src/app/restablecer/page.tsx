import type { Metadata } from 'next'
import Link from 'next/link'
import { ResetPasswordForm } from '@/components/AuthForms'
import { getRepos } from '@/lib/repos'
import { INVALID_LINK, findUserByResetToken } from '@/lib/services/recovery'

export const metadata: Metadata = { title: 'Contraseña nueva · Carta de Reyes', robots: { index: false } }

export default async function RestablecerPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string | string[] }>
}) {
  const { token } = await searchParams
  const value = typeof token === 'string' ? token : ''
  const valid = value !== '' && (await findUserByResetToken(getRepos(), value)) !== null
  if (!valid) {
    return (
      <div className="flex w-[calc(100%-2rem)] max-w-sm flex-col items-center gap-4 rounded-2xl bg-etiqueta p-6 text-center">
        <h2 className="font-header text-3xl">Enlace no válido</h2>
        <p>{INVALID_LINK}</p>
        <Link href="/recuperar" className="inline-block py-2.5 font-semibold underline">
          Pedir otro enlace
        </Link>
      </div>
    )
  }
  return <ResetPasswordForm token={value} />
}
