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
  /** Contenido extra fuera de la etiqueta (diálogos). */
  children?: ReactNode
}

/** Sello rojo que se estampa sobre la imagen cuando otra persona ya ha pillado el regalo. */
function Sello() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="-rotate-12 rounded-md border-4 border-double border-sello bg-etiqueta/80 px-4 py-1 text-3xl font-black tracking-wide text-sello motion-safe:animate-[estampar_0.5s_cubic-bezier(0.2,0.8,0.3,1)_0.15s_backwards]">
        PILLADO
      </span>
    </div>
  )
}

const PRIORITY_LABEL = { alta: 'Mucha ilusión', media: 'Ilusión media', baja: 'Si se puede' } as const

export const formatPrice = (price: number): string =>
  `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(price)} €`

/** Precio aproximado y prioridad, siempre con texto (no solo color). */
function PriceAndPriority({ price, priority }: Pick<ProductoView, 'price' | 'priority'>) {
  if (price === null && priority === null) return null
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-base text-tinta">
      {price !== null && <span>Unos {formatPrice(price)}</span>}
      {priority !== null && (
        <span className="rounded-full border-2 border-tinta/60 px-2.5 py-0.5 text-sm font-semibold">
          {priority === 'alta' ? '★ ' : ''}
          {PRIORITY_LABEL[priority]}
        </span>
      )}
    </p>
  )
}

/**
 * Un regalo de la carta, dibujado como una etiqueta de regalo. La sombra va en
 * el contenedor (drop-shadow) porque la silueta se recorta con clip-path.
 */
export function ProductCard({ product, corner, showOwner = false, children }: ProductCardProps) {
  const { images } = product
  return (
    <article className="relative h-full w-full max-w-xs drop-shadow-[0_6px_8px_rgb(59_42_30/0.25)]">
      <div className="etiqueta-forma relative flex h-full flex-col justify-between gap-4 bg-etiqueta px-5 pb-5 pt-14">
        {/* refuerzo del agujero del cordel */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-6 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-oro"
        />
        {corner}

        <div className="flex flex-col gap-3">
          <PillButton id={product.id} status={product.status} />
          <h3 className="text-center font-hand text-3xl leading-8 text-tinta [overflow-wrap:anywhere]">
            {product.name}
          </h3>
          <PriceAndPriority price={product.price} priority={product.priority} />
          {showOwner && product.ownerUsername && (
            <p className="text-center text-base text-tinta/80 [overflow-wrap:anywhere]">
              Para {product.ownerUsername}
            </p>
          )}
        </div>

        <div className="flex min-h-[20rem] flex-col justify-between gap-4">
          <div className="relative">
            {images.length > 1 ? (
              <ImageCarousel images={images} name={product.name} />
            ) : images.length === 1 ? (
              <SafeImage
                src={images[0]}
                alt={product.name}
                className="h-60 w-full rounded-md object-cover object-center"
              />
            ) : (
              <div
                role="img"
                aria-label="Sin imagen"
                className="flex h-60 w-full items-center justify-center rounded-md bg-orange-100 text-5xl"
              >
                🎁
              </div>
            )}
            {product.status === 'taken' && <Sello />}
          </div>

          {product.description && (
            <p className="whitespace-pre-line text-base leading-relaxed text-tinta [overflow-wrap:anywhere]">
              {product.description}
            </p>
          )}

          <LinksButton links={product.links} name={product.name} />
        </div>
      </div>
      {children}
    </article>
  )
}

/** Rejilla de etiquetas: 1 columna en móvil, 2 desde sm, 3 desde md. */
export function ProductGrid({ children }: { children: ReactNode }) {
  return (
    <section className="grid w-full max-w-5xl grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 md:grid-cols-3">
      {children}
    </section>
  )
}
