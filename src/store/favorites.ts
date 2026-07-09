import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Criaturas marcadas con ⭐ — lo único que muestra la Home sin búsqueda activa. */
interface Favorites {
  ids: string[]
  toggle: (speciesId: string) => void
}

export const useFavorites = create<Favorites>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id],
        })),
    }),
    { name: 'dododex-v2-favorites' },
  ),
)
