import { describe, expect, it } from 'vitest'
import { findSpecies } from './index'
import { calcStat } from '../engine/statFormula'
import { extractPostTame } from '../engine/extractor'
import { OFFICIAL_MULTIPLIERS, type PointStatKey } from '../engine/types'

/**
 * ⭐ Test de integración del flujo completo del Inspector:
 * Rex ASA real + multiplicadores oficiales + valores REDONDEADOS
 * exactamente como los muestra el juego (0.1; melee % con 1 decimal).
 */
describe('Integración — Inspector post-tame con Rex real', () => {
  it('recupera los puntos exactos desde valores mostrados in-game', () => {
    const rex = findSpecies('Rex_Character_BP')!
    const ctx = { tamed: true, bred: false, TE: 0.995, IB: 0 }
    const truth: Partial<Record<PointStatKey, { Lw: number; Ld: number }>> = {
      health: { Lw: 22, Ld: 7 },
      stamina: { Lw: 18, Ld: 0 },
      oxygen: { Lw: 15, Ld: 0 },
      food: { Lw: 20, Ld: 0 },
      weight: { Lw: 17, Ld: 3 },
      melee: { Lw: 28, Ld: 11 },
    }
    const observed: Partial<Record<PointStatKey, number>> = {}
    const precisions: Partial<Record<PointStatKey, number>> = {}
    for (const [k, s] of Object.entries(truth) as [PointStatKey, { Lw: number; Ld: number }][]) {
      const exact = calcStat(k, rex.stats[k]!, s, ctx, OFFICIAL_MULTIPLIERS, rex.TBHM)
      const prec = k === 'melee' ? 0.001 : 0.1
      observed[k] = Math.round(exact / prec) * prec // como lo muestra el juego
      precisions[k] = prec
    }
    const wildPoints = 22 + 18 + 15 + 20 + 17 + 28
    const domPoints = 7 + 3 + 11

    const res = extractPostTame({
      species: rex,
      observed,
      ctx,
      mult: OFFICIAL_MULTIPLIERS,
      wildPoints,
      domPoints,
      displayPrecisionPerStat: precisions,
    })
    expect(res.solutions).toContainEqual(expect.objectContaining(truth))
  })
})
