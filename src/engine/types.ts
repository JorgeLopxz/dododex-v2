/**
 * Tipos del motor de stats de ARK.
 * Fórmula de referencia (ark.wiki.gg/wiki/Creature_stats_calculation):
 * V = (B·(1+Lw·Iw·IwM)·TBHM·(1+IB·0.2·IBM) + Ta·TaM) · (1+TE·Tm·TmM) · (1+Ld·Id·IdM)
 */

export type GameVersion = 'ASA' | 'ASE'

export const STAT_KEYS = [
  'health',
  'stamina',
  'oxygen',
  'food',
  'weight',
  'melee',
  'speed',
  'torpor',
] as const
export type StatKey = (typeof STAT_KEYS)[number]

/** Stats que pueden recibir puntos (salvajes o domésticos). Torpor nunca recibe puntos asignados. */
export const POINT_STATS = ['health', 'stamina', 'oxygen', 'food', 'weight', 'melee', 'speed'] as const
export type PointStatKey = (typeof POINT_STATS)[number]

/** El imprint NO afecta a estamina ni oxígeno (ni crafting, fuera de nuestro modelo). */
export const IMPRINT_EXCLUDED: ReadonlySet<StatKey> = new Set(['stamina', 'oxygen'])

/** Constantes por stat de una especie (equivale a fullStatsRaw de ARK Smart Breeding). */
export interface StatConstants {
  /** Valor base a nivel 1 */
  B: number
  /** Incremento por nivel salvaje (fracción de B) */
  Iw: number
  /** Incremento por nivel doméstico (fracción del valor post-tame) */
  Id: number
  /** Bonus aditivo al domar (puede ser negativo; los negativos no escalan con TaM) */
  Ta: number
  /** Bonus multiplicativo al domar, escala con TE (si es negativo, TE no se aplica) */
  Tm: number
}

export interface Species {
  /** Identificador interno (blueprint o slug) */
  id: string
  name: string
  /** null ⇒ la especie no usa ese stat (p.ej. oxígeno en algunas acuáticas) */
  stats: Record<StatKey, StatConstants | null>
  /** Tamed Base Health Multiplier — solo afecta a salud y solo tras domar */
  TBHM: number
  /** Stats que en esta especie nunca reciben puntos salvajes (además de las reglas de versión) */
  noWildPoints?: PointStatKey[]
}

/** Multiplicadores de servidor (Game.ini / GameUserSettings.ini). Ausente ⇒ 1. */
export interface ServerMultipliers {
  /** PerLevelStatsMultiplier_DinoWild[i] */
  IwM: Partial<Record<StatKey, number>>
  /** PerLevelStatsMultiplier_DinoTamed[i] */
  IdM: Partial<Record<StatKey, number>>
  /** PerLevelStatsMultiplier_DinoTamed_Add[i] */
  TaM: Partial<Record<StatKey, number>>
  /** PerLevelStatsMultiplier_DinoTamed_Affinity[i] */
  TmM: Partial<Record<StatKey, number>>
  /** BabyImprintingStatScaleMultiplier */
  IBM: number
}

/**
 * Preset de servidores oficiales.
 * Nota: los oficiales aplican el conocido "nerf" a salud/melee post-tame
 * (Add 0.14 en salud y melee, Affinity 0.44 en melee).
 * TODO(FASE 1): verificar contra el serverMultipliers oficial de ASB al ingerir values.json.
 */
export const OFFICIAL_MULTIPLIERS: ServerMultipliers = {
  IwM: {},
  IdM: {},
  TaM: { health: 0.14, melee: 0.14 },
  TmM: { melee: 0.44 },
  IBM: 1,
}

/** Estado de un stat concreto de una criatura. */
export interface StatState {
  /** Niveles salvajes (incluye bonus de tameo, que se reparten como salvajes) */
  Lw: number
  /** Niveles gastados por el jugador tras domar */
  Ld: number
}

export interface CreatureContext {
  tamed: boolean
  /** Criado por jugadores (aplica imprint) */
  bred: boolean
  /** Efectividad de tameo 0..1 (irrelevante si bred: TE=1 en criados) */
  TE: number
  /** Imprint 0..1 */
  IB: number
}
