'use client'

import { createContext, useContext } from 'react'

const UploadContext = createContext(false)

/** Indica a los formularios del editor si la subida de imágenes está activada en el servidor. */
export function UploadProvider({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  return <UploadContext.Provider value={enabled}>{children}</UploadContext.Provider>
}

export const useCanUpload = (): boolean => useContext(UploadContext)
