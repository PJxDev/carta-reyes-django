# Carta de Reyes

Aplicación web para crear tu carta a los Reyes Magos, compartirla con un enlace
(`/tu-usuario`) y dejar que otras personas "pillen" los regalos para que no se
repitan.

> El proyecto nació como Django + PostgreSQL y se ha migrado a
> **Next.js + Google Sheets** en cuatro fases, cada una entregada como un patch
> (`git am`). El código Django ya no está en el árbol; sigue disponible en el
> historial de git (ver "Migrar los datos de Django").

## Estado de la migración

| Fase | Contenido | Estado |
| ---- | --------- | ------ |
| 1 | Base Next.js (App Router, TypeScript, Tailwind 4), layout, fuentes, cabecera, home y documentación | ✅ hecha |
| 2 | Capa de datos sobre Google Sheets, hash de contraseñas y sesión, script de preparación de la hoja e importador de datos de Django (con 67 tests) | ✅ hecha |
| 3 | Páginas y lógica de negocio: registro, login, editor, carta pública, pillados (Server Actions, componentes cliente) | ✅ hecha |
| 4 | Auditoría de responsive y corrección de fallos de diseño; retirada del código Django | ✅ hecha |

## Stack

| | Antes | Después |
| --- | --- | --- |
| Framework | Django 5.1 (plantillas) | Next.js 16 (App Router, React 19, TypeScript) |
| Datos | PostgreSQL (`dj-database-url`) | Hoja de cálculo de Google (API de Sheets v4) |
| Usuarios/sesión | `django.contrib.auth` | Hash `scrypt` + cookie de sesión firmada |
| Estilos | Tailwind por CDN (v3.0) | Tailwind 4 compilado con PostCSS |
| JS de cliente | `script.js` con `querySelector` | Componentes React (fase 3) |
| Despliegue | Render (`build.sh`, gunicorn, whitenoise) | Cualquier host de Node (Vercel, Render, …): `npm run build` + `npm start`, con las variables de `.env.example` |

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
| `npm run typecheck` | Comprobación de tipos con `tsc` (requiere `npm install`) |
| `npm test` | Tests (`node:test`, sin red: Google se simula) |
| `npm run sheet:setup` | Crea pestañas y cabeceras en la hoja de Google |
| `npm run import:django -- dump.json [--dry-run]` | Importa usuarios y productos desde Django |

## Configurar Google Sheets

1. Crea un libro en Google Sheets y copia su ID (la parte entre `/d/` y `/edit` de la URL) en `GOOGLE_SHEET_ID`.
2. En Google Cloud Console crea un proyecto y habilita la **Google Sheets API**.
3. Crea una **cuenta de servicio** y una clave JSON. Copia `client_email` en `GOOGLE_SERVICE_ACCOUNT_EMAIL` y `private_key` en `GOOGLE_PRIVATE_KEY` (entre comillas, con los `\n` tal cual).
4. Comparte el libro con ese email como **Editor**.
5. Ejecuta `npm run sheet:setup`.

Sin `GOOGLE_SHEET_ID` en desarrollo se usa `.data/db.json`, así se puede trabajar sin credenciales.

## Migrar los datos de Django

El código Django ya no está en la rama, pero la base de datos de PostgreSQL sigue
siendo la fuente de los datos. Para exportarlos necesitas ejecutar el proyecto
Django una vez: recupéralo del historial (`git worktree add ../carta-django <commit-anterior-a-la-fase-4>`),
configura su `DATABASE_URL` y ejecuta:

```bash
# (en el checkout del proyecto Django)
python manage.py dumpdata auth.user cartas.producto --indent 2 > dump.json
# (en este proyecto)
npm run import:django -- dump.json --dry-run
npm run import:django -- dump.json
```

Las contraseñas de Django siguen funcionando y se actualizan a scrypt en el primer login. Es repetible sin duplicar datos.

## Rutas

| Ruta | Antes (Django) | Ahora | Acceso |
| ---- | -------------- | ----- | ------ |
| `/` | `home` | `app/page.tsx` | público; con sesión muestra accesos y el enlace para compartir |
| `/registro` | `registro` | `app/registro` + `registerAction` | público (con sesión redirige a `/`) |
| `/login` | `login` | `app/login` + `loginAction` | público (con sesión redirige a `/`) |
| `/logout` (GET) | `logout` | botón con `logoutAction` (POST) | con sesión |
| `/editor` | `editor` | `app/editor` | con sesión |
| `/editor/crear_producto`, `/editor/editar_producto` | formularios POST | `saveProductoAction` | con sesión |
| `/pillados` | `pillados` | `app/pillados` | con sesión |
| `/<usuario>` | `carta` | `app/[username]` | público |
| `/api/pillar_producto/<id>/` | JSON + CSRF | `pillarProductoAction` | con sesión |
| `/api/despillar_producto/<id>/` | JSON + CSRF | `despillarProductoAction` | con sesión |
| `/api/borrar_producto/<id>/` | JSON + CSRF | `deleteProductoAction` | con sesión |

No hay rutas `/api`: las Server Actions de Next.js sustituyen a los `fetch` + CSRF de Django (Next comprueba el origen de cada petición).

## Seguridad: qué mejora respecto a la versión Django

La versión Django comprobaba que hubiera sesión pero **no de quién era cada producto**:

- Cualquier usuario podía **borrar** cualquier producto (`/api/borrar_producto/<id>/`).
- Cualquier usuario podía **liberar** un regalo que había pillado otra persona, o **pillarle** uno a alguien que ya lo tenía, o pillar sus propios regalos.
- `editar_producto` tampoco comprobaba el autor.

