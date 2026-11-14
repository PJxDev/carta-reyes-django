'use client'

import { useSyncExternalStore } from 'react'

export type ThemeChoice = 'auto' | 'light' | 'dark'
export const THEME_KEY = 'carta:tema'

const ORDER: ThemeChoice[] = ['auto', 'light', 'dark']
const LABEL: Record<ThemeChoice, string> = { auto: 'Tema automático', light: 'Tema claro', dark: 'Tema oscuro' }
const ICON: Record<ThemeChoice, string> = { auto: '◐', light: '☀', dark: '☾' }

function read(): ThemeChoice {
  try {
    const value = window.localStorage.getItem(THEME_KEY)
    return value === 'light' || value === 'dark' ? value : 'auto'
  } catch {
    return 'auto'
  }
}

function apply(choice: ThemeChoice) {
  const root = document.documentElement
  if (choice === 'auto') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', choice)
}

const subscribe = (callback: () => void) => {
  window.addEventListener('carta:tema', callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener('carta:tema', callback)
    window.removeEventListener('storage', callback)
  }
}

/**
 * Interruptor de tema: automático (sigue al sistema) → claro → oscuro.
 * La preferencia se recuerda en este navegador; el script de layout.tsx la aplica
 * antes de pintar para que no haya parpadeo.
 */
export function ThemeToggle() {
  const choice = useSyncExternalStore(subscribe, read, () => 'auto' as ThemeChoice)
  const next = ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length]

  const change = () => {
    try {
      if (next === 'auto') window.localStorage.removeItem(THEME_KEY)
      else window.localStorage.setItem(THEME_KEY, next)
    } catch {
      /* sin almacenamiento: el cambio vale solo hasta recargar */
    }
    apply(next)
    window.dispatchEvent(new Event('carta:tema'))
  }

  return (
    <button
      type="button"
      onClick={change}
      aria-label={`${LABEL[choice]}. Cambiar a ${LABEL[next].toLowerCase()}`}
      title={LABEL[choice]}
      className="flex min-h-12 min-w-12 items-center justify-center rounded-full bg-etiqueta text-2xl transition-transform hover:scale-105"
    >
      <span aria-hidden="true">{ICON[choice]}</span>
    </button>
  )
}
