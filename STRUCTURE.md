# Estructura del proyecto

La columna **Fase** indica en qué fase se incorporó o modificó cada archivo.

```
carta-reyes/
├── README.md                    Guía general     (1+)
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
│   │   ├── page.tsx             Home ("/")                                  (1,3)
│   │   ├── login/page.tsx       Inicio de sesión                            (3)
│   │   ├── registro/page.tsx    Alta de usuario                             (3)
│   │   ├── editor/page.tsx      Editor de la propia carta (privado)         (3)
│   │   ├── pillados/page.tsx    Regalos que has pillado (privado)           (3)
│   │   ├── [username]/page.tsx  Carta pública                               (3)
│   │   ├── not-found.tsx        "Usuario no encontrado"                     (3)
│   │   ├── error.tsx            Fallo al leer la hoja → reintentar          (3)
│   │   └── actions/
│   │       ├── auth.ts          registerAction, loginAction, logoutAction   (3)
│   │       └── productos.ts     save/delete/pillar/despillar                (3)
│   ├── components/
│   │   ├── SiteHeader.tsx       Navegación (según sesión), título, imagen   (1,3)
│   │   ├── SiteFooter.tsx       Pie de página                               (1)
│   │   ├── icons.tsx            Iconos SVG compartidos                      (1,3)
│   │   ├── Modal.tsx            <dialog> nativo reutilizable                (3)
│   │   ├── ConfirmDialog.tsx    Confirmaciones Sí/No                        (3)
│   │   ├── ProductCard.tsx      Tarjeta y rejilla de productos              (3)
│   │   ├── EditableCard.tsx     Tarjeta del editor (editar/borrar)          (3)
│   │   ├── AddProduct.tsx       Botón + diálogo de alta                     (3)
│   │   ├── ProductForm.tsx      Formulario de producto (alta y edición)     (3)
│   │   ├── UrlListField.tsx     Lista editable de enlaces/imágenes          (3)
│   │   ├── ImageCarousel.tsx    Carrusel de imágenes                        (3)
│   │   ├── LinksButton.tsx      Enlace de compra o lista de opciones        (3)
│   │   ├── PillButton.tsx       Pillar / lo pillaste / pillado              (3)
│   │   ├── SafeImage.tsx        <img> con hueco si no carga                 (3)
│   │   ├── AuthForms.tsx        Formularios de login y registro             (3)
│   │   ├── CopyLink.tsx         Copiar enlace de la carta                   (3)
│   │   └── CartaIntro.tsx       Texto de cabecera de las cartas             (3)
│   └── lib/
│       ├── site.ts              Textos y constantes de presentación         (1)
│       ├── config.ts            Variables de entorno validadas              (2)
│       ├── types.ts             Usuario, Producto, ProductoInput            (2)
│       ├── validation.ts        Reglas de usuario, contraseña, URLs, producto (2)
│       ├── auth/
│       │   ├── password.ts      scrypt + compatibilidad con hashes Django   (2)
│       │   ├── session.ts       Token de sesión firmado (HMAC)              (2)
│       │   └── current-user.ts  Cookie ↔ usuario; requireUser()             (3)
│       ├── services/
│       │   ├── accounts.ts      registerUser, authenticate                  (3)
│       │   └── cartas.ts        Qué ve cada visitante (PillStatus, vistas)  (3)
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
├── tests/                       81 tests + simulador de Google              (2,3)
```

## Convenciones

- **Alias de importación:** `@/…` apunta a `src/…`.
- **Componentes de servidor por defecto.** Solo se marcan con `'use client'` los
  que necesitan estado o eventos del navegador (carrusel, diálogos,
  formularios).
- **`src/lib/` no se importa desde componentes de cliente** (salvo módulos de
  solo tipos): ahí vivirán las credenciales de Google y la lógica de sesión.

## Dónde está cada responsabilidad

| Capa | Archivos | Depende de Next | Tests |
| ---- | -------- | --------------- | ----- |
| Reglas de negocio y permisos | `lib/repos`, `lib/services`, `lib/validation.ts` | No | `node --test` |
| Almacén (Sheets / archivo) | `lib/store`, `lib/sheets` | No | `node --test` con Google simulado |
| Sesión | `lib/auth/password.ts`, `session.ts` | No | `node --test` |
| Cookie y redirecciones | `lib/auth/current-user.ts`, `app/actions/*` | Sí (finas) | — |
| Páginas y componentes | `app/*`, `components/*` | Sí | — |

La idea es que **todo lo que decide algo** vive en las capas sin Next y está probado; las capas con Next solo conectan.

## Flujo de una petición

```
Navegador ──► Página (Server Component) ──► lib/auth (lee cookie de sesión)
                      │
                      └──────────────────► lib/repos ──► lib/store ──► Google Sheets
Formulario / botón ──► Server Action ─────► (valida, comprueba permisos, escribe)
                                            └─► revalidatePath() y la página se refresca
```

**Qué viaja al navegador:** las páginas no pasan entidades de la base de datos a los componentes de cliente, sino `ProductoView` (`lib/services/cartas.ts`): sin ids de usuario ni fechas, y con `status` ya resuelto en el servidor para quien mira.
