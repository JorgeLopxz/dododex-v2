import { describe, expect, it } from 'vitest'
import { calcTaming, formatDuration, torporDepletionPS } from './taming'
import { findSpecies, getTamingFoods } from '../data'

describe('calcTaming — validado contra Dododex/ASB (Rex 150 oficial)', () => {
  const rex = findSpecies('ASE', 'Rex_Character_BP')!
  const foods = getTamingFoods('Rex')!
  const kibble = foods.find((f) => f.name === 'Exceptional Kibble')!
  const rawMeat = foods.find((f) => f.name === 'Raw Meat')!

  it('tiene datos de tameo y dieta', () => {
    expect(rex.taming).not.toBeNull()
    expect(rex.taming!.affinityNeeded0).toBe(3450)
    expect(rex.taming!.affinityIncreasePL).toBe(150)
    expect(kibble).toBeDefined()
    expect(rawMeat).toEqual({ name: 'Raw Meat', f: 50, a: 50 })
  })

  it('kibble excepcional: 17 piezas, TE ≈ 98.7%, +74 niveles', () => {
    const r = calcTaming(rex.taming!, kibble, 150)!
    // afinidad = 3450 + 150·150 = 25950; por pieza = 400·4 = 1600 → 17 piezas
    expect(r.pieces).toBe(17)
    expect(r.te).toBeCloseTo(1 / (1 + 1.25 * (17 / 1600)), 6) // ≈ 0.9869
    expect(r.te).toBeGreaterThan(0.985)
    expect(r.bonusLevels).toBe(74)
    // tiempo ≈ 58 min (17·85.248 / (0.002314·180.0634))
    expect(r.seconds).toBeGreaterThan(3400)
    expect(r.seconds).toBeLessThan(3550)
  })

  it('carne cruda: 130 piezas, TE ≈ 55.2% (el clásico "usa kibble")', () => {
    const r = calcTaming(rex.taming!, rawMeat, 150)!
    expect(r.pieces).toBe(130)
    expect(r.te).toBeCloseTo(1 / 1.8125, 4) // 0.5517
    expect(r.bonusLevels).toBe(41)
  })

  it('TamingSpeedMultiplier reduce piezas y sube TE', () => {
    const x2 = calcTaming(rex.taming!, rawMeat, 150, { mults: { tamingSpeed: 2, foodDrain: 1, wildTorporDrain: 1 } })!
    expect(x2.pieces).toBe(65)
    expect(x2.te).toBeGreaterThan(0.7)
  })

  it('Sanguine Elixir reduce afinidad un 30%', () => {
    const r = calcTaming(rex.taming!, kibble, 150, { sanguineElixir: true })!
    expect(r.pieces).toBe(Math.ceil((25950 * 0.7) / 1600)) // 12
  })

  it('torpor: Rex calcula narcóticos (torpor total 15.407 a nv150); sin ps0 → null honesto', () => {
    const r = calcTaming(rex.taming!, rawMeat, 150, { torporStat: { B: 1550, Iw: 0.06 } })!
    expect(r.torpor).not.toBeNull()
    expect(r.torpor!.total).toBeCloseTo(1550 * (1 + 0.06 * 149), 0) // 15407
    expect(r.torpor!.narcotics).toBeGreaterThanOrEqual(0)
    expect(r.torpor!.bioToxins).toBeLessThanOrEqual(r.torpor!.narcotics)
    // fórmula de crumplecorn crece con el nivel
    expect(torporDepletionPS(0.3, 150)).toBeGreaterThan(0.3)
    // especie sin datos de torpor → null (nunca inventar)
    const synth = { ...rex.taming!, torporDepletionPS0: 0 }
    expect(calcTaming(synth, rawMeat, 150, { torporStat: { B: 1550, Iw: 0.06 } })!.torpor).toBeNull()
  })

  it('dieta ordenada por preferencia (kibble antes que carne)', () => {
    expect(foods.findIndex((f) => f.name.includes('Kibble'))).toBeLessThan(
      foods.findIndex((f) => f.name === 'Raw Meat'),
    )
  })

  it('variantes resuelven contra la especie base (Aberrant → base)', () => {
    expect(getTamingFoods('Aberrant Megalosaurus (Aberrant)')).not.toBeNull()
  })

  it('formatDuration legible', () => {
    expect(formatDuration(3479)).toBe('57m 59s')
    expect(formatDuration(7261)).toBe('2h 01m')
  })
})
