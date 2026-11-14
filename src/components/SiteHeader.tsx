import Link from 'next/link'
import { HERO_IMAGE_ALT, HERO_IMAGE_URL } from '@/lib/site'
import { HomeIcon } from './icons'

const pill =
  'flex justify-center items-center text-center rounded-full w-auto p-4 overflow-hidden text-xl sm:text-2xl transition-all hover:scale-110 hover:cursor-pointer'

export function SiteHeader() {
  return (
    <header className="text-black font-header pb-8 flex flex-col justify-between items-center gap-7">
      <nav className="bg-orange-300 p-4 w-full flex flex-row justify-between gap-2">
        <ul className="flex flex-row justify-end gap-4">
          <li className={`${pill} bg-slate-50`}>
            <Link className="hidden sm:block" href="/">
              Inicio
            </Link>
            <Link className="block sm:hidden" href="/" aria-label="Inicio">
              <HomeIcon />
            </Link>
          </li>
        </ul>
        <ul className="flex flex-row justify-end gap-2 sm:gap-4">
          <li className={`${pill} bg-green-200 hover:bg-green-100`}>
            <Link href="/login">Iniciar Sesión</Link>
          </li>
          <li className={`${pill} bg-blue-200 hover:bg-blue-100`}>
            <Link href="/registro">Registrarse</Link>
          </li>
        </ul>
      </nav>

      <h1 className="text-4xl text-center">Queridos Reyes Magos ...</h1>

      {/* <img> a propósito: la URL es externa y next/image exigiría declarar el dominio */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={HERO_IMAGE_URL}
        alt={HERO_IMAGE_ALT}
        className="w-11/12 h-full m-4 object-contain object-center rounded-2xl md:object-cover md:h-[30rem]"
      />
    </header>
  )
}
