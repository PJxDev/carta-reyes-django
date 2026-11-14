import Link from 'next/link'
import { ShareCarta } from '@/components/ShareCarta'
import { VisitedList } from '@/components/Visited'
import { getCurrentUser } from '@/lib/auth/current-user'

export default async function HomePage() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-8">
        <h3 className="w-full max-w-2xl px-4 text-center text-2xl font-semibold">
          ¡ Regístrate o inicia sesión para editar tu carta y compartirla !
        </h3>
        <VisitedList />
      </div>
    )
  }

  const button = 'min-h-12 rounded-full px-6 py-3 text-xl font-semibold text-tinta transition-transform hover:scale-105'
  return (
    <section className="flex flex-col items-center gap-5 px-4 text-center">
      <h2 className="max-w-full font-header text-4xl [overflow-wrap:anywhere]">¡Hola, {user.username}!</h2>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/editor" className={`${button} bg-emerald-200`}>
          Editar mi carta
        </Link>
        <Link href={`/${user.username}`} className={`${button} bg-amber-200`}>
          Ver mi carta
        </Link>
        <Link href="/siguiendo" className={`${button} bg-sky-200`}>
          Cartas que sigo
        </Link>
        <Link href="/pillados" className={`${button} bg-pink-200`}>
          Regalos que he pillado
        </Link>
      </div>
      <ShareCarta path={`/${user.username}`} text="Mira mi carta a los Reyes Magos:" />
      <VisitedList />
    </section>
  )
}
