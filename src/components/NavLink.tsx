'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps } from 'react'

/** Enlace de navegación que marca la página actual para lectores de pantalla (y con subrayado). */
export function NavLink({ href, className = '', ...props }: ComponentProps<typeof Link> & { href: string }) {
  const pathname = usePathname()
  const current = pathname === href
  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      className={`${className} ${current ? 'underline decoration-2 underline-offset-4' : ''}`}
      {...props}
    />
  )
}