Ahora (`src/lib/repos/productos.ts`): solo el autor edita o borra, nadie pilla lo suyo ni lo ya pillado, y solo quien lo pilló lo libera. La comprobación y la escritura se hacen juntas, de modo que dos personas pillando a la vez no pueden ganar las dos.

Además:

- El autor **no ve** qué regalos le han pillado (igual que antes), y ahora tampoco viajan al navegador ids de otros usuarios.
- Los enlaces se validan (`http`/`https` únicamente) al guardar y al leer de la hoja, así que una celda editada a mano no puede inyectar `javascript:`.
- La sesión es una cookie `HttpOnly`, `SameSite=Lax` y `Secure` en producción, firmada con HMAC.

**Limitación conocida:** no hay límite de intentos de login. Las contraseñas usan scrypt (cada intento cuesta CPU), pero si la app es pública conviene poner un limitador delante (WAF/CDN del host).

## Documentación del proyecto

- [`STRUCTURE.md`](./STRUCTURE.md): árbol de carpetas, responsabilidad de cada
  archivo y flujo de una petición.
- [`SCHEMA.md`](./SCHEMA.md): diseño de la "base de datos" en Google Sheets y
  equivalencia con los modelos de Django.

Ambos documentos se actualizan en cada fase.

## Responsive: qué se auditó y qué se corrigió

Se renderizaron las 13 pantallas (con datos de prueba exigentes: nombres de 70
caracteres sin espacios, 10 enlaces, descripciones largas, usuario de 33
caracteres) en Chromium a **320, 360, 390, 480, 640, 700, 768, 1024 y 1440 px**,
midiendo desbordamiento horizontal y tamaño de los objetivos táctiles; y los
diálogos en **7 tamaños de pantalla, incluidos móviles en horizontal** (568×320,
667×375).

Fallos de la versión Django (verificados en su código) y cómo quedan:

| Fallo original | Efecto | Ahora |
| -------------- | ------ | ----- |
| Diálogos con `w-300` (clase inexistente en Tailwind 3) y `p-20` (5 rem por lado) | Sin ancho definido; en 360 px el relleno se comía 160 px | `Modal` único: `w-[calc(100%-1.5rem)]` con `max-w`, relleno `p-5` en móvil |
| Diálogo de edición con `h-[90vh]` fijo | Altura rígida; con teclado móvil o en horizontal el contenido quedaba inalcanzable | `max-h-[calc(100dvh-1.5rem)]` con scroll interno; el botón de cerrar queda fijo fuera del scroll |
| Iconos de 30 px y botón "añadir" de 30 px | Objetivos táctiles pequeños | Todos los controles ≥ 44 px (`size-11`, `min-h-11`/`min-h-12`) |
| "PILLAR"/"PILLADO" como texto sin botón | Zona de toque mínima | Botón de ancho completo y 44 px de alto |
| Cabecera con 2 botones que no contemplaba más enlaces | Con más enlaces se rompía en filas desalineadas | Lista única centrada que envuelve en móvil; desde `md` el bloque de sesión va a la derecha |
| Nombres/descripciones sin palabras cortables | Una palabra larga desbordaba la tarjeta | `overflow-wrap:anywhere` en títulos, descripciones y nombres de usuario |
| Productos sin imagen → `<img src="">` | Icono de imagen rota | Hueco con un regalo; lo mismo si la imagen falla al cargar |
| Carrusel sin etiquetas y con flechas de texto pequeñas | No accesible | Botones de 40 px con `aria-label`, contador "1/3" y rol de carrusel |

Fallos detectados **durante** esta migración y corregidos antes de entregar:

- El botón de lápiz del editor tapaba el título de la tarjeta.
- El botón de cerrar de un diálogo largo se desplazaba fuera de la vista (y el
  `<dialog>` entero se movía al enfocar un campo: se resuelve con `overflow-clip`).
- La portada desbordaba con nombres de usuario largos.

**Qué NO se ha podido verificar** (sin red en el entorno de desarrollo):

- La tipografía real (Pacifico). Se probó con DejaVu Sans con espaciado, de
  anchura similar; conviene revisar la cabecera con la fuente real.
- La imagen de cabecera es una URL externa de laSexta (hotlink). Si deja de
  existir, saldrá solo el texto alternativo. Lo más robusto es descargarla a
  `public/` y cambiar `HERO_IMAGE_URL` en `src/lib/site.ts`.
- Safari/iOS y Firefox: solo se probó en Chromium.

## Qué cambia de comportamiento respecto a la versión Django

Se apuntan aquí para que no sorprendan; se amplían en las fases siguientes.

- Texto del botón de registro corregido: "Registarse" → "Registrarse".
- Contraseñas: mínimo 8 caracteres. Usuarios: 3–30 caracteres (letras sin tildes, números, `.`, `-`, `_`).
- Cerrar sesión es un botón (POST), no un enlace; ya no se puede cerrar la sesión de alguien con una imagen que apunte a `/logout`.
- La cabecera con sesión añade "Mi carta" y "Pillados" (en Django solo se llegaba por URL).
- Los enlaces e imágenes se añaden con un botón "Añadir" (o Intro), no solo al perder el foco del campo; se admiten hasta 10 de cada tipo.
- Si una imagen no carga se muestra un hueco con un regalo; los productos sin imagen ya no dejan un icono roto.
- Los diálogos (enlaces, edición, confirmaciones) usan un único componente `Modal` y caben en pantallas pequeñas.
- Las fuentes se cargan con `next/font` (autoalojadas) en vez de un `@import` de
  Google Fonts, y Tailwind se compila en lugar de cargarse por CDN.
