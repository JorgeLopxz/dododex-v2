/**
 * Carga de datos de especies (generados por scripts/build-data.mjs desde
 * ARK Smart Breeding — MIT, © 2015 cadon — ver README).
 */
import type { GameVersion, Species, StatConstants, StatKey } from '../engine/types'
import { STAT_KEYS } from '../engine/types'
import type { SpeciesTaming, TamingFood } from '../engine/taming'
import aseJson from './species-ase.json'
import asaJson from './species-asa.json'
import tamingFoodsJson from './taming-foods.json'

/** Formato compacto: [id, nombre, tbhm, displayedStats, stats[8], taming[9]|null, breeding[5]|null] */
type CompactTaming = [number, number, number, number, number, number, number, number, number]
type CompactBreeding = [number, number, number, number, number]
type CompactSpecies = [
  string,
  string,
  number,
  number,
  ([number, number, number, number, number] | null)[],
  CompactTaming | null,
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
  /** Datos de tameo (null si la especie no es domable por afinidad) */
  taming: SpeciesTaming | null
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
  const taming: SpeciesTaming | null = t
    ? {
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
    : null
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

/**
 * Dieta de una especie, en orden de preferencia (mejor comida primero).
 * Resuelve variantes (Aberrant/Tek/X-/R-) contra la especie base. null ⇒ sin datos de dieta.
 */
export function getTamingFoods(speciesName: string): TamingFood[] | null {
  const clean = speciesName.replace(/\s*\(.*\)$/, '').trim()
  const candidates = [
    speciesName,
    clean,
    clean.replace(/^(Aberrant|Tek|Corrupted)\s+/, ''),
    clean.replace(/^[XR]-/, ''),
  ]
  const entry = candidates.map((n) => foodsFile.perSpecies[n]).find(Boolean)
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
