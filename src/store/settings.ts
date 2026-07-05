import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameVersion } from '../engine/types'

interface Settings {
  version: GameVersion
  setVersion: (v: GameVersion) => void
}

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      version: 'ASA',
      setVersion: (version) => set({ version }),
    }),
    { name: 'dododex-v2-settings' },
  ),
)
