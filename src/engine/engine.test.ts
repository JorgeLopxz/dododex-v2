import { describe, expect, it } from 'vitest'
import { calcStat, calcWildStat, tameBonusLevels } from './statFormula'
import { extractPostTame, extractWildStat, solvePostTameStat, statReceivesPoints } from './extractor'
import {
  OFFICIAL_MULTIPLIERS,
  type CreatureContext,
  type PointStatKey,
  type ServerMultipliers,
  type Species,
} from './types'

/** Especie sintética con constantes redondas (los valores reales llegan en FASE 1 desde values.json). */
const TESTREX: Species = {
  id: 'testrex',
  name: 'TestRex',
  TBHM: 0.9,
  stats: {
    health: { B: 1000, Iw: 0.2, Id: 0.27, Ta: 500, Tm: 0 },
    stamina: { B: 400, Iw: 0.1, Id: 0.1, Ta: 0, Tm: 0 },
    oxygen: { B: 150, Iw: 0.1, Id: 0.1, Ta: 0, Tm: 0 },
    food: { B: 3000, Iw: 0.1, Id: 0.1, Ta: 0, Tm: 0 },
    weight: { B: 500, Iw: 0.04, Id: 0.04, Ta: 0, Tm: 0 },
    melee: { B: 100, Iw: 0.05, Id: 0.017, Ta: 5, Tm: 0.4 },
    speed: { B: 100, Iw: 0, Id: 0.01, Ta: 0, Tm: -0.15 },
    torpor: { B: 1500, Iw: 0.06, Id: 0, Ta: 0.5, Tm: 0 },
  },
}

const NO_MULT: ServerMultipliers = { IwM: {}, IdM: {}, TaM: {}, TmM: {}, IBM: 1 }
const WILD: CreatureContext = { tamed: false, bred: false, TE: 0, IB: 0 }
const TAMED = (TE: number): CreatureContext => ({ tamed: true, bred: false, TE, IB: 0 })
const BRED = (IB: number): CreatureContext => ({ tamed: true, bred: true, TE: 1, IB })

// LCG determinista para tests reproducibles
const lcg = (seed: number) => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32

describe('calcStat (fórmula forward)', () => {
  it('stat salvaje: V = B·(1+Lw·Iw)', () => {
    expect(calcStat('health', TESTREX.stats.health!, { Lw: 10, Ld: 0 }, WILD, NO_MULT, TESTREX.TBHM))
      .toBeCloseTo(1000 * (1 + 10 * 0.2), 6) // 3000
  })

  it('TBHM solo aplica a salud y solo domada', () => {
    const tamed = calcStat('health', TESTREX.stats.health!, { Lw: 0, Ld: 0 }, TAMED(0), NO_MULT, 0.9)
    expect(tamed).toBeCloseTo(1000 * 0.9 + 500, 6) // TBHM + Ta
    const wild = calcStat('health', TESTREX.stats.health!, { Lw: 0, Ld: 0 }, WILD, NO_MULT, 0.9)
    expect(wild).toBeCloseTo(1000, 6)
    const stam = calcStat('stamina', TESTREX.stats.stamina!, { Lw: 0, Ld: 0 }, TAMED(0), NO_MULT, 0.9)
    expect(stam).toBeCloseTo(400, 6) // TBHM no toca estamina
  })

  it('melee con TE: aplica Ta y Tm·TE, y niveles domésticos al final', () => {
    const v = calcStat('melee', TESTREX.stats.melee!, { Lw: 4, Ld: 2 }, TAMED(0.5), NO_MULT, 1)
    const expected = (100 * (1 + 4 * 0.05) + 5) * (1 + 0.5 * 0.4) * (1 + 2 * 0.017)
    expect(v).toBeCloseTo(expected, 6)
  })

  it('Tm negativo: TE no se aplica (factor fijo 1+Tm)', () => {
    const a = calcStat('speed', TESTREX.stats.speed!, { Lw: 0, Ld: 0 }, TAMED(0.1), NO_MULT, 1)
    const b = calcStat('speed', TESTREX.stats.speed!, { Lw: 0, Ld: 0 }, TAMED(0.9), NO_MULT, 1)
    expect(a).toBeCloseTo(b, 9)
    expect(a).toBeCloseTo(100 * (1 - 0.15), 6)
  })

  it('imprint: +20%·IB, pero nunca en estamina/oxígeno', () => {
    const hp = calcStat('health', TESTREX.stats.health!, { Lw: 0, Ld: 0 }, BRED(1), NO_MULT, 1)
    expect(hp).toBeCloseTo((1000 * 1.2 + 500) * 1, 6)
    const stam = calcStat('stamina', TESTREX.stats.stamina!, { Lw: 5, Ld: 0 }, BRED(1), NO_MULT, 1)
    expect(stam).toBeCloseTo(400 * 1.5, 6) // sin factor de imprint
  })

  it('nerf oficial: TaM reduce el Ta de salud (0.14)', () => {
    const v = calcStat('health', TESTREX.stats.health!, { Lw: 0, Ld: 0 }, TAMED(0), OFFICIAL_MULTIPLIERS, 1)
    expect(v).toBeCloseTo(1000 + 500 * 0.14, 6)
  })

  it('niveles bonus de tameo: floor(nivel·TE/2)', () => {
    expect(tameBonusLevels(150, 1)).toBe(75)
    expect(tameBonusLevels(150, 0.5)).toBe(37)
    expect(tameBonusLevels(149, 0.999)).toBe(74)
  })
})

