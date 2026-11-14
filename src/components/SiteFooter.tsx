import { COPYRIGHT_OWNER, COPYRIGHT_SINCE } from '@/lib/site'

export function SiteFooter() {
  const year = new Date().getFullYear()
  const years = year > COPYRIGHT_SINCE ? `${COPYRIGHT_SINCE}–${year}` : `${year}`
  return (
    <footer className="flex flex-col items-center justify-center p-7 text-tinta">
      <p>
        © {years} {COPYRIGHT_OWNER}
      </p>
    </footer>
  )
}
