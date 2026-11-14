import { COPYRIGHT_TEXT } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="text-black p-7 flex flex-col justify-center items-center">
      <p>{COPYRIGHT_TEXT}</p>
    </footer>
  )
}
