import { describe, expect, it } from 'vitest'
import { TAMING_PRESETS, calcTaming, calcTamingPlan, formatDuration, torporDepletionPS } from './taming'
import { WEAPONS, hitsToKnockout, wildTorpor } from './knockout'
import { findSpecies, getSpecies, getTamingFoods } from '../data'

describe('calcTaming — validado contra Dododex/ASB (Rex 150 oficial)', () => {
  const rex = findSpecies('Rex_Character_BP')!
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

  it('plan de una sola comida ≡ calcTaming', () => {
    const single = calcTaming(rex.taming!, kibble, 150)!
    const plan = calcTamingPlan(rex.taming!, [{ food: kibble, pieces: 999 }], 150)
    expect(plan.enough).toBe(true)
    expect(plan.used[0].pieces).toBe(single.pieces)
    expect(plan.te).toBeCloseTo(single.te, 9)
    expect(plan.seconds).toBe(single.seconds)
  })

  it('plan combinado: 10 kibble + resto carne cruda (TE intermedia, réplica de ASB)', () => {
    const plan = calcTamingPlan(
      rex.taming!,
      [
        { food: kibble, pieces: 10 },
        { food: rawMeat, pieces: 999 },
      ],
      150,
    )
    // 25950 − 10·1600 = 9950 → 50 piezas de carne (fa=200)
    expect(plan.enough).toBe(true)
    expect(plan.used).toEqual([
      { food: kibble, pieces: 10 },
      { food: rawMeat, pieces: 50 },
    ])
    expect(plan.te).toBeCloseTo(1 / (1 + 1.25 * (10 / 1600 + 50 / 200)), 6) // ≈ 0.757
    expect(plan.te).toBeGreaterThan(0.55) // mejor que solo carne
    expect(plan.te).toBeLessThan(0.987) // peor que solo kibble
  })

  it('plan insuficiente: avisa honestamente (enough=false, afinidad restante)', () => {
    const plan = calcTamingPlan(rex.taming!, [{ food: kibble, pieces: 5 }], 150)
    expect(plan.enough).toBe(false)
    expect(plan.affinityLeft).toBeCloseTo(25950 - 5 * 1600, 3)
    expect(plan.bonusLevels).toBe(0)
  })
})

describe('regresiones de bugs reportados (07-2026)', () => {
  it('Ankylo 150 con bayas ≈ 3h, no 473h (bug de clones STA con placeholder)', () => {
    const anky = getSpecies().find((s) => s.name === 'Ankylosaurus')!
    const foods = getTamingFoods('Ankylosaurus')!
    const berries = foods.find((f) => f.name === 'Berries')!
    const r = calcTaming(anky.taming!, berries, 150, {
      torporStat: { B: anky.stats.torpor!.B, Iw: anky.stats.torpor!.Iw },
    })!
    expect(r.seconds).toBeGreaterThan(8000) // > 2h13m
    expect(r.seconds).toBeLessThan(16000) // < 4h27m — jamás 473h
    expect(r.torpor).not.toBeNull() // tdps 0.3 real
  })

  it('Dodo 150 con bayas se doma en minutos, no horas', () => {
    const dodo = getSpecies().find((s) => s.name === 'Dodo')!
    const foods = getTamingFoods('Dodo')!
    const berries = foods.find((f) => f.name === 'Berries') ?? foods[foods.length - 1]
    const r = calcTaming(dodo.taming!, berries, 150)!
    expect(r.seconds).toBeGreaterThan(0)
    expect(r.seconds).toBeLessThan(1800) // < 30 min
  })

  it('sin kibbles "Augmented" (son de ARK Mobile/Homestead, no del juego estándar)', () => {
    expect(getTamingFoods('Rex')!.some((f) => f.name.includes('Augmented'))).toBe(false)
  })

  it('presets con las rates correctas (arkstatus jul-2026): Small Tribes ×2.5, Evento ×4.5', () => {
    const by = (id: string) => TAMING_PRESETS.find((p) => p.id === id)!
    expect(by('smalltribes').tsm).toBe(2.5)
    expect(by('event').tsm).toBe(4.5)
    expect(by('arkpocalypse').tsm).toBe(3)
    expect(by('conquest').tsm).toBe(5)
  })

  it('aberrantes con base eliminados; Alphas/bosses/Eerie fuera', () => {
    const names = getSpecies().map((s) => s.name)
    const aberrants = names.filter((n) => n.startsWith('Aberrant '))
    expect(aberrants).toEqual(['Aberrant Salmon']) // único sin base con ese nombre
    expect(names.some((n) => n.startsWith('Alpha '))).toBe(false)
    expect(names.some((n) => n.startsWith('Eerie '))).toBe(false)
  })

  it('breeding: Rex incuba 5h a 32-34°C y madura en ~3d21h (datos ASB)', () => {
    const rex = getSpecies().find((s) => s.name === 'Rex')!
    expect(rex.breeding).not.toBeNull()
    expect(rex.breeding!.incubation).toBeCloseTo(17998.56, 1)
    expect(rex.breeding!.maturation).toBeCloseTo(333333.333, 1)
    expect(rex.breeding!.eggTempMin).toBe(32)
    expect(rex.breeding!.eggTempMax).toBe(34)
    expect(rex.breeding!.gestation).toBe(0)
  })

  it('solo se muestra EL kibble adecuado: Rex→Exceptional, Ankylo→Regular (tier más bajo con afinidad completa)', () => {
    const rexKibbles = getTamingFoods('Rex')!.filter((f) => f.name.endsWith('Kibble'))
    expect(rexKibbles.map((k) => k.name)).toEqual(['Exceptional Kibble'])
    const ankyKibbles = getTamingFoods('Ankylosaurus')!.filter((f) => f.name.endsWith('Kibble'))
    expect(ankyKibbles.map((k) => k.name)).toEqual(['Regular Kibble'])
    expect(ankyKibbles[0].a).toBe(400)
  })
})

describe('knockout — validado contra Dododex (Rex 150: 98 flechas ballesta / 70 dardos / 35 shock)', () => {
  const rex = findSpecies('Rex_Character_BP')!
  const torpor = wildTorpor({ B: rex.stats.torpor!.B, Iw: rex.stats.torpor!.Iw }, 150)

  it('torpor total Rex 150 = 15.407', () => {
    expect(torpor).toBeCloseTo(15407, 0)
  })

  it('golpes al 100% por arma (números de Dododex)', () => {
    const by = (id: string) => WEAPONS.find((w) => w.id === id)!
    expect(hitsToKnockout(torpor, by('crossbow'))).toBe(98)
    expect(hitsToKnockout(torpor, by('dart'))).toBe(70)
    expect(hitsToKnockout(torpor, by('shockdart'))).toBe(35)
    expect(hitsToKnockout(torpor, by('bow'))).toBe(172)
  })

  it('la calidad del arma reduce golpes linealmente', () => {
    const crossbow = WEAPONS.find((w) => w.id === 'crossbow')!
    expect(hitsToKnockout(torpor, crossbow, 200)).toBe(49) // 200% daño → mitad
    expect(hitsToKnockout(torpor, crossbow, 150)).toBe(66)
  })
})
