import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="flex flex-col items-center gap-4 px-4 text-center">
      <h2 className="text-3xl font-semibold">Usuario no encontrado</h2>
      <p className="text-lg">No existe ninguna carta en esta dirección.</p>
      <Link href="/" className="min-h-12 rounded-full bg-slate-50 px-6 py-3 text-xl font-semibold">
        Volver al inicio
      </Link>
    </section>
  )
}
