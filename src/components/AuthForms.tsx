'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  forgotPasswordAction,
  loginAction,
  registerAction,
  resetPasswordAction,
  saveEmailAction
} from '@/app/actions/auth'
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
    <p role="alert" className="text-center text-lg font-semibold text-red-700">
      {error}
    </p>
  ) : null
}

export function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(loginAction, {})
  return (
    <form action={action} className={card}>
      <h2 className="font-header text-3xl">Iniciar sesión</h2>
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
      <Link href="/recuperar" className="inline-block py-2.5 underline">
        He olvidado mi contraseña
      </Link>
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
      <h2 className="font-header text-3xl">Registrarse</h2>
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
        type="email"
        name="email"
        placeholder="Email (opcional, para recuperar la contraseña)"
        aria-label="Email (opcional, para recuperar la contraseña)"
        autoComplete="email"
        maxLength={254}
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

function Notice({ message }: { message?: string }) {
  return message ? (
    <p role="status" className="text-center text-lg font-semibold text-emerald-800">
      {message}
    </p>
  ) : null
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(forgotPasswordAction, {})
  return (
    <form action={action} className={card}>
      <h2 className="font-header text-3xl">Recuperar contraseña</h2>
      <p className="text-center">Escribe el email que indicaste al registrarte y te enviaremos un enlace.</p>
      <ErrorLine error={state.error} />
      <Notice message={state.message} />
      <input
        type="email"
        name="email"
        placeholder="Email"
        aria-label="Email"
        autoComplete="email"
        required
        className={input}
      />
      <Submit className="bg-blue-700 hover:bg-blue-800">Enviar enlace</Submit>
      <Link href="/login" className="inline-block py-2.5 font-semibold underline">
        Volver a iniciar sesión
      </Link>
    </form>
  )
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState<FormState, FormData>(resetPasswordAction, {})
  return (
    <form action={action} className={card}>
      <h2 className="font-header text-3xl">Contraseña nueva</h2>
      <ErrorLine error={state.error} />
      <input type="hidden" name="token" value={token} />
      <input
        type="password"
        name="password1"
        placeholder="Contraseña nueva"
        aria-label="Contraseña nueva"
        autoComplete="new-password"
        required
        minLength={8}
        className={input}
      />
      <input
        type="password"
        name="password2"
        placeholder="Repite la contraseña"
        aria-label="Repite la contraseña"
        autoComplete="new-password"
        required
        minLength={8}
        className={input}
      />
      <Submit className="bg-emerald-700 hover:bg-emerald-800">Guardar contraseña</Submit>
    </form>
  )
}

export function EmailForm({ current }: { current: string }) {
  const [state, action] = useActionState<FormState, FormData>(saveEmailAction, {})
  return (
    <form action={action} className={card}>
      <h2 className="font-header text-3xl">Mi cuenta</h2>
      <p className="text-center">
        El email solo sirve para recuperar la contraseña. No se muestra a nadie.
      </p>
      <ErrorLine error={state.error} />
      <Notice message={state.message} />
      <input
        type="email"
        name="email"
        placeholder="Email"
        aria-label="Email"
        autoComplete="email"
        defaultValue={current}
        maxLength={254}
        className={input}
      />
      <Submit className="bg-blue-700 hover:bg-blue-800">Guardar email</Submit>
    </form>
  )
}
