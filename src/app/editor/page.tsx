import type { Metadata } from 'next'
import { AddProduct } from '@/components/AddProduct'
import { CartaIntro } from '@/components/CartaIntro'
import { EditableCard } from '@/components/EditableCard'
import { ProductGrid } from '@/components/ProductCard'
import { requireUser } from '@/lib/auth/current-user'
import { getRepos } from '@/lib/repos'
import { loadEditor } from '@/lib/services/cartas'

export const metadata: Metadata = { title: 'Mi carta · Carta de Reyes' }

export default async function EditorPage() {
  const user = await requireUser()
  const productos = await loadEditor(getRepos(), user)

  return (
    <>
      <CartaIntro />
      <section className="flex min-w-full flex-1 flex-col items-center justify-center gap-5 bg-emerald-100/80 p-4 text-tinta sm:p-7">
        <h2 className="max-w-full text-center font-header text-3xl [overflow-wrap:anywhere]">Carta de {user.username}:</h2>
        {productos.length === 0 && (
          <p className="text-center text-lg">Tu carta está vacía. Añade tu primer regalo con la etiqueta de abajo.</p>
        )}
        <ProductGrid>
          {productos.map((producto) => (
            <EditableCard key={producto.id} product={producto} />
          ))}
          <AddProduct />
        </ProductGrid>
      </section>
    </>
  )
}
