import { COPYRIGHT_OWNER, COPYRIGHT_SINCE } from '@/lib/site'

export function SiteFooter() {
  const year = new Date().getFullYear()
  const years = year > COPYRIGHT_SINCE ? `${COPYRIGHT_SINCE}–${year}` : `${year}`
  return (
    <footer className="flex flex-col items-center justify-center p-7 text-texto">
      <p>
        © {years} {COPYRIGHT_OWNER}
      </p>
      <p className="text-center font-hand text-lg">Hecho con ilusión para Melchor, Gaspar y Baltasar</p>
    </footer>
  )
}
