'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { loginAction, registerAction } from '@/app/actions/auth'
import type { FormState } from '@/app/actions/auth'

const input = 'w-full rounded-md bg-slate-200 p-2 text-xl'

function Submit({ children, className }: { children: string; className: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`min-h-12 rounded-md p-4 font-semibold text-white disabled:opacity-60 ${className}`}
    >
      {pending ? 'Un momento…' : children}
    </button>
  )
}

function ErrorLine({ error }: { error?: string }) {
  return error ? (
    <h2 role="alert" className="text-center text-xl font-semibold text-red-500">
      {error}
    </h2>
  ) : null
}

export function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(loginAction, {})
  return (
    <form action={action} className="flex w-full max-w-sm flex-col items-center gap-4 p-4">
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
      <Submit className="bg-green-600 hover:bg-green-700">iniciar sesión</Submit>
    </form>
  )
}

export function RegisterForm() {
  const [state, action] = useActionState<FormState, FormData>(registerAction, {})
  return (
    <form action={action} className="flex w-full max-w-sm flex-col items-center gap-4 p-4">
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
      <Submit className="bg-blue-600 hover:bg-blue-700">Registrarse</Submit>
    </form>
  )
}
