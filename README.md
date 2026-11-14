# Carta de Reyes

Aplicación web para crear tu carta a los Reyes Magos, compartirla con un enlace
(`/tu-usuario`) y dejar que otras personas "pillen" los regalos para que no se
repitan.

> **Migración en curso:** el proyecto nació como Django + PostgreSQL y se está
> transformando a **Next.js + Google Sheets** por fases. Cada fase se entrega
> como un patch (`git am`) que deja el repositorio en un estado coherente.

## Estado de la migración

| Fase | Contenido | Estado |
| ---- | --------- | ------ |
| 1 | Base Next.js (App Router, TypeScript, Tailwind 4), layout, fuentes, cabecera, home y documentación | ✅ hecha |
| 2 | Capa de datos sobre Google Sheets, autenticación (hash + sesión), script de preparación de la hoja e importador de datos de Django | ⏳ |
| 3 | Páginas y lógica de negocio: registro, login, editor, carta pública, pillados | ⏳ |
| 4 | Revisión de responsive, corrección de fallos de diseño y retirada del código Django | ⏳ |

Mientras no termine la fase 4, **el código Django sigue en el repositorio**
(`cartareyes/`, `cartas/`, `manage.py`, …) y puede ejecutarse como siempre. La
aplicación Next.js vive en la raíz (`src/`, `package.json`).

## Stack

| | Antes | Después |
| --- | --- | --- |
| Framework | Django 5.1 (plantillas) | Next.js 16 (App Router, React 19, TypeScript) |
| Datos | PostgreSQL (`dj-database-url`) | Hoja de cálculo de Google (API de Sheets v4) |
| Usuarios/sesión | `django.contrib.auth` | Hash `scrypt` + cookie de sesión firmada |
| Estilos | Tailwind por CDN (v3.0) | Tailwind 4 compilado con PostCSS |
| JS de cliente | `script.js` con `querySelector` | Componentes React (fase 3) |
| Despliegue | Render (`build.sh`, gunicorn, whitenoise) | Cualquier host de Node (Vercel, Render, …) |

## Requisitos

- Node.js **22.18 o superior**
- npm 10+

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # rellena SESSION_SECRET (ver el propio archivo)
npm run dev                  # http://localhost:3000
```

### Scripts

| Script | Qué hace |
| ------ | -------- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilación y servidor de producción |
| `npm run typecheck` | Comprobación de tipos con `tsc` |

## Documentación del proyecto

- [`STRUCTURE.md`](./STRUCTURE.md): árbol de carpetas, responsabilidad de cada
  archivo y flujo de una petición.
- [`SCHEMA.md`](./SCHEMA.md): diseño de la "base de datos" en Google Sheets y
  equivalencia con los modelos de Django.

Ambos documentos se actualizan en cada fase.

## Qué cambia de comportamiento respecto a la versión Django

Se apuntan aquí para que no sorprendan; se amplían en las fases siguientes.

- Texto del botón de registro corregido: "Registarse" → "Registrarse".
- Las fuentes se cargan con `next/font` (autoalojadas) en vez de un `@import` de
  Google Fonts, y Tailwind se compila en lugar de cargarse por CDN.
