import { put } from '@vercel/blob'
import { randomUUID } from 'node:crypto'
import type { ImageKind } from './images.ts'

/** Sube una imagen a Vercel Blob (tienda pública) y devuelve su URL. Usa BLOB_READ_WRITE_TOKEN. */
export async function uploadToBlob(
  userId: string,
  bytes: Uint8Array,
  kind: ImageKind
): Promise<string> {
  const blob = await put(`cartas/${userId}/${randomUUID()}.${kind.extension}`, new Blob([bytes as BlobPart], { type: kind.contentType }), {
    access: 'public',
    addRandomSuffix: true,
    contentType: kind.contentType
  })
  return blob.url
}
