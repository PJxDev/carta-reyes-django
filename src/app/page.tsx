import Link from 'next/link'
import { CopyLink } from '@/components/CopyLink'
import { getCurrentUser } from '@/lib/auth/current-user'

export default async function HomePage() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <h3 className="w-full px-4 text-center text-2xl font-semibold text-slate-950">
        ¡ Regístrate o inicia sesión para editar tu carta y compartirla !
      </h3>
    )
  }

  const button = 'min-h-12 rounded-full px-6 py-3 text-xl font-semibold transition-transform hover:scale-105'
  return (
    <section className="flex flex-col items-center gap-5 px-4 text-center">
      <h2 className="text-3xl font-semibold">¡Hola, {user.username}!</h2>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/editor" className={`${button} bg-emerald-200`}>
          Editar mi carta
        </Link>
        <Link href={`/${user.username}`} className={`${button} bg-amber-200`}>
          Ver mi carta
        </Link>
        <Link href="/pillados" className={`${button} bg-pink-200`}>
          Regalos que he pillado
        </Link>
      </div>
      <CopyLink path={`/${user.username}`} />
    </section>
  )
}
