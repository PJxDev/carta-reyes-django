/**
 * Reduce una foto en el navegador antes de subirla: lado mayor ≤ 1280 px y JPEG.
 * Así una foto de móvil de 6 MB pasa a ~200–400 KB y cabe en el límite de 2 MB.
 * Solo para código de cliente.
 */
export async function shrinkImage(file: File, maxSide = 1280, quality = 0.82): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas no disponible')
  context.fillStyle = '#fff' // los PNG transparentes no deben quedar negros en JPEG
  context.fillRect(0, 0, width, height)
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!blob) throw new Error('no se pudo codificar la imagen')
  return new File([blob], 'foto.jpg', { type: 'image/jpeg' })
}
