import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CartaIntro } from '@/components/CartaIntro'
import { ProductCard, ProductGrid } from '@/components/ProductCard'
import { getCurrentUser } from '@/lib/auth/current-user'
import { getRepos } from '@/lib/repos'
import { loadCarta } from '@/lib/services/cartas'

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return { title: `Carta de ${decodeURIComponent(username)} · Carta de Reyes` }
}

export default async function CartaPage({ params }: Props) {
  const { username } = await params
  const viewer = await getCurrentUser()
  const carta = await loadCarta(getRepos(), decodeURIComponent(username), viewer)
  if (!carta.found) notFound()

  return (
    <>
      <CartaIntro />
      <section className="flex min-w-full flex-1 flex-col items-center justify-center gap-5 bg-blue-100/90 p-4 text-tinta sm:p-7">
        <h2 className="max-w-full text-center font-header text-3xl [overflow-wrap:anywhere]">Carta de {carta.owner.username}:</h2>
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
