import Link from 'next/link'
import { logoutAction } from '@/app/actions/auth'
import { getCurrentUser } from '@/lib/auth/current-user'
import { Hero } from './Hero'
import { HomeIcon } from './icons'

const pill =
  'flex min-h-12 items-center justify-center rounded-full px-4 py-2 text-center text-lg transition-all hover:scale-105 md:px-5 md:text-2xl'

export async function SiteHeader() {
  const user = await getCurrentUser()

  return (
    <header className="flex flex-col items-center justify-between gap-6 pb-8 font-header text-tinta">
      {/* En móvil los botones se centran y pasan a una segunda fila si no caben;
          desde md el bloque de sesión se separa a la derecha. */}
      <nav className="w-full bg-orange-300 p-3 md:p-4">
        <ul className="flex flex-row flex-wrap items-center justify-center gap-2 md:gap-4">
          <li>
            <Link href="/" className={`${pill} bg-etiqueta`} aria-label="Inicio">
              <span className="hidden md:block">Inicio</span>
              <HomeIcon className="block md:hidden" />
            </Link>
          </li>
          {user ? (
            <>
              <li>
                <Link href="/editor" className={`${pill} bg-emerald-200 hover:bg-emerald-100`}>
                  Mi carta
                </Link>
              </li>
              <li>
                <Link href="/pillados" className={`${pill} bg-pink-200 hover:bg-pink-100`}>
                  Pillados
                </Link>
              </li>
              <li className="md:ml-auto">
                <form action={logoutAction}>
                  <button type="submit" className={`${pill} bg-red-700 text-white hover:bg-red-800`}>
                    Cerrar Sesión
                  </button>
                </form>
              </li>
            </>
          ) : (
            <>
              <li className="md:ml-auto">
                <Link href="/login" className={`${pill} bg-green-200 hover:bg-green-100`}>
                  Iniciar Sesión
                </Link>
              </li>
              <li>
                <Link href="/registro" className={`${pill} bg-blue-200 hover:bg-blue-100`}>
                  Registrarse
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      <Hero />
    </header>
  )
}
