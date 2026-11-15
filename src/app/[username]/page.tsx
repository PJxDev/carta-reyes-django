import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CartaIntro } from '@/components/CartaIntro'
import { FollowButton } from '@/components/FollowButton'
import { ShareCarta } from '@/components/ShareCarta'
import { RecordVisit } from '@/components/Visited'
import { ProductCard, ProductGrid } from '@/components/ProductCard'
import { getCurrentUser } from '@/lib/auth/current-user'
import { getRepos } from '@/lib/repos'
import { countGifts, loadCarta } from '@/lib/services/cartas'

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = decodeURIComponent((await params).username)
  const count = await countGifts(getRepos(), name)
  if (count === null) return { title: 'Carta de Reyes' }
  const title = `Carta de ${name} a los Reyes Magos`
  const description =
    count === 0
      ? `${name} está preparando su carta. Entra y síguela para no perderte los regalos.`
      : `${count === 1 ? '1 regalo' : `${count} regalos`} en la carta de ${name}. Entra y pilla el que quieras.`
  return {
    title: `Carta de ${name} · Carta de Reyes`,
    description,
    openGraph: { title, description, type: 'website', locale: 'es_ES', siteName: 'Carta de Reyes' },
    twitter: { card: 'summary_large_image', title, description }
  }
}

export default async function CartaPage({ params }: Props) {
  const { username } = await params
  const viewer = await getCurrentUser()
  const carta = await loadCarta(getRepos(), decodeURIComponent(username), viewer)
  if (!carta.found) notFound()
  const own = carta.isOwner

  return (
    <>
      <CartaIntro />
      {!own && <RecordVisit username={carta.owner.username} />}
      <section className="flex min-w-full flex-1 flex-col items-center justify-center gap-5 bg-seccion-azul p-4 text-texto sm:p-7">
        <h2 className="max-w-full text-center font-header text-3xl [overflow-wrap:anywhere]">Carta de {carta.owner.username}:</h2>
        <div className="flex flex-col items-center gap-3">
          {viewer && !own && <FollowButton username={carta.owner.username} following={carta.isFollowing} />}
          <ShareCarta
            path={`/${carta.owner.username}`}
            text={own ? 'Mira mi carta a los Reyes Magos:' : `La carta de ${carta.owner.username} a los Reyes Magos:`}
          />
        </div>
        {!viewer && (
          <p className="text-center text-lg">
            <Link href="/login" className="inline-block py-2.5 font-semibold underline">
              Inicia sesión
            </Link>{' '}
            para pillar regalos de esta carta.
          </p>
        )}
        {carta.productos.length === 0 && <p className="text-center text-lg">Esta carta todavía está vacía.</p>}
        <ProductGrid>
          {carta.productos.map((producto) => (
            <ProductCard key={producto.id} product={producto} />
          ))}
        </ProductGrid>
      </section>
    </>
  )
}
