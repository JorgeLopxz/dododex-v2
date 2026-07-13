/**
 * Pipeline de datos de especies (solo ASA).
 * Descarga (si falta) ASA-values.json de ARK Smart Breeding (MIT, © 2015 cadon)
 * — y values.json (ASE) como base del overlay, porque ASA hereda stats de él —
 * y genera src/data/species-asa.json en formato compacto:
 *   [id, nombre, tbhm, displayedStats, [statsx8 (null | [B,Iw,Id,Ta,Tm])], taming[9], breeding[5]|null]
 * Orden de stats propio: health, stamina, oxygen, food, weight, melee, speed, torpor.
 * Solo se emiten especies DOMABLES (principio: si no es tameable, fuera de la base de datos).
 * Uso: node scripts/build-data.mjs [--offline]
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'

const RAW_DIR = 'data-raw'
const OUT_DIR = 'src/data'
const BASE = 'https://raw.githubusercontent.com/cadon/ARKStatsExtractor/master/ARKBreedingStats/json/values'
const BASE_JSON = 'https://raw.githubusercontent.com/cadon/ARKStatsExtractor/master/ARKBreedingStats/json'
const FILES = { ase: 'values.json', asa: 'ASA-values.json' }

// fullStatsRaw de ASB usa 12 índices; mapeamos a nuestros 8
// ASB: 0 Health, 1 Stamina, 2 Torpidity, 3 Oxygen, 4 Food, 5 Water, 6 Temp, 7 Weight, 8 Melee, 9 Speed, 10 Fort, 11 Craft
const ASB_INDEX = { health: 0, stamina: 1, oxygen: 3, food: 4, weight: 7, melee: 8, speed: 9, torpor: 2 }
const OUR_ORDER = ['health', 'stamina', 'oxygen', 'food', 'weight', 'melee', 'speed', 'torpor']

/**
 * BUGFIX tiempos absurdos (p.ej. Ankylo 473h): el values.json moderno de ASB trae
 * foodConsumption placeholder (0.01×0.05) en ~321 especies. La revisión v298 (jun-2021,
 * SHA fijado) aún tiene los datos reales (Ankylo 0.003156×176 → ~3h con bayas ✓,
 * Dodo 0.000868×2880 → ~96s ✓). Backfill desde ahí para las especies clásicas.
 */
const OLD_VALUES_URL =
  'https://raw.githubusercontent.com/cadon/ARKStatsExtractor/a7b0571214fd645930c1d65413a1fecf1e8ed978/ARKBreedingStats/json/values/values.json'
const isPlaceholderFc = (t) => t?.foodConsumptionBase === 0.01 && t?.foodConsumptionMult === 0.05

const offline = process.argv.includes('--offline')
mkdirSync(RAW_DIR, { recursive: true })
mkdirSync(OUT_DIR, { recursive: true })

async function ensureRaw(name) {
  const path = `${RAW_DIR}/${name}`
  if (!existsSync(path)) {
    if (offline) throw new Error(`Falta ${path} y estamos en --offline`)
    console.log(`Descargando ${name}…`)
    const res = await fetch(`${BASE}/${name}`)
    if (!res.ok) throw new Error(`HTTP ${res.status} al bajar ${name}`)
    writeFileSync(path, await res.text())
  }
  return JSON.parse(readFileSync(path, 'utf8'))
}

