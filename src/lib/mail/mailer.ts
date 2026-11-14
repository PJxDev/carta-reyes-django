export interface MailMessage {
  to: string
  subject: string
  text: string
  html: string
}

export interface Mailer {
  send(message: MailMessage): Promise<void>
}

export class MailError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MailError'
  }
}

type FetchLike = (url: string, init: RequestInit) => Promise<Response>

/** Envía con la API REST de Resend (https://resend.com/docs/api-reference/emails/send-email). */
export function createResendMailer(options: {
  apiKey: string
  from: string
  fetch?: FetchLike
}): Mailer {
  const doFetch: FetchLike = options.fetch ?? ((url, init) => fetch(url, init))
  return {
    async send(message) {
      const response = await doFetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: options.from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
          html: message.html
        })
      })
      if (!response.ok) {
        const detail = (await response.text().catch(() => '')).slice(0, 300)
        throw new MailError(`Resend respondió ${response.status}: ${detail}`)
      }
    }
  }
}

/** Para desarrollo sin clave: escribe el email en la consola del servidor. */
export function createConsoleMailer(log: (line: string) => void = console.log): Mailer {
  return {
    async send(message) {
      log(`[email a ${message.to}] ${message.subject}\n${message.text}`)
    }
  }
}

/** Se usa cuando falta la configuración en producción: falla con un mensaje claro. */
export function createUnavailableMailer(): Mailer {
  return {
    async send() {
      throw new MailError('El envío de emails no está configurado (falta RESEND_API_KEY).')
    }
  }
}
