import type { Metadata } from 'next'
import { Pacifico, Shadows_Into_Light } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
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

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION
}

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body
        className={`${pacifico.variable} ${shadowsIntoLight.variable} text-zinc-900`}
      >
        <div className="bg-orange-100 min-h-screen flex flex-col">
          <SiteHeader />
          <main className="flex flex-col flex-1 justify-center items-center">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  )
}