function transform(raw, label, fallbackStatsByBp = new Map()) {
  const seen = new Map()
  const out = []
  const isMission = (sp) => /Missions\/|Gauntlet|_STA\b|TameSTA|Summoned|_Retrieve/i.test(sp.blueprintPath ?? '')
  // Aberrantes: mismo dino con otro color → si existe la base, FUERA (petición del usuario).
  // Ojo: en el overlay ASA el nombre puede venir heredado de la base ASE → resolverlo en el prepass.
  const bpKeyOf = (sp) => (sp.blueprintPath ?? sp.name ?? '').split('/').pop().split('.').pop().replace(/["']/g, '')
  const nameOf = (sp) => sp.name ?? fallbackStatsByBp.get(bpKeyOf(sp))?.name
  const names = new Set(raw.species.filter((s) => !isMission(s)).map(nameOf).filter(Boolean))
  const isDupAberrant = (sp) => {
    const n = nameOf(sp)
    return n?.startsWith('Aberrant ') && names.has(n.slice(9))
  }
  // No domables: Alphas, bosses, esqueléticos, zombies, eerie (mobile), VR,
  // criaturas de evento (fantasmas, DodoRex, Bunny…) y unidades no-tame (drones, meks…)
  const UNTAMEABLE_NAME =
    /^(Alpha |Skeletal |Zombie |Eerie |Enraged |Malfunctioned |VR |Bone |Party |Bunny |Revenant |X-|R-)|(Corrupted|Ghost|DodoRex|Dodo Wyvern|Zomdodo|Murder Turkey|Insect Swarm|Diseased|Broodmother|Yeti|\bDrone\b|Defense Unit|Scout|Enforcer|^Mek$|Exo-Mek|Macrophage|Summoner|Forest Wyvern|Rubble Golem|Titan$|Titan Flock|Lamprey|Subterranean Reaper|Surface Reaper|Elemental Reaper|Reaper Queen|Minion|Tamed\))/
  // No domables reales que ASB trae con bloque de taming igualmente (peces, fauna ambiental…)
  const UNTAMEABLE_EXACT = new Set([
    'Nameless', 'Seeker', 'Coelacanth', 'Piranha', 'Sabertooth Salmon', 'Aberrant Salmon',
    'Ammonite', 'Cnidaria', 'Leech', 'Trilobite', 'Eurypterid', 'Deathworm',
    'Oil Jug Bug', 'Water Jug Bug', 'Titanomyrma Soldier',
    'Kraken', 'Iceworm Queen', 'Lava Elemental', 'Ice Elemental', 'Chalk Elemental',
    'Scrap Elemental', 'Neophyte', 'Cave Minotaur',
  ])
  // Tags de variante de ASB que marcan criaturas no obtenibles (van aparte del nombre)
  const UNTAMEABLE_VARIANT = /^(Minion|Boss|Corrupted|Tamed|Summoned)$/
  const UNTAMEABLE_BOSS = /Boss|Overseer|KingKaiju|MegaMek|Rockwell_Character|Dragon_Character|Gorilla_Character|Spider_Character|BossSpider|SpiderL|Manticore_Character|Moeder|MasterController|Minion/i
  // Contenido aún NO liberado en ASA (Genesis 1/2): fuera hasta que Wildcard lo publique
  const UNRELEASED_BP = /\/Genesis\/|\/Genesis2\/|\/Gen2\/|LionfishLion|Noglin|BrainSlug|MilkGlider|Maewing|SpaceDolphin|Astrodelphis|SpaceWhale|Astrocetus|Cherufe|Magmasaur|GiantTurtle|Megachelon|Shapeshifter|Ferox|TekStrider|Exosuit/i
  const isUntameable = (sp) => {
    const n = nameOf(sp) ?? ''
    return (
      UNTAMEABLE_NAME.test(n) ||
      UNTAMEABLE_EXACT.has(n.replace(/\s*\(.*\)$/, '').trim()) ||
      (sp.variants ?? []).some((v) => UNTAMEABLE_VARIANT.test(v)) ||
      UNTAMEABLE_BOSS.test(sp.blueprintPath ?? '') ||
      UNRELEASED_BP.test(sp.blueprintPath ?? '')
    )
  }
  for (const sp of raw.species) {
    // fuera clones de misión/evento (Genesis STA, Gauntlet, Summoned…): no son domables y
    // duplican nombres con datos placeholder (causa del bug "Ankylo 473h")
    if (isMission(sp)) continue
    if (isDupAberrant(sp)) continue
    if (isUntameable(sp)) continue
    // ASA-values.json es un overlay: cada campo ausente hereda de la base ASE (match por blueprint).
    // Ojo: hay especies con stats propios pero SIN nombre/taming (p.ej. Griffin) — heredar por campo.
    const bpKey = (sp.blueprintPath ?? sp.name).split('/').pop().split('.').pop().replace(/["']/g, '')
    const inherited = fallbackStatsByBp.get(bpKey)
    if (!sp.fullStatsRaw) {
      if (!inherited) continue
      sp.fullStatsRaw = inherited.fullStatsRaw
    }
    if (inherited) {
      sp.name ??= inherited.name
      sp.taming ??= inherited.taming
      sp.breeding ??= inherited.breeding
      sp.TamedBaseHealthMultiplier ??= inherited.TBHM
      sp.displayedStats ??= inherited.ds
    }
    // id estable: último segmento del blueprintPath; sufijo numérico si colisiona
    let id = (sp.blueprintPath ?? sp.name).split('/').pop().split('.').pop().replace(/["']/g, '')
    if (seen.has(id)) {
      const n = seen.get(id) + 1
      seen.set(id, n)
      id = `${id}~${n}`
    } else seen.set(id, 0)

    const stats = OUR_ORDER.map((key) => {
      const s = sp.fullStatsRaw[ASB_INDEX[key]]
      if (!s) return null
      const [B = 0, Iw = 0, Id = 0, Ta = 0, Tm = 0] = s
      return [B, Iw, Id, Ta, Tm]
    })
    const tbhm = sp.TamedBaseHealthMultiplier ?? 1
    const ds = sp.displayedStats ?? 0
    // datos de tameo (fórmulas verificadas en ASB Taming.cs):
    // [affinityNeeded0, affinityIncreasePL, ineffectiveness, foodConsBase, foodConsMult, torporDeplPS0, nonViolent, wakeAffinityMult, wakeFoodDeplMult]
    const t = sp.taming
    const taming = t && t.affinityNeeded0 > 0
      ? [t.affinityNeeded0, t.affinityIncreasePL ?? 0, t.tamingIneffectiveness ?? 0,
         t.foodConsumptionBase ?? 0, t.foodConsumptionMult ?? 0, t.torporDepletionPS0 ?? 0,
         t.nonViolent ? 1 : 0, t.wakeAffinityMult ?? 1, t.wakeFoodDeplMult ?? 1]
      : null
    // datos de cría: [incubación, gestación, maduración, tempMin, tempMax] (segundos/°C)
    const b = sp.breeding
    const breeding =
      b && (b.incubationTime > 0 || b.gestationTime > 0)
        ? [b.incubationTime ?? 0, b.gestationTime ?? 0, b.maturationTime ?? 0, b.eggTempMin ?? 0, b.eggTempMax ?? 0]
        : null
    if (!sp.name) continue // entradas internas (misiones, summoned, STA) sin nombre real
    if (!taming) continue // sin datos de tameo por afinidad ⇒ no domable ⇒ fuera
    const baseName = sp.name
    const extraVariants = (sp.variants ?? []).filter((v) => !baseName.toLowerCase().includes(v.toLowerCase()))
    const name = extraVariants.length ? `${baseName} (${extraVariants.join(', ')})` : baseName
    out.push([id, name, tbhm, ds, stats, taming, breeding])
  }
  // Un solo registro por nombre visible: las copias (arena de boss, variantes de mapa…)
  // comparten stats; nos quedamos con la de blueprint más corto (la base)
  const byName = new Map()
  for (const row of out) {
    const prev = byName.get(row[1])
    if (!prev || row[0].length < prev[0].length) byName.set(row[1], row)
  }
  const deduped = [...byName.values()]
  console.log(`${label}: ${deduped.length} especies (${out.length - deduped.length} duplicados de nombre fusionados)`)
  return { version: raw.version, source: 'cadon/ARKStatsExtractor (MIT)', generated: new Date().toISOString(), species: deduped }
}

const aseRaw = await ensureRaw(FILES.ase)

// ——— Backfill de taming desde v298 (datos reales de consumo/torpor) ———
{
  const oldPath = `${RAW_DIR}/values-old.json`
  if (!existsSync(oldPath)) {
    if (offline) throw new Error(`Falta ${oldPath} y estamos en --offline`)
    console.log('Descargando values.json v298 (backfill de taming)…')
    const res = await fetch(OLD_VALUES_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status} al bajar values-old`)
    writeFileSync(oldPath, await res.text())
  }
  const oldRaw = JSON.parse(readFileSync(oldPath, 'utf8'))
  const oldByBp = new Map(
    oldRaw.species
      .filter((sp) => sp.taming)
      .map((sp) => [(sp.blueprintPath ?? sp.name).split('/').pop().split('.').pop().replace(/["']/g, ''), sp.taming]),
  )
  let fcFixed = 0
  let tdpsFixed = 0
  for (const sp of aseRaw.species) {
    if (!sp.taming?.affinityNeeded0) continue
    const bpKey = (sp.blueprintPath ?? sp.name).split('/').pop().split('.').pop().replace(/["']/g, '')
    const old = oldByBp.get(bpKey)
    if (!old) continue
    if (isPlaceholderFc(sp.taming) && !isPlaceholderFc(old) && old.foodConsumptionMult > 0) {
      sp.taming.foodConsumptionBase = old.foodConsumptionBase
      sp.taming.foodConsumptionMult = old.foodConsumptionMult
      fcFixed++
    }
    if (!sp.taming.torporDepletionPS0 && old.torporDepletionPS0 > 0) {
      sp.taming.torporDepletionPS0 = old.torporDepletionPS0
      tdpsFixed++
    }
  }
  // las que siguen con placeholder no tienen dato fiable → 0 (la UI muestra "—", nunca 473h)
  let zeroed = 0
  for (const sp of aseRaw.species) {
    if (sp.taming && isPlaceholderFc(sp.taming)) {
      sp.taming.foodConsumptionBase = 0
      sp.taming.foodConsumptionMult = 0
      zeroed++
    }
  }
  console.log(`Backfill v298: ${fcFixed} consumos reales, ${tdpsFixed} torpor; ${zeroed} sin dato (tiempo oculto)`)
}

const aseByBp = new Map(
  aseRaw.species
    .filter((sp) => sp.fullStatsRaw)
    .map((sp) => [
      (sp.blueprintPath ?? sp.name).split('/').pop().split('.').pop().replace(/["']/g, ''),
      { fullStatsRaw: sp.fullStatsRaw, name: sp.name, TBHM: sp.TamedBaseHealthMultiplier ?? 1, ds: sp.displayedStats ?? 0, taming: sp.taming, breeding: sp.breeding },
    ]),
)
const asa = transform(await ensureRaw(FILES.asa), 'ASA', aseByBp)
writeFileSync(`${OUT_DIR}/species-asa.json`, JSON.stringify(asa))

// ——— Comidas de tameo (tamingFoodData.json de ASB: dietas por especie + valores f/a) ———
async function ensureRawJson(name) {
  const path = `${RAW_DIR}/${name}`
  if (!existsSync(path)) {
    if (offline) throw new Error(`Falta ${path} y estamos en --offline`)
    console.log(`Descargando ${name}…`)
    const res = await fetch(`${BASE_JSON}/${name}`)
    if (!res.ok) throw new Error(`HTTP ${res.status} al bajar ${name}`)
    writeFileSync(path, await res.text())
  }
  return JSON.parse(readFileSync(path, 'utf8'))
}
const tfd = await ensureRawJson('tamingFoodData.json')
const defaults = tfd.tamingFoodData.default.specialFoodValues
const perSpecies = {}
for (const [name, entry] of Object.entries(tfd.tamingFoodData)) {
  if (name === 'default' || !entry.eats) continue
  perSpecies[name] = { eats: entry.eats, overrides: entry.specialFoodValues ?? {} }
}
writeFileSync(
  `${OUT_DIR}/taming-foods.json`,
  JSON.stringify({ version: tfd.version, source: 'cadon/ARKStatsExtractor (MIT)', foods: defaults, perSpecies }),
)
console.log(`OK → ${OUT_DIR}/species-asa.json (v ${asa.version}) + taming-foods.json (${Object.keys(perSpecies).length} especies)`)
