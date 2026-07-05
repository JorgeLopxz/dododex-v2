/**
 * FASE 1 — Pipeline de datos de especies.
 * Descarga (si falta) values.json (ASE) y ASA-values.json de ARK Smart Breeding (MIT, © 2015 cadon)
 * y genera src/data/species-{ase,asa}.json en formato compacto:
 *   [id, nombre, tbhm, displayedStats, [statsx8 (null | [B,Iw,Id,Ta,Tm])]]
 * Orden de stats propio: health, stamina, oxygen, food, weight, melee, speed, torpor.
 * Uso: node scripts/build-data.mjs [--offline]
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'

const RAW_DIR = 'data-raw'
const OUT_DIR = 'src/data'
const BASE = 'https://raw.githubusercontent.com/cadon/ARKStatsExtractor/master/ARKBreedingStats/json/values'
const FILES = { ase: 'values.json', asa: 'ASA-values.json' }

// fullStatsRaw de ASB usa 12 índices; mapeamos a nuestros 8
// ASB: 0 Health, 1 Stamina, 2 Torpidity, 3 Oxygen, 4 Food, 5 Water, 6 Temp, 7 Weight, 8 Melee, 9 Speed, 10 Fort, 11 Craft
const ASB_INDEX = { health: 0, stamina: 1, oxygen: 3, food: 4, weight: 7, melee: 8, speed: 9, torpor: 2 }
const OUR_ORDER = ['health', 'stamina', 'oxygen', 'food', 'weight', 'melee', 'speed', 'torpor']

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
  for (const sp of raw.species) {
    // ASA-values.json es un overlay: si la especie no trae stats, hereda de la base ASE (match por blueprint)
    const bpKey = (sp.blueprintPath ?? sp.name).split('/').pop().split('.').pop().replace(/["']/g, '')
    if (!sp.fullStatsRaw) {
      const inherited = fallbackStatsByBp.get(bpKey)
      if (!inherited) continue
      sp.fullStatsRaw = inherited.fullStatsRaw
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
    const baseName = sp.name ?? id
    const name = sp.variants?.length ? `${baseName} (${sp.variants.join(', ')})` : baseName
    out.push([id, name, tbhm, ds, stats])
  }
  console.log(`${label}: ${out.length} especies`)
  return { version: raw.version, source: 'cadon/ARKStatsExtractor (MIT)', generated: new Date().toISOString(), species: out }
}

const aseRaw = await ensureRaw(FILES.ase)
const ase = transform(aseRaw, 'ASE')
const aseByBp = new Map(
  aseRaw.species
    .filter((sp) => sp.fullStatsRaw)
    .map((sp) => [
      (sp.blueprintPath ?? sp.name).split('/').pop().split('.').pop().replace(/["']/g, ''),
      { fullStatsRaw: sp.fullStatsRaw, TBHM: sp.TamedBaseHealthMultiplier ?? 1, ds: sp.displayedStats ?? 0 },
    ]),
)
const asa = transform(await ensureRaw(FILES.asa), 'ASA', aseByBp)
writeFileSync(`${OUT_DIR}/species-ase.json`, JSON.stringify(ase))
writeFileSync(`${OUT_DIR}/species-asa.json`, JSON.stringify(asa))
console.log(`OK → ${OUT_DIR}/species-{ase,asa}.json (v ASE ${ase.version} / ASA ${asa.version})`)
