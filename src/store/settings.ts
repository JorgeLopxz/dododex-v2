import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  OFFICIAL_MULTIPLIERS,
  type PointStatKey,
  type ServerMultipliers,
} from '../engine/types'

export type ServerPreset = 'official' | 'vanilla' | 'custom'

interface Settings {
  /** Preset de servidor: oficial (con nerf salud/melee), vanilla (sin nerf) o personalizado */
  preset: ServerPreset
  setPreset: (p: ServerPreset) => void
  /** PerLevelStatsMultiplier_DinoWild por stat (solo preset custom) */
  customIwM: Partial<Record<PointStatKey, number>>
  /** PerLevelStatsMultiplier_DinoTamed por stat (solo preset custom) */
  customIdM: Partial<Record<PointStatKey, number>>
  /** Mantener el nerf oficial de salud/melee en custom */
  customNerf: boolean
  setCustomMult: (kind: 'IwM' | 'IdM', stat: PointStatKey, value: number) => void
  setCustomNerf: (v: boolean) => void
}

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      preset: 'official',
      setPreset: (preset) => set({ preset }),
      customIwM: {},
      customIdM: {},
      customNerf: true,
      setCustomMult: (kind, stat, value) =>
        set((s) => {
          const key = kind === 'IwM' ? 'customIwM' : 'customIdM'
          const next = { ...s[key] }
          if (value === 1 || !Number.isFinite(value) || value <= 0) delete next[stat]
          else next[stat] = value
          return { [key]: next }
        }),
      setCustomNerf: (customNerf) => set({ customNerf }),
    }),
    { name: 'dododex-v2-settings' },
  ),
)

/** Multiplicadores efectivos según el preset activo. */
export function getMultipliers(s: Pick<Settings, 'preset' | 'customIwM' | 'customIdM' | 'customNerf'>): ServerMultipliers {
  if (s.preset === 'official') return OFFICIAL_MULTIPLIERS
  if (s.preset === 'vanilla') return { IwM: {}, IdM: {}, TaM: {}, TmM: {}, IBM: 1 }
  return {
    IwM: s.customIwM,
    IdM: s.customIdM,
    TaM: s.customNerf ? OFFICIAL_MULTIPLIERS.TaM : {},
    TmM: s.customNerf ? OFFICIAL_MULTIPLIERS.TmM : {},
    IBM: 1,
  }
}

export const PRESET_LABEL: Record<ServerPreset, string> = {
  official: 'Oficial (con nerf salud/melee)',
  vanilla: 'No oficial vanilla (sin nerf)',
  custom: 'Personalizado',
}
