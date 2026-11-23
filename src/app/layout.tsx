import type { Metadata } from 'next'
import { Pacifico, Shadows_Into_Light } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { getSiteUrl } from '@/lib/config'
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site'

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pacifico',
  display: 'swap'
})

const shadowsIntoLight = Shadows_Into_Light({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-shadows',
  display: 'swap'
})

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  // Necesario para que las imágenes de vista previa (Open Graph) tengan URL absoluta.
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: SITE_NAME,
  description: SITE_DESCRIPTION
}

/** Aplica el tema elegido antes de pintar (evita el parpadeo). Sin elección, manda el sistema. */
const THEME_SCRIPT = `try{var t=localStorage.getItem('carta:tema');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body
        className={`${pacifico.variable} ${shadowsIntoLight.variable} text-texto`}
      >
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-full focus:bg-etiqueta focus:px-5 focus:py-3 focus:text-lg focus:font-semibold"
        >
          Saltar al contenido
        </a>
        <div className="bg-fondo min-h-screen min-h-dvh flex flex-col">
          <SiteHeader />
          <main id="contenido" tabIndex={-1} className="flex flex-col flex-1 justify-center items-center outline-none">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  )
}
