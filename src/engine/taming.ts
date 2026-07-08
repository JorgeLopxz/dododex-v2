/**
 * Motor de tameo — fórmulas verificadas contra el código fuente de ARK Smart Breeding
 * (Taming.cs, MIT © cadon), que a su vez deriva del modelo de crumplecorn:
 *
 *   afinidadNecesaria = affinityNeeded0 + affinityIncreasePL × nivel
 *   afinidadPorPieza  = a × wakeAffinityMult? × TamingSpeedMultiplier × 4 (hardcoded del juego)
 *   piezas            = ceil(afinidadNecesaria / afinidadPorPieza)
 *   TE                = 1 / (1 + ineffectiveness × piezas / afinidadPorPieza)
 *   segundos          = ceil(piezas × foodValue / (foodConsBase × foodConsMult × drains))
 *   torporPS(nivel)   = ps0 + (nivel−1)^0.800403041 / (22.39671632 / ps0)
 *   narcóticos        = ceil(torporFaltante / (restauración + refresco×torporPS))
 */

/** Datos de tameo por especie (del array compacto generado por build-data) */
export interface SpeciesTaming {
  affinityNeeded0: number
  affinityIncreasePL: number
  ineffectiveness: number
  foodConsumptionBase: number
  foodConsumptionMult: number
  /** 0 = sin datos de torpor para esta especie */
  torporDepletionPS0: number
  nonViolent: boolean
  wakeAffinityMult: number
  wakeFoodDeplMult: number
}

export interface TamingFood {
  name: string
  /** puntos de comida que restaura */
  f: number
  /** afinidad base por pieza */
  a: number
}

export interface TamingServerMults {
  tamingSpeed: number
  /** DinoCharacterFoodDrainMultiplier × WildDinoCharacterFoodDrainMultiplier */
  foodDrain: number
  wildTorporDrain: number
}

export const OFFICIAL_TAMING: TamingServerMults = { tamingSpeed: 1, foodDrain: 1, wildTorporDrain: 1 }

/**
 * Presets de servidor — verificados contra arkstatus.com (jul-2026).
 * Ojo: las rates OFICIALES fluctúan con eventos (la Estándar iba ×2 el 03-07-2026);
 * por eso existe el preset Evento y el modo Custom.
 */
export const TAMING_PRESETS = [
  { id: 'official', label: 'Oficial', tsm: 1 },
  { id: 'event', label: 'Evento', tsm: 4.5 },
  { id: 'smalltribes', label: 'Small Tribes', tsm: 2.5 },
  { id: 'arkpocalypse', label: 'ARKpocalypse', tsm: 3 },
  { id: 'conquest', label: 'Conquest', tsm: 5 },
  { id: 'singleplayer', label: 'Un jugador', tsm: 2.5 },
] as const

/** Multiplicador fijo del juego (HardCodedTamingMultiplier en ASB) */
const HARDCODED_TAMING_MULT = 4

export interface TamingResult {
  food: TamingFood
  pieces: number
  te: number
  bonusLevels: number
  seconds: number
  /** null ⇒ la especie no tiene datos de torpor (mostrar honestamente "sin datos") */
  torpor: {
    total: number
    depletionPS: number
    narcotics: number
    bioToxins: number
    narcoberries: number
    ascerbicMushrooms: number
  } | null
}

export function torporDepletionPS(ps0: number, level: number, wildTorporDrainMult = 1): number {
  if (ps0 <= 0) return 0
  return (ps0 + Math.pow(level - 1, 0.800403041) / (22.39671632 / ps0)) * wildTorporDrainMult
}

export function calcTaming(
  t: SpeciesTaming,
  food: TamingFood,
  level: number,
  opts: {
    mults?: TamingServerMults
    /** torpor base y por nivel de la especie (stat torpor) para calcular narcóticos */
    torporStat?: { B: number; Iw: number }
    /** Sanguine Elixir (ASA): reduce la afinidad necesaria un 30% */
    sanguineElixir?: boolean
  } = {},
): TamingResult | null {
  const { mults = OFFICIAL_TAMING, torporStat, sanguineElixir = false } = opts
  let affinityNeeded = (t.affinityNeeded0 + t.affinityIncreasePL * level) * (sanguineElixir ? 0.7 : 1)
  if (affinityNeeded <= 0) return null

  let foodAffinity = food.a
  let foodValue = food.f
  if (t.nonViolent) {
    foodAffinity *= t.wakeAffinityMult
    foodValue *= t.wakeFoodDeplMult
  }
  foodAffinity *= mults.tamingSpeed * HARDCODED_TAMING_MULT
  if (foodAffinity <= 0 || foodValue <= 0) return null

  const pieces = Math.ceil(affinityNeeded / foodAffinity)
  const te = 1 / (1 + t.ineffectiveness * (pieces / foodAffinity))
  const bonusLevels = Math.floor((level * te) / 2)

  const drainPerSecond = t.foodConsumptionBase * t.foodConsumptionMult * mults.foodDrain
  const seconds = drainPerSecond > 0 ? Math.ceil((pieces * foodValue) / drainPerSecond) : 0

  let torpor: TamingResult['torpor'] = null
  if (!t.nonViolent && t.torporDepletionPS0 > 0 && torporStat) {
    const tds = torporDepletionPS(t.torporDepletionPS0, level, mults.wildTorporDrain)
    const total = torporStat.B * (1 + torporStat.Iw * (level - 1))
    const needed = Math.max(0, tds * seconds - total)
    torpor = {
      total,
      depletionPS: tds,
      narcotics: Math.ceil(needed / (40 + 8 * tds)),
      bioToxins: Math.ceil(needed / (80 + 16 * tds)),
      narcoberries: Math.ceil(needed / (7.5 + 3 * tds)),
      ascerbicMushrooms: Math.ceil(needed / (25 + 3 * tds)),
    }
  }

  return { food, pieces, te, bonusLevels, seconds, torpor }
}

