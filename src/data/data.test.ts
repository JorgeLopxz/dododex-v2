import { describe, expect, it } from 'vitest'
import { findSpecies, getSpecies } from './index'
import { calcStat, calcWildStat } from '../engine/statFormula'

const NO_MULT = { IwM: {}, IdM: {}, TaM: {}, TmM: {}, IBM: 1 }

describe('FASE 1 — datos reales de especies (criterio de salida)', () => {
  it('carga ambas versiones con cobertura completa (sin clones de misión/STA)', () => {
    // ~450 clones de misión (Genesis STA, Gauntlet, Summoned) se filtran en build-data
    expect(getSpecies('ASE').length).toBeGreaterThan(380)
    expect(getSpecies('ASA').length).toBeGreaterThan(380)
    // sin duplicados trampa: un único Ankylosaurus
    expect(getSpecies('ASE').filter((s) => s.name === 'Ankylosaurus')).toHaveLength(1)
  })

  it('Rex ASE coincide con la wiki (ark.wiki.gg/wiki/Rex)', () => {
    const rex = findSpecies('ASE', 'Rex_Character_BP')!
    expect(rex).toBeDefined()
    expect(rex.stats.health).toEqual({ B: 1100, Iw: 0.2, Id: 0.27, Ta: 0.5, Tm: 0 })
    expect(rex.TBHM).toBe(1)
    // wiki: Rex salvaje gana +220 HP por nivel salvaje (0.2 × 1100)
    expect(calcWildStat('health', rex.stats.health!, 1, NO_MULT)).toBeCloseTo(1320, 6)
    // wiki: peso base 500, +10/nivel salvaje (0.02 × 500)
    expect(calcWildStat('weight', rex.stats.weight!, 2, NO_MULT)).toBeCloseTo(520, 6)
  })

  it('Rex ASA existe (heredado del overlay) y speed no se muestra como subible', () => {
    const rex = findSpecies('ASA', 'Rex_Character_BP')!
    expect(rex).toBeDefined()
    expect(rex.stats.health?.B).toBe(1100)
  })

  it('melee es multiplicador (B=1) y con TE aplica el bonus de afinidad', () => {
    const rex = findSpecies('ASE', 'Rex_Character_BP')!
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
