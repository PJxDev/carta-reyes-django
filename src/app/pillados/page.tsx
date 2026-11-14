import type { Metadata } from 'next'
import { ProductCard, ProductGrid } from '@/components/ProductCard'
import { requireUser } from '@/lib/auth/current-user'
import { getRepos } from '@/lib/repos'
import { loadPillados } from '@/lib/services/cartas'

export const metadata: Metadata = { title: 'Pillados · Carta de Reyes' }

export default async function PilladosPage() {
  const user = await requireUser()
  const productos = await loadPillados(getRepos(), user)

  return (
    <section className="flex min-w-full flex-1 flex-col items-center justify-center gap-5 bg-pink-100/90 p-4 text-tinta sm:p-7">
      <h2 className="text-center font-header text-3xl">Regalos que has pillado</h2>
      {productos.length === 0 && (
        <p className="text-center text-lg">Todavía no has pillado ningún regalo. Entra en la carta de alguien y pulsa «Pillar».</p>
      )}
      <ProductGrid>
        {productos.map((producto) => (
          <ProductCard key={producto.id} product={producto} showOwner />
        ))}
      </ProductGrid>
    </section>
  )
}
