# Estructura del proyecto

La columna **Fase** indica en qué fase se incorpora o se modifica cada archivo.
Lo marcado con 🗑️ es código Django que se elimina en la fase 4.

```
carta-reyes/
├── README.md                    Guía general y estado de la migración      (1+)
├── STRUCTURE.md                 Este documento                              (1+)
├── SCHEMA.md                    Esquema de la hoja de cálculo               (1+)
├── package.json                 Dependencias y scripts                      (1+)
├── tsconfig.json                TypeScript estricto, alias @/* → src/*      (1)
├── next.config.ts               Configuración de Next.js                    (1)
├── postcss.config.mjs           Plugin de Tailwind 4                        (1)
├── .env.example                 Plantilla de variables de entorno           (1+)
├── .gitignore                                                               (1)
│
├── src/
│   ├── app/                     Rutas (App Router)
│   │   ├── layout.tsx           HTML base, fuentes, cabecera y pie          (1)
│   │   ├── globals.css          Tailwind + estilos base                     (1)
│   │   └── page.tsx             Home ("/")                                  (1)
│   ├── components/
│   │   ├── SiteHeader.tsx       Navegación, título y imagen de cabecera     (1)
│   │   ├── SiteFooter.tsx       Pie de página                               (1)
│   │   └── icons.tsx            Iconos SVG compartidos                      (1)
│   └── lib/
│       ├── site.ts              Textos y constantes de presentación         (1)
│       ├── config.ts            Variables de entorno validadas              (2)
│       ├── types.ts             Usuario, Producto, ProductoInput            (2)
│       ├── validation.ts        Reglas de usuario, contraseña, URLs, producto (2)
│       ├── auth/
│       │   ├── password.ts      scrypt + compatibilidad con hashes Django   (2)
│       │   └── session.ts       Token de sesión firmado (HMAC)              (2)
│       ├── store/
│       │   ├── schema.ts        Pestañas y columnas                         (2)
│       │   ├── backend.ts       Contrato de almacén                         (2)
│       │   ├── table.ts         Filas por nombre de columna, cola de escritura (2)
│       │   ├── sheets-backend.ts Google Sheets con caché                    (2)
│       │   ├── memory-backend.ts Memoria/archivo para desarrollo y tests    (2)
│       │   └── index.ts         Ensamblado y singleton                      (2)
│       ├── sheets/
│       │   ├── a1.ts            Notación A1                                 (2)
│       │   ├── google-auth.ts   JWT de cuenta de servicio → token           (2)
│       │   └── api.ts           Cliente REST con reintentos                 (2)
│       ├── repos/               usuarios, productos, mappers                (2)
│       └── import/django-dump.ts Importador de dumpdata                     (2)
├── scripts/                     sheet:setup e import:django                 (2)
├── tests/                       67 tests + simulador de Google              (2)
│
├── cartareyes/  🗑️              Proyecto Django (settings, urls, wsgi…)
├── cartas/      🗑️              App Django (modelos, vistas, plantillas…)
├── manage.py    🗑️
├── requirements.txt  🗑️
└── build.sh     🗑️
```

## Convenciones

- **Alias de importación:** `@/…` apunta a `src/…`.
- **Componentes de servidor por defecto.** Solo se marcan con `'use client'` los
  que necesitan estado o eventos del navegador (carrusel, diálogos,
  formularios).
- **`src/lib/` no se importa desde componentes de cliente** (salvo módulos de
  solo tipos): ahí vivirán las credenciales de Google y la lógica de sesión.

## Flujo de una petición (objetivo final)

```
Navegador ──► Página (Server Component) ──► lib/auth (lee cookie de sesión)
                      │
                      └──────────────────► lib/repos ──► lib/store ──► Google Sheets
Formulario / botón ──► Server Action ─────► (valida, comprueba permisos, escribe)
                                            └─► revalidatePath() y la página se refresca
```

Las partes de `lib/` se añaden en las fases 2 y 3; este diagrama se irá
concretando.