/* ——— Plan combinado de comidas (réplica del bucle de ASB Taming.cs) ——— */

export interface PlanItem {
  food: TamingFood
  /** piezas que el jugador aportará de esta comida */
  pieces: number
}

export interface TamingPlanResult {
  /** piezas realmente consumidas por comida (en orden del plan) */
  used: { food: TamingFood; pieces: number }[]
  affinityNeeded: number
  /** afinidad aún sin cubrir (>0 ⇒ el plan no llega) */
  affinityLeft: number
  enough: boolean
  te: number
  bonusLevels: number
  seconds: number
  torpor: TamingResult['torpor']
}

/**
 * Calcula un tameo alimentando con VARIAS comidas en el orden dado
 * (p.ej. 10 kibbles + el resto carne cruda). Mismo algoritmo que ASB.
 */
export function calcTamingPlan(
  t: SpeciesTaming,
  plan: PlanItem[],
  level: number,
  opts: {
    mults?: TamingServerMults
    torporStat?: { B: number; Iw: number }
    sanguineElixir?: boolean
  } = {},
): TamingPlanResult {
  const { mults = OFFICIAL_TAMING, torporStat, sanguineElixir = false } = opts
  const affinityNeeded = (t.affinityNeeded0 + t.affinityIncreasePL * level) * (sanguineElixir ? 0.7 : 1)
  let remaining = affinityNeeded
  let foodByAffinity = 0
  let totalSeconds = 0
  let torporNeededAcc = 0
  const drainPS = t.foodConsumptionBase * t.foodConsumptionMult * mults.foodDrain
  const tds = !t.nonViolent && t.torporDepletionPS0 > 0 ? torporDepletionPS(t.torporDepletionPS0, level, mults.wildTorporDrain) : 0
  const used: TamingPlanResult['used'] = []

  for (const item of plan) {
    if (item.pieces <= 0 || remaining <= 0) continue
    let fa = item.food.a
    let fv = item.food.f
    if (t.nonViolent) {
      fa *= t.wakeAffinityMult
      fv *= t.wakeFoodDeplMult
    }
    fa *= mults.tamingSpeed * HARDCODED_TAMING_MULT
    if (fa <= 0 || fv <= 0) continue

    let pieces = Math.ceil(remaining / fa)
    if (pieces > item.pieces) pieces = item.pieces
    const seconds = drainPS > 0 ? Math.ceil((pieces * fv) / drainPS) : 0

    remaining -= pieces * fa
    foodByAffinity += pieces / fa
    torporNeededAcc += tds * seconds
    totalSeconds += seconds
    used.push({ food: item.food, pieces })
  }

  const enough = remaining <= 0
  const te = 1 / (1 + t.ineffectiveness * foodByAffinity)
  const bonusLevels = enough ? Math.floor((level * te) / 2) : 0

  let torpor: TamingResult['torpor'] = null
  if (tds > 0 && torporStat) {
    const total = torporStat.B * (1 + torporStat.Iw * (level - 1))
    const needed = Math.max(0, torporNeededAcc - total)
    torpor = {
      total,
      depletionPS: tds,
      narcotics: Math.ceil(needed / (40 + 8 * tds)),
      bioToxins: Math.ceil(needed / (80 + 16 * tds)),
      narcoberries: Math.ceil(needed / (7.5 + 3 * tds)),
      ascerbicMushrooms: Math.ceil(needed / (25 + 3 * tds)),
    }
  }

  return { used, affinityNeeded, affinityLeft: Math.max(0, remaining), enough, te, bonusLevels, seconds: totalSeconds, torpor }
}

/** Formatea segundos como "1h 23m" / "4m 05s" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`
  return `${s}s`
}
