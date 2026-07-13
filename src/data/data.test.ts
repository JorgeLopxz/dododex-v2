import { describe, expect, it } from 'vitest'
import { findSpecies, getSpecies } from './index'
import { calcStat, calcWildStat } from '../engine/statFormula'

const NO_MULT = { IwM: {}, IdM: {}, TaM: {}, TmM: {}, IBM: 1 }

describe('datos reales de especies ASA (criterio de salida)', () => {
  it('carga el dataset con cobertura completa y solo especies domables', () => {
    // tras la purga (misiones, eventos, bosses, Genesis sin liberar, no-domables): ~180 reales
    expect(getSpecies().length).toBeGreaterThan(150)
    expect(getSpecies().length).toBeLessThan(300)
    // sin duplicados de nombre
    const names = getSpecies().map((s) => s.name)
    expect(new Set(names).size).toBe(names.length)
    // principio: si no es tameable, no está en la base de datos
    expect(getSpecies().every((s) => s.taming.affinityNeeded0 > 0)).toBe(true)
    // fuera contenido no liberado en ASA y criaturas de evento
    expect(names.some((n) => /Shadowmane|^X-|^R-|Ghost|DodoRex|Coelacanth/.test(n))).toBe(false)
  })

  it('Rex coincide con la wiki (ark.wiki.gg/wiki/Rex)', () => {
    const rex = findSpecies('Rex_Character_BP')!
    expect(rex).toBeDefined()
    expect(rex.stats.health).toEqual({ B: 1100, Iw: 0.2, Id: 0.27, Ta: 0.5, Tm: 0 })
    expect(rex.TBHM).toBe(1)
    // wiki: Rex salvaje gana +220 HP por nivel salvaje (0.2 × 1100)
    expect(calcWildStat('health', rex.stats.health!, 1, NO_MULT)).toBeCloseTo(1320, 6)
    // wiki: peso base 500, +10/nivel salvaje (0.02 × 500)
    expect(calcWildStat('weight', rex.stats.weight!, 2, NO_MULT)).toBeCloseTo(520, 6)
  })

  it('melee es multiplicador (B=1) y con TE aplica el bonus de afinidad', () => {
    const rex = findSpecies('Rex_Character_BP')!
    const v = calcStat(
      'melee',
      rex.stats.melee!,
      { Lw: 0, Ld: 0 },
      { tamed: true, bred: false, TE: 1, IB: 0 },
      NO_MULT,
      rex.TBHM,
    )
    // (1 + 0.5) · (1 + 1·0.4) = 2.1 → 210% mostrado in-game (sin nerf oficial)
    expect(v).toBeCloseTo((1 + rex.stats.melee!.Ta) * (1 + rex.stats.melee!.Tm), 6)
  })
})
