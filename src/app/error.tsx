'use client'

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="flex flex-col items-center gap-4 px-4 text-center">
      <h2 className="text-3xl font-semibold">Algo ha fallado</h2>
      <p className="max-w-prose text-lg">
        No hemos podido cargar los datos. Suele ser algo pasajero (la hoja de cálculo tarda en responder); prueba de
        nuevo en unos segundos.
      </p>
      <button
        type="button"
        onClick={reset}
        className="min-h-12 rounded-full bg-slate-50 px-6 py-3 text-xl font-semibold"
      >
        Reintentar
      </button>
    </section>
  )
}
