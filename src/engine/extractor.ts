import { calcStat } from './statFormula'
import {
  POINT_STATS,
  type CreatureContext,
  type GameVersion,
  type PointStatKey,
  type ServerMultipliers,
  type Species,
  type StatKey,
} from './types'

const m = (rec: Partial<Record<StatKey, number>>, key: StatKey) => rec[key] ?? 1

/** Una combinación (Lw, Ld) que explica el valor observado de un stat. */
export interface StatCandidate {
  Lw: number
  Ld: number
}

export interface ExtractionInput {
  species: Species
  version: GameVersion
  /** Valores observados in-game por stat (los que quiera aportar el usuario) */
  observed: Partial<Record<PointStatKey, number>>
  ctx: CreatureContext
  mult: ServerMultipliers
  /** Puntos salvajes totales = (nivel tras domar, con bonus) − 1. Si se conoce, restringe la solución. */
  wildPoints?: number
  /** Puntos domésticos gastados = nivel actual − nivel tras domar. Si se conoce, restringe. */
  domPoints?: number
  /**
   * Precisión con la que el juego muestra cada valor (por defecto 0.1).
   * El solver acepta candidatos cuyo valor calculado redondee al observado.
   */
  displayPrecision?: number
  /** Cota superior de niveles salvajes por stat a explorar (por defecto 254) */
  maxLwPerStat?: number
  /** Cota superior de niveles domésticos por stat (por defecto 88 — cap práctico de ARK) */
  maxLdPerStat?: number
}

export interface StatExtraction {
  /** Todas las combinaciones (Lw, Ld) compatibles con el valor observado */
  candidates: StatCandidate[]
  /** true si hay más de una combinación → la UI debe pedir al usuario que fije hechos */
  ambiguous: boolean
}

export interface ExtractionResult {
  perStat: Partial<Record<PointStatKey, StatExtraction>>
  /**
   * Asignaciones globales consistentes (una candidata por stat) que cumplen
   * las restricciones de suma (wildPoints / domPoints) si se conocen.
   * Vacío ⇒ datos incompatibles (avisar al usuario: revisa TE/multiplicadores).
   */
  solutions: Array<Partial<Record<PointStatKey, StatCandidate>>>
  /** Stats efectivamente considerados (excluye speed en ASA, stats sin datos, etc.) */
  statsConsidered: PointStatKey[]
}

/** ¿Puede este stat recibir puntos en esta especie/versión? */
export function statReceivesPoints(key: PointStatKey, species: Species, version: GameVersion): boolean {
  if (species.stats[key] === null) return false
  if (species.noWildPoints?.includes(key)) return false
  // ASA: velocidad no subible por defecto (ni salvaje ni doméstica) — ver ANALISIS.md §5.2
  if (version === 'ASA' && key === 'speed') return false
  return true
}

/** Extracción de un stat SALVAJE (paridad Dododex): Lw = (V/B − 1) / (Iw·IwM) */
export function extractWildStat(
  key: PointStatKey,
  species: Species,
  observed: number,
  mult: ServerMultipliers,
  displayPrecision = 0.1,
): number | null {
  const c = species.stats[key]
  if (!c || c.Iw === 0) return null
  const raw = (observed / c.B - 1) / (c.Iw * m(mult.IwM, key))
  const rounded = Math.round(raw)
  if (rounded < 0) return null
  // valida por redondeo de display
  const back = c.B * (1 + rounded * c.Iw * m(mult.IwM, key))
  return Math.abs(back - observed) <= displayPrecision / 2 + 1e-6 ? rounded : null
}

/**
 * Enumera todas las combinaciones (Lw, Ld) que explican el valor observado de un stat
 * de una criatura domada/criada. Núcleo del inspector post-tame.
 */
export function solvePostTameStat(
  key: PointStatKey,
  species: Species,
  observed: number,
  ctx: CreatureContext,
  mult: ServerMultipliers,
  opts: { displayPrecision?: number; maxLw?: number; maxLd?: number } = {},
): StatCandidate[] {
  const c = species.stats[key]
  if (!c) return []
  const { displayPrecision = 0.1, maxLw = 254, maxLd = 88 } = opts
  const tol = displayPrecision / 2 + 1e-6
  const idm = c.Id * m(mult.IdM, key)
  const out: StatCandidate[] = []

  for (let Lw = 0; Lw <= maxLw; Lw++) {
    // valor con Lw niveles salvajes y 0 domésticos
    const vLd0 = calcStat(key, c, { Lw, Ld: 0 }, ctx, mult, species.TBHM)
    if (idm === 0) {
      if (Math.abs(vLd0 - observed) <= tol) out.push({ Lw, Ld: 0 })
      continue
    }
    const ldRaw = (observed / vLd0 - 1) / idm
    const Ld = Math.round(ldRaw)
    if (Ld < 0 || Ld > maxLd) continue
    const v = vLd0 * (1 + Ld * idm)
    if (Math.abs(v - observed) <= tol) out.push({ Lw, Ld })
  }
  return out
}

/**
 * Extracción completa post-tame: candidatos por stat + búsqueda de asignaciones
 * globales que cuadren con los puntos salvajes/domésticos conocidos.
 */
export function extractPostTame(input: ExtractionInput): ExtractionResult {
  const {
    species, version, observed, ctx, mult,
    wildPoints, domPoints,
    displayPrecision = 0.1, maxLwPerStat = 254, maxLdPerStat = 88,
  } = input

  const statsConsidered = POINT_STATS.filter(
    (k) => observed[k] !== undefined && statReceivesPoints(k, species, version),
  )

  const perStat: ExtractionResult['perStat'] = {}
  for (const key of statsConsidered) {
    const candidates = solvePostTameStat(key, species, observed[key]!, ctx, mult, {
      displayPrecision,
      maxLw: maxLwPerStat,
      maxLd: maxLdPerStat,
    })
    perStat[key] = { candidates, ambiguous: candidates.length > 1 }
  }

  // Búsqueda DFS de combinaciones globales con poda por sumas restantes
  const solutions: ExtractionResult['solutions'] = []
  const keys = statsConsidered
  const MAX_SOLUTIONS = 50

  const dfs = (i: number, sumLw: number, sumLd: number, acc: Partial<Record<PointStatKey, StatCandidate>>) => {
    if (solutions.length >= MAX_SOLUTIONS) return
    if (wildPoints !== undefined && sumLw > wildPoints) return
    if (domPoints !== undefined && sumLd > domPoints) return
    if (i === keys.length) {
      if (wildPoints !== undefined && sumLw !== wildPoints) return
      if (domPoints !== undefined && sumLd !== domPoints) return
      solutions.push({ ...acc })
      return
    }
    const key = keys[i]
    for (const cand of perStat[key]!.candidates) {
      acc[key] = cand
      dfs(i + 1, sumLw + cand.Lw, sumLd + cand.Ld, acc)
      delete acc[key]
    }
  }
  if (keys.length > 0 && keys.every((k) => perStat[k]!.candidates.length > 0)) {
    dfs(0, 0, 0, {})
  }

  // Si las restricciones globales dejan una única solución, reduce la ambigüedad por stat
  if (solutions.length === 1) {
    for (const key of keys) {
      perStat[key] = { candidates: [solutions[0][key]!], ambiguous: false }
    }
  }

  return { perStat, solutions, statsConsidered }
}
