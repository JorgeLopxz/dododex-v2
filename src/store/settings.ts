import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  OFFICIAL_MULTIPLIERS,
  type PointStatKey,
  type ServerMultipliers,
} from '../engine/types'
import { TAMING_PRESETS } from '../engine/taming'

export type ServerPreset = 'official' | 'vanilla' | 'custom'
export type GameVersion = 'asa' | 'ase'

interface Settings {
  /** Juego activo para filtrar datos y mapas: ASA o ASE */
  gameVersion: GameVersion
  setGameVersion: (v: GameVersion) => void

  /** Preset de servidor: oficial (con nerf salud/melee), vanilla (sin nerf) o personalizado */
  preset: ServerPreset
  setPreset: (p: ServerPreset) => void

  /** Rates de tameo del servidor (persistentes hasta que el usuario las cambie) */
  tamingPreset: string
  setTamingPreset: (id: string) => void
  /** TamingSpeedMultiplier del preset "custom" */
  customTsm: number
  setCustomTsm: (v: number) => void

  /** Multiplicador de velocidad de cría del servidor (incubación+maduración; ×1 = oficial) */
  breedingMult: number
  setBreedingMult: (v: number) => void

  /** Clave de la API de Gemini para el asistente (solo se guarda en este dispositivo) */
  geminiKey: string
  setGeminiKey: (k: string) => void
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
      gameVersion: 'asa',
      setGameVersion: (gameVersion) => set({ gameVersion }),
      preset: 'official',
      setPreset: (preset) => set({ preset }),
      tamingPreset: 'official',
      setTamingPreset: (tamingPreset) => set({ tamingPreset }),
      customTsm: 1,
      setCustomTsm: (customTsm) => set({ customTsm }),
      breedingMult: 1,
      setBreedingMult: (breedingMult) => set({ breedingMult: breedingMult > 0 ? breedingMult : 1 }),
      geminiKey: '',
      setGeminiKey: (geminiKey) => set({ geminiKey: geminiKey.trim() }),
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

/** TamingSpeedMultiplier efectivo según el preset de rates guardado. */
export function getTamingSpeed(s: Pick<Settings, 'tamingPreset' | 'customTsm'>): number {
  if (s.tamingPreset === 'custom') return s.customTsm > 0 ? s.customTsm : 1
  return TAMING_PRESETS.find((p) => p.id === s.tamingPreset)?.tsm ?? 1
}

export const PRESET_LABEL: Record<ServerPreset, string> = {
  official: 'Oficial (con nerf salud/melee)',
  vanilla: 'No oficial vanilla (sin nerf)',
  custom: 'Personalizado',
}
