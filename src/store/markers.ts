import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Marcador de recurso puesto por el usuario sobre un mapa (coordenadas en % 0-100). */
export interface ResourceMarker {
  id: string
  map: string
  res: string
  x: number
  y: number
}

interface Markers {
  markers: ResourceMarker[]
  add: (m: Omit<ResourceMarker, 'id'>) => void
  remove: (id: string) => void
  clearMap: (map: string) => void
}

export const useMarkers = create<Markers>()(
  persist(
    (set) => ({
      markers: [],
      add: (m) => set((s) => ({ markers: [...s.markers, { ...m, id: crypto.randomUUID() }] })),
      remove: (id) => set((s) => ({ markers: s.markers.filter((x) => x.id !== id) })),
      clearMap: (map) => set((s) => ({ markers: s.markers.filter((x) => x.map !== map) })),
    }),
    { name: 'dododex-v2-markers' },
  ),
)
