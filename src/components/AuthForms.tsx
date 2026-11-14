'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { loginAction, registerAction } from '@/app/actions/auth'
import type { FormState } from '@/app/actions/auth'

const input = 'w-full rounded-md bg-white p-2 text-xl'
const card =
  'flex w-[calc(100%-2rem)] max-w-sm flex-col items-center gap-4 rounded-2xl bg-etiqueta p-6 shadow-[0_6px_14px_rgb(59_42_30/0.2)]'

function Submit({ children, className }: { children: string; className: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`min-h-12 w-full rounded-full px-4 py-3 text-lg font-semibold text-white disabled:opacity-60 ${className}`}
    >
      {pending ? 'Un momento…' : children}
    </button>
  )
}

function ErrorLine({ error }: { error?: string }) {
  return error ? (
    <h2 role="alert" className="text-center text-lg font-semibold text-red-700">
      {error}
    </h2>
  ) : null
}

export function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(loginAction, {})
  return (
    <form action={action} className={card}>
      <h1 className="font-header text-3xl">Iniciar sesión</h1>
      <ErrorLine error={state.error} />
      <input
        type="text"
        name="username"
        placeholder="Usuario"
        aria-label="Usuario"
        autoComplete="username"
        autoCapitalize="none"
        required
        defaultValue={state.username}
        className={input}
      />
      <input
        type="password"
        name="password"
        placeholder="Contraseña"
        aria-label="Contraseña"
        autoComplete="current-password"
        required
        className={input}
      />
      <Submit className="bg-emerald-700 hover:bg-emerald-800">Iniciar sesión</Submit>
      <p className="text-center">
        ¿No tienes cuenta?{' '}
        <Link href="/registro" className="inline-block py-2.5 font-semibold underline">
          Regístrate
        </Link>
      </p>
    </form>
  )
}

export function RegisterForm() {
  const [state, action] = useActionState<FormState, FormData>(registerAction, {})
  return (
    <form action={action} className={card}>
      <h1 className="font-header text-3xl">Registrarse</h1>
      <ErrorLine error={state.error} />
      <input
        type="text"
        name="username"
        placeholder="Usuario"
        aria-label="Usuario"
        autoComplete="username"
        autoCapitalize="none"
        required
        minLength={3}
        maxLength={30}
        defaultValue={state.username}
        className={input}
      />
      <input
        type="password"
        name="password1"
        placeholder="Contraseña"
        aria-label="Contraseña"
        autoComplete="new-password"
        required
        minLength={8}
        className={input}
      />
      <input
        type="password"
        name="password2"
        placeholder="Confirme Contraseña"
        aria-label="Confirme contraseña"
        autoComplete="new-password"
        required
        minLength={8}
        className={input}
      />
      <Submit className="bg-blue-700 hover:bg-blue-800">Crear cuenta</Submit>
      <p className="text-center">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="inline-block py-2.5 font-semibold underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  )
}