describe('extractWildStat', () => {
  it('recupera Lw exacto desde el valor mostrado', () => {
    for (const Lw of [0, 7, 42, 120]) {
      const v = calcWildStat('health', TESTREX.stats.health!, Lw, NO_MULT)
      expect(extractWildStat('health', TESTREX, v, NO_MULT)).toBe(Lw)
    }
  })

  it('rechaza valores imposibles', () => {
    expect(extractWildStat('health', TESTREX, 1017, NO_MULT)).toBeNull() // entre niveles
  })
})

describe('solvePostTameStat / extractPostTame (inspector post-tame ⭐)', () => {
  it('round-trip: la combinación real siempre está entre las candidatas', () => {
    const rnd = lcg(42)
    const ctx = TAMED(0.8)
    for (let i = 0; i < 200; i++) {
      const key: PointStatKey = (['health', 'stamina', 'food', 'weight', 'melee'] as const)[Math.floor(rnd() * 5)]
      const Lw = Math.floor(rnd() * 60)
      const Ld = Math.floor(rnd() * 30)
      const v = calcStat(key, TESTREX.stats[key]!, { Lw, Ld }, ctx, NO_MULT, TESTREX.TBHM)
      const candidates = solvePostTameStat(key, TESTREX, v, ctx, NO_MULT)
      expect(candidates).toContainEqual({ Lw, Ld })
    }
  })

  it('con wildPoints/domPoints conocidos, reduce a la solución única', () => {
    const ctx = TAMED(1)
    const truth: Record<string, { Lw: number; Ld: number }> = {
      health: { Lw: 20, Ld: 5 },
      stamina: { Lw: 14, Ld: 0 },
      food: { Lw: 11, Ld: 0 },
      weight: { Lw: 18, Ld: 10 },
      melee: { Lw: 25, Ld: 12 },
    }
    const observed: Partial<Record<PointStatKey, number>> = {}
    for (const [k, s] of Object.entries(truth)) {
      observed[k as PointStatKey] = calcStat(k as PointStatKey, TESTREX.stats[k as PointStatKey]!, s, ctx, NO_MULT, TESTREX.TBHM)
    }
    const wildPoints = 20 + 14 + 11 + 18 + 25
    const domPoints = 5 + 0 + 0 + 10 + 12

    const res = extractPostTame({
      species: TESTREX, observed, ctx, mult: NO_MULT, wildPoints, domPoints,
    })
    expect(res.solutions.length).toBeGreaterThanOrEqual(1)
    expect(res.solutions).toContainEqual(expect.objectContaining(truth))
    if (res.solutions.length === 1) {
      for (const k of res.statsConsidered) expect(res.perStat[k]!.ambiguous).toBe(false)
    }
  })

  it('speed no entra en la extracción en ASA pero sí en ASE; health siempre', () => {
    expect(statReceivesPoints('speed', TESTREX, 'asa')).toBe(false)
    expect(statReceivesPoints('speed', TESTREX, 'ase')).toBe(true)
    expect(statReceivesPoints('health', TESTREX, 'asa')).toBe(true)
  })

  it('imprint al 100%: el extractor lo descuenta correctamente', () => {
    const ctx = BRED(1)
    const v = calcStat('health', TESTREX.stats.health!, { Lw: 30, Ld: 4 }, ctx, NO_MULT, TESTREX.TBHM)
    const candidates = solvePostTameStat('health', TESTREX, v, ctx, NO_MULT)
    expect(candidates).toContainEqual({ Lw: 30, Ld: 4 })
  })

  it('datos incompatibles ⇒ sin soluciones globales (aviso honesto, no respuesta inventada)', () => {
    const ctx = TAMED(1)
    const observed = { health: 12345.6 } // valor imposible para la especie
    const res = extractPostTame({ species: TESTREX, observed, ctx, mult: NO_MULT, wildPoints: 10 })
    expect(res.solutions).toHaveLength(0)
  })
})
