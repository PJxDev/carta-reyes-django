import type { ReactNode } from 'react'
import type { ProductoView } from '@/lib/services/cartas'
import { ImageCarousel } from './ImageCarousel'
import { LinksButton } from './LinksButton'
import { PillButton } from './PillButton'
import { SafeImage } from './SafeImage'

interface ProductCardProps {
  product: ProductoView
  /** Contenido superpuesto en la esquina (botón de editar). */
  corner?: ReactNode
  /** Mostrar "(usuario)" bajo el nombre; solo con `product.ownerUsername`. */
  showOwner?: boolean
  /** Contenido extra al final de la tarjeta (diálogos). */
  children?: ReactNode
}

export function ProductCard({ product, corner, showOwner = false, children }: ProductCardProps) {
  const { images } = product
  return (
    <article className="relative flex h-full w-full max-w-xs flex-col justify-between gap-4 rounded-xl border-2 border-slate-300 bg-gray-200 p-6">
      {corner}
      <PillButton id={product.id} status={product.status} />

      <h3 className="break-words text-center text-2xl font-bold [overflow-wrap:anywhere]">{product.name}</h3>
      {showOwner && product.ownerUsername && (
        <span className="text-center text-lg">({product.ownerUsername})</span>
      )}

      <div className="flex min-h-[24rem] flex-col justify-between gap-4 text-left">
        {images.length > 1 ? (
          <ImageCarousel images={images} name={product.name} />
        ) : images.length === 1 ? (
          <SafeImage src={images[0]} alt={product.name} className="h-60 w-full rounded-lg object-cover object-center" />
        ) : (
          <div
            role="img"
            aria-label="Sin imagen"
            className="flex h-60 w-full items-center justify-center rounded-lg bg-slate-300 text-5xl"
          >
            🎁
          </div>
        )}

        {product.description && (
          <p className="whitespace-pre-line text-lg font-semibold [overflow-wrap:anywhere]">{product.description}</p>
        )}

        <LinksButton links={product.links} name={product.name} />
      </div>
      {children}
    </article>
  )
}

/** Rejilla de tarjetas: 1 columna en móvil, 2 desde sm, 3 desde md. */
export function ProductGrid({ children }: { children: ReactNode }) {
  return (
    <section className="grid w-full max-w-5xl grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 md:grid-cols-3">
      {children}
    </section>
  )
}
