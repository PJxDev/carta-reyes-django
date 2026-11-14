import type { Metadata } from 'next'
import Link from 'next/link'
import { VisitedList } from '@/components/Visited'
import { requireUser } from '@/lib/auth/current-user'
import { getRepos } from '@/lib/repos'
import { loadFollowing } from '@/lib/services/cartas'

export const metadata: Metadata = { title: 'Siguiendo · Carta de Reyes' }

export default async function SiguiendoPage() {
  const user = await requireUser()
  const cartas = await loadFollowing(getRepos(), user)

  return (
    <section className="flex w-full flex-1 flex-col items-center gap-8 px-4 py-6 text-texto">
      <div className="flex w-full max-w-2xl flex-col items-center gap-4">
        <h2 className="font-header text-3xl">Cartas que sigues</h2>
        {cartas.length === 0 ? (
          <p className="text-center text-lg">
            Todavía no sigues ninguna. Abre la carta de alguien y pulsa «Seguir esta carta» para tenerla aquí a mano.
          </p>
        ) : (
          <ul className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            {cartas.map((carta) => (
              <li key={carta.username}>
                <Link
                  href={`/${carta.username}`}
                  className="flex min-h-16 flex-col justify-center rounded-2xl bg-etiqueta px-5 py-3 shadow transition-transform hover:scale-[1.02]"
                >
                  <span className="font-hand text-2xl [overflow-wrap:anywhere]">{carta.username}</span>
                  <span className="text-base text-tinta/80">
                    {carta.giftCount === 1 ? '1 regalo' : `${carta.giftCount} regalos`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <VisitedList />
    </section>
  )
}
