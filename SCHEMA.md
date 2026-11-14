# Esquema de datos (Google Sheets)

> **Estado:** implementado en la fase 2 (`src/lib/store/schema.ts` es la fuente de verdad).

La "base de datos" es **un único libro de Google Sheets con dos pestañas**. La
primera fila de cada pestaña contiene los nombres de columna; cada fila
siguiente es un registro.

## Pestaña `usuarios`

Equivale a `django.contrib.auth.User`.

| Columna | Tipo | Obligatoria | Descripción |
| ------- | ---- | ----------- | ----------- |
| `id` | texto | sí | Identificador único. Los usuarios importados de Django conservan su id numérico como texto (`"1"`, `"2"`…); los nuevos usan UUID. |
| `username` | texto | sí | Nombre de usuario, **siempre en minúsculas**. Es único y forma la URL pública (`/<username>`). |
| `password_hash` | texto | sí | Hash de la contraseña (ver más abajo). Nunca se guarda la contraseña. |
| `created_at` | fecha ISO 8601 (UTC) | sí | Fecha de alta. |

## Pestaña `productos`

Equivale al modelo `cartas.Producto`.

| Columna | Tipo | Obligatoria | Descripción |
| ------- | ---- | ----------- | ----------- |
| `id` | texto | sí | Identificador único (id numérico de Django como texto, o UUID). |
| `user_id` | texto | sí | `usuarios.id` del autor de la carta. |
| `name` | texto (≤ 200) | sí | Nombre del regalo. |
| `description` | texto (≤ 2000) | no | Descripción libre. |
| `links` | JSON | no | Lista de URLs de compra, p. ej. `["https://a.com","https://b.com"]`. Vacío = sin enlaces. |
| `images` | JSON | no | Lista de URLs de imagen, mismo formato que `links`. |
| `created_at` | fecha ISO 8601 (UTC) | sí | Fecha de creación. |
| `pillado_user_id` | texto | no | `usuarios.id` de quien ha "pillado" el regalo. Vacío = disponible. |

## Equivalencia con los modelos de Django

| Django (`Producto`) | Hoja `productos` | Nota |
| ------------------- | ---------------- | ---- |
| `id` (autoincremental) | `id` | Sin autoincremento en Sheets: los nuevos ids son UUID. |
| `name` `CharField(200)` | `name` | Misma longitud máxima. |
| `links` `JSONField` | `links` | Se guarda el JSON serializado en una celda. |
| `images` `JSONField` | `images` | Idem. |
| `description` `TextField` | `description` | Se limita a 2000 caracteres. |
| `created` `auto_now_add` | `created_at` | La fecha la pone la aplicación. |
| `user_id` `FK User` | `user_id` | |
| `pillado_user` `FK User` (nullable) | `pillado_user_id` | Celda vacía en lugar de `NULL`. |

## Reglas de integridad (las aplica la aplicación, no Sheets)

Una hoja de cálculo no tiene claves foráneas ni restricciones `UNIQUE`, así que
las garantiza el código de la fase 2/3:

1. `usuarios.username` es único sin distinguir mayúsculas y no puede ser una
   ruta reservada (`login`, `registro`, `editor`, `pillados`, `api`…).
2. `productos.user_id` debe existir en `usuarios`.
3. `pillado_user_id` está vacío o es un usuario existente distinto del autor.
4. Un producto solo lo puede editar o borrar su autor.
5. Un producto solo puede pillarlo alguien que no sea el autor y solo si está
   libre; solo quien lo pilló puede liberarlo.

## Contraseñas

Formato de `password_hash` para usuarios nuevos:

```
scrypt$<N>$<r>$<p>$<salt base64>$<hash base64>
```

Para poder importar usuarios existentes, también se acepta el formato de
Django (`pbkdf2_sha256$<iteraciones>$<salt>$<hash>`); al iniciar sesión con un
hash de Django se reemplaza automáticamente por uno `scrypt`.

## Cómo se escribe en la hoja

- Las escrituras usan `valueInputOption=RAW`: lo que escribe un usuario se
  guarda como texto literal y **nunca se interpreta como fórmula**
  (`=IMPORTXML(...)` quedaría como texto).
- Se puede reordenar columnas o añadir otras propias: la aplicación localiza las
  columnas por el **nombre de la cabecera**, no por posición, y conserva las
  columnas que no conoce.
- Editar la hoja a mano mientras la aplicación está en uso es posible, pero
  los cambios pueden tardar unos segundos en verse (caché de lectura).

## Límites conocidos de usar Sheets como base de datos

| Límite | Consecuencia |
| ------ | ------------ |
| Cuota de la API (≈ 60 lecturas/min por usuario y 300/min por proyecto) | Se lee cada pestaña entera de una vez y se cachea unos segundos. |
| Sin transacciones | Se serializan las escrituras dentro de una instancia; con varias instancias en paralelo dos escrituras simultáneas podrían pisarse. |
| Sin índices | Cada consulta recorre la pestaña completa. Adecuado para cientos o pocos miles de filas, no para más. |
| 50 000 caracteres por celda | Los límites de longitud de `description`, `links` e `images` lo evitan. |
