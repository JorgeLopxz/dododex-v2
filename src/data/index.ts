/**
 * Carga de datos de especies (generados por scripts/build-data.mjs desde
 * ARK Smart Breeding — MIT, © 2015 cadon — ver README).
 */
import type { Species, StatConstants, StatKey } from '../engine/types'
import { STAT_KEYS } from '../engine/types'
import type { SpeciesTaming, TamingFood } from '../engine/taming'
import asaJson from './species-asa.json'
import aseJson from './species-ase.json'
import tamingFoodsJson from './taming-foods.json'

export type GameVersion = 'asa' | 'ase'

/** Formato compacto: [id, nombre, tbhm, displayedStats, stats[8], taming[9], breeding[5]|null] */
type CompactTaming = [number, number, number, number, number, number, number, number, number]
type CompactBreeding = [number, number, number, number, number]
type CompactSpecies = [
  string,
  string,
  number,
  number,
  ([number, number, number, number, number] | null)[],
  CompactTaming,
  CompactBreeding | null,
]

export interface SpeciesBreeding {
  /** segundos de incubación de huevo (0 si es gestación) */
  incubation: number
  /** segundos de gestación (mamíferos) */
  gestation: number
  /** segundos hasta adulto */
  maturation: number
  eggTempMin: number
  eggTempMax: number
}
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
  /** Datos de tameo (la base de datos solo contiene especies domables) */
  taming: SpeciesTaming
  /** Datos de cría (null si no se reproduce) */
  breeding: SpeciesBreeding | null
}

function toSpecies(c: CompactSpecies): SpeciesEntry {
  const [id, name, TBHM, ds, stats, t, b] = c
  const rec = {} as Record<StatKey, StatConstants | null>
  const displayed = {} as Record<StatKey, boolean>
  STAT_KEYS.forEach((key, i) => {
    const s = stats[i]
    rec[key] = s ? { B: s[0], Iw: s[1], Id: s[2], Ta: s[3], Tm: s[4] } : null
    displayed[key] = (ds & DS_BIT[key]) !== 0 && s !== null
  })
  const taming: SpeciesTaming = {
    affinityNeeded0: t[0],
    affinityIncreasePL: t[1],
    ineffectiveness: t[2],
    foodConsumptionBase: t[3],
    foodConsumptionMult: t[4],
    torporDepletionPS0: t[5],
    nonViolent: t[6] === 1,
    wakeAffinityMult: t[7],
    wakeFoodDeplMult: t[8],
  }
  const breeding: SpeciesBreeding | null = b
    ? { incubation: b[0], gestation: b[1], maturation: b[2], eggTempMin: b[3], eggTempMax: b[4] }
    : null
  return { id, name, stats: rec, TBHM, displayed, taming, breeding }
}

/* ——— Comidas de tameo (tamingFoodData.json de ASB) ——— */

interface TamingFoodsFile {
  version: string
  foods: Record<string, { f: number; a: number; u?: boolean }>
  perSpecies: Record<string, { eats: string[]; overrides: Record<string, { f?: number; a?: number }> }>
}
const foodsFile = tamingFoodsJson as TamingFoodsFile

function findDietEntry(speciesName: string) {
  const clean = speciesName.replace(/\s*\(.*\)$/, '').trim()
  const candidates = [
    speciesName,
    clean,
    // variantes que se doman IGUAL que su especie base (mismo bloque de dieta)
    clean.replace(/^(Aberrant|Tek|Corrupted|Astral|Dire Polar|Polar)\s+/, ''),
    clean.replace(/^[XR]-/, ''),
  ]
  return candidates.map((n) => foodsFile.perSpecies[n]).find(Boolean)
}

/**
 * Dieta de una especie por afinidad (comida convencional), en orden de preferencia.
 * Resuelve variantes contra la especie base. null ⇒ no hay datos de dieta convencional
 * (criatura nueva sin catalogar, o tame ESPECIAL — pasivo, sangre, element… — que no
 * se representa con esta tabla; se maneja aparte con su método real).
 */
export function getTamingFoods(speciesName: string): TamingFood[] | null {
  const entry = findDietEntry(speciesName)
  if (!entry) return null
  const foods: TamingFood[] = []
  for (const name of entry.eats) {
    // los kibbles "Augmented" son del sistema Homestead/ARK Mobile — no existen en ASA/ASE estándar
    if (name.includes('Augmented')) continue
    const base = foodsFile.foods[name]
    const ov = entry.overrides[name]
    const f = ov?.f ?? base?.f
    const a = ov?.a ?? base?.a
    if (f === undefined || a === undefined || a <= 0) continue
    foods.push({ name, f, a })
  }
  return foods.length > 0 ? dedupeKibbles(foods) : null
}

const KIBBLE_TIERS = ['Basic', 'Simple', 'Regular', 'Superior', 'Exceptional', 'Extraordinary']

/**
 * De todos los kibbles que come la especie, deja solo EL ADECUADO: el tier más bajo
 * con afinidad completa (los superiores sirven igual — se sobreentiende; los inferiores
 * vienen con afinidad ~16 y son basura). El genérico "Kibble" (legacy) también se omite.
 */
function dedupeKibbles(foods: TamingFood[]): TamingFood[] {
  const kibbles = foods.filter((x) => x.name.endsWith('Kibble'))
  if (kibbles.length <= 1) return foods
  const maxA = Math.max(...kibbles.map((k) => k.a))
  const preferred = kibbles
    .filter((k) => k.a === maxA && k.name !== 'Kibble')
    .sort((x, y) => KIBBLE_TIERS.findIndex((t) => x.name.startsWith(t)) - KIBBLE_TIERS.findIndex((t) => y.name.startsWith(t)))[0]
  const keep = preferred ?? kibbles.find((k) => k.a === maxA)!
  let placed = false
  const out: TamingFood[] = []
  for (const x of foods) {
    if (!x.name.endsWith('Kibble')) {
      out.push(x)
      continue
    }
    if (!placed) {
      out.push(keep)
      placed = true
    }
  }
  return out
}

const speciesCache: Partial<Record<GameVersion, SpeciesEntry[]>> = {}

function getDataFile(version: GameVersion): DataFile {
  return (version === 'ase' ? aseJson : asaJson) as DataFile
}

export function getSpecies(version: GameVersion = 'asa'): SpeciesEntry[] {
  speciesCache[version] ??= getDataFile(version).species.map(toSpecies).sort((a, b) => a.name.localeCompare(b.name))
  return speciesCache[version]!
}

export function findSpecies(id: string, version: GameVersion = 'asa'): SpeciesEntry | undefined {
  return getSpecies(version).find((s) => s.id === id)
}

export function getDataInfo(version: GameVersion = 'asa'): { version: string; generated: string; source: string } {
  const file = getDataFile(version)
  return { version: file.version, generated: file.generated, source: file.source }
}
