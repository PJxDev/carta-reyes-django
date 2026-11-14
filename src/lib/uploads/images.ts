/** Validación de imágenes subidas. Módulo puro: no depende de ningún servicio externo. */

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024

export interface ImageKind {
  contentType: 'image/jpeg' | 'image/png' | 'image/webp'
  extension: 'jpg' | 'png' | 'webp'
}

/** Reconoce el formato por los primeros bytes; el tipo que declare el navegador no se usa. */
export function sniffImage(bytes: Uint8Array): ImageKind | null {
  const startsWith = (...sig: number[]) => sig.every((b, i) => bytes[i] === b)
  if (startsWith(0xff, 0xd8, 0xff)) return { contentType: 'image/jpeg', extension: 'jpg' }
  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) {
    return { contentType: 'image/png', extension: 'png' }
  }
  const riff = startsWith(0x52, 0x49, 0x46, 0x46) // "RIFF"
  const webp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 // "WEBP"
  if (riff && webp) return { contentType: 'image/webp', extension: 'webp' }
  return null
}

export type ImageCheck = { ok: true; kind: ImageKind } | { ok: false; error: string }

export function checkImage(bytes: Uint8Array): ImageCheck {
  if (bytes.length === 0) return { ok: false, error: 'El archivo está vacío' }
  if (bytes.length > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'La imagen pesa demasiado (máximo 2 MB)' }
  }
  const kind = sniffImage(bytes)
  if (!kind) return { ok: false, error: 'Solo se admiten imágenes JPG, PNG o WebP' }
  return { ok: true, kind }
}
