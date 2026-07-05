/**
 * Carga de datos de especies (generados por scripts/build-data.mjs desde
 * ARK Smart Breeding — MIT, © 2015 cadon — ver README).
 */
import type { GameVersion, Species, StatConstants, StatKey } from '../engine/types'
import { STAT_KEYS } from '../engine/types'
import aseJson from './species-ase.json'
import asaJson from './species-asa.json'

/** Formato compacto: [id, nombre, tbhm, displayedStats, stats[8]] */
type CompactSpecies = [string, string, number, number, ([number, number, number, number, number] | null)[]]
interface DataFile {
  version: string
  source: string
  generated: string
  species: CompactSpecies[]
}

/** Bits del bitmask displayedStats de ASB, por índice ASB (health=0 … speed=9) */
const DS_BIT: Record<StatKey, number> = {
  health: 1 << 0,
  stamina: 1 << 1,
  torpor: 1 << 2,
  oxygen: 1 << 3,
  food: 1 << 4,
  weight: 1 << 7,
  melee: 1 << 8,
  speed: 1 << 9,
}

export interface SpeciesEntry extends Species {
  /** ¿Se muestra este stat in-game para la especie? (para la UI) */
  displayed: Record<StatKey, boolean>
}

function toSpecies(c: CompactSpecies): SpeciesEntry {
  const [id, name, TBHM, ds, stats] = c
  const rec = {} as Record<StatKey, StatConstants | null>
  const displayed = {} as Record<StatKey, boolean>
  STAT_KEYS.forEach((key, i) => {
    const s = stats[i]
    rec[key] = s ? { B: s[0], Iw: s[1], Id: s[2], Ta: s[3], Tm: s[4] } : null
    displayed[key] = (ds & DS_BIT[key]) !== 0 && s !== null
  })
  return { id, name, stats: rec, TBHM, displayed }
}

const cache = new Map<GameVersion, SpeciesEntry[]>()

export function getSpecies(version: GameVersion): SpeciesEntry[] {
  if (!cache.has(version)) {
    const file = (version === 'ASA' ? asaJson : aseJson) as DataFile
    cache.set(
      version,
      file.species.map(toSpecies).sort((a, b) => a.name.localeCompare(b.name)),
    )
  }
  return cache.get(version)!
}

export function findSpecies(version: GameVersion, id: string): SpeciesEntry | undefined {
  return getSpecies(version).find((s) => s.id === id)
}

export function getDataInfo(version: GameVersion): { version: string; generated: string; source: string } {
  const file = (version === 'ASA' ? asaJson : aseJson) as DataFile
  return { version: file.version, generated: file.generated, source: file.source }
}
