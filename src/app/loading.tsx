/**
 * Se muestra mientras se lee la hoja de cálculo (puede tardar medio segundo o
 * más). Reserva el espacio de tres etiquetas para que la página no salte.
 */
export default function Loading() {
  return (
    <section aria-busy="true" className="flex w-full flex-col items-center gap-4 p-4 sm:p-7">
      <p role="status" className="font-header text-2xl">
        Cargando la carta…
      </p>
      <div className="grid w-full max-w-5xl grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="etiqueta-forma h-96 w-full max-w-xs bg-etiqueta/70 motion-safe:animate-pulse"
            aria-hidden="true"
          />
        ))}
      </div>
    </section>
  )
}
