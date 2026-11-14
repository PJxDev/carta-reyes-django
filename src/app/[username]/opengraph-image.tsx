import { ImageResponse } from 'next/og'
import { getRepos } from '@/lib/repos'
import { countGifts } from '@/lib/services/cartas'

export const alt = 'Carta a los Reyes Magos'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Vista previa al compartir la carta (WhatsApp, redes). Solo muestra el nombre y cuántos regalos hay, nunca quién pilló qué. */
export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const name = decodeURIComponent((await params).username)
  const count = await countGifts(getRepos(), name)
  const title = count === null ? 'Carta de Reyes' : `Carta de ${name}`
  const subtitle =
    count === null ? 'Crea tu carta y compártela' : count === 1 ? '1 regalo en la carta' : `${count} regalos en la carta`
  const fontSize = title.length > 28 ? 64 : title.length > 16 ? 84 : 108

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: 60,
          background: 'linear-gradient(180deg, #1b2559 0%, #2d3a85 100%)',
          color: '#fffaf0'
        }}
      >
        <div style={{ fontSize: 120, color: '#f5b93b', display: 'flex' }}>★</div>
        <div style={{ fontSize, fontWeight: 700, textAlign: 'center', display: 'flex', maxWidth: 1080, wordBreak: 'break-all' }}>
          {title}
        </div>
        <div style={{ fontSize: 44, color: '#f5b93b', display: 'flex' }}>{subtitle}</div>
        <div style={{ fontSize: 32, opacity: 0.85, display: 'flex' }}>a los Reyes Magos</div>
      </div>
    ),
    size
  )
}
