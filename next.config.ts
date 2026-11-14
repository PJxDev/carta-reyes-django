import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Las imágenes se reducen en el navegador (< 2 MB) antes de subirlas con una Server Action.
  experimental: { serverActions: { bodySizeLimit: '3mb' } }
}

export default nextConfig
