import { logoutAction } from '@/app/actions/auth'
import { getCurrentUser } from '@/lib/auth/current-user'
import { Hero } from './Hero'
import { HomeIcon } from './icons'
import { NavLink } from './NavLink'
import { NavMenu } from './NavMenu'

const pillBase =
  'flex min-h-12 items-center justify-center rounded-full px-4 py-2 text-center text-lg transition-all hover:scale-105 nav:px-5 nav:text-2xl'
/** En el menú desplegable de móvil las píldoras ocupan todo el ancho; desde 1200 px, lo justo. */
const pill = `${pillBase} w-full nav:w-auto`

export async function SiteHeader() {
  const user = await getCurrentUser()

  return (
    <header className="flex flex-col items-center justify-between gap-6 pb-8 font-header text-tinta">
      {/* Móvil: «Inicio», tema y botón de menú; los enlaces se despliegan debajo (NavMenu).
          Desde 1200 px (`nav`) todo va en una fila y el bloque de sesión se separa a la derecha. */}
      <nav aria-label="Principal" className="w-full bg-orange-300 p-3 nav:p-4">
        <div className="flex flex-wrap items-center gap-2 nav:gap-4">
          <NavLink href="/" className={`${pillBase} bg-etiqueta`} aria-label="Inicio">
            <span className="hidden md:block">Inicio</span>
            <HomeIcon className="block md:hidden" />
          </NavLink>
          <NavMenu>
            {user ? (
              <>
                <li>
                  <NavLink href="/editor" className={`${pill} bg-emerald-200 hover:bg-emerald-100`}>
                    Mi carta
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/siguiendo" className={`${pill} bg-sky-200 hover:bg-sky-100`}>
                    Siguiendo
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/pillados" className={`${pill} bg-pink-200 hover:bg-pink-100`}>
                    Pillados
                  </NavLink>
                </li>
                <li className="nav:ml-auto">
                  <NavLink href="/cuenta" className={`${pill} bg-etiqueta`}>
                    Mi cuenta
                  </NavLink>
                </li>
                <li>
                  <form action={logoutAction}>
                    <button type="submit" className={`${pill} bg-red-700 text-white hover:bg-red-800`}>
                      Cerrar Sesión
                    </button>
                  </form>
                </li>
              </>
            ) : (
              <>
                <li className="nav:ml-auto">
                  <NavLink href="/login" className={`${pill} bg-green-200 hover:bg-green-100`}>
                    Iniciar Sesión
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/registro" className={`${pill} bg-blue-200 hover:bg-blue-100`}>
                    Registrarse
                  </NavLink>
                </li>
              </>
            )}
          </NavMenu>
        </div>
      </nav>

      <Hero />
    </header>
  )
}
