/**
 * Datos de mapas de ark.wiki.gg (CC BY-NC-SA 3.0 — uso no comercial con atribución).
 * Se generan en build desde la wiki y se consumen como JSON estático local,
 * así evitamos CORS y dependencias de red en runtime.
 */

import type { GameVersion } from '../store/settings'

export interface MapPoint {
  /** % 0-100 sobre el ancho del mapa */
  x: number
  /** % 0-100 sobre el alto del mapa */
  y: number
}

/** Región de aparición: cajas [lat/lon en %] con frecuencia del contenedor de spawn. */
export interface SpawnRegion {
  x1: number
  y1: number
  x2: number
  y2: number
  f: number
}

/** Mapas liberados en ASA con datos en la wiki (Astraeos aún no tiene páginas de datos). */
export const ASA_MAPS = [
  'The Island',
  'Scorched Earth',
  'The Center',
  'Aberration',
  'Extinction',
  'Ragnarok',
  'Valguero',
  'Lost Colony',
] as const

export const ASE_MAPS = [
  'The Island',
  'Scorched Earth',
  'The Center',
  'Aberration',
  'Extinction',
  'Ragnarok',
  'Valguero',
  'Crystal Isles',
  'Genesis: Part 1',
  'Genesis: Part 2',
  'Fjordur',
  'Lost Island',
] as const

/**
 * Archivo del mapa a COLOR limpio en la wiki (coincide con las coordenadas de los datos).
 * Hardcodeado y verificado (Special:FilePath) — no dependemos del campo `background`
 * del bake, que se pierde cuando la wiki nos rate-limita.
 * ASA: "<Mapa> map ASA.jpg". ASE: "<Mapa> Map.jpg". Casos especiales aparte.
 */
const MAP_IMAGE_OVERRIDES: Record<string, string> = {
  'asa:Lost Colony': 'Lost Colony Map ASA.jpg',
  'ase:Genesis: Part 1': 'Genesis Part 1 Map.jpg',
  'ase:Genesis: Part 2': 'Genesis Part 2 Map.jpg',
}

export function mapImageFile(mapName: string, version: GameVersion): string {
  const override = MAP_IMAGE_OVERRIDES[`${version}:${mapName}`]
  if (override) return override
  return version === 'asa' ? `${mapName} map ASA.jpg` : `${mapName} Map.jpg`
}

/* ——— Recursos ——— */

export interface ResourceMapData {
  /** id de grupo (p.ej. "metal tier-5", "oil-vein") → puntos */
  groups: Record<string, MapPoint[]>
}

interface WikiMapEntry {
  groups: Record<string, MapPoint[]>
  spawns: SpawnContainer[]
}

interface WikiMapFile {
  asa: Record<string, WikiMapEntry>
  ase: Record<string, WikiMapEntry>
}

/** El JSON de mapas pesa ~3MB: carga diferida (solo en Materiales / mapa de spawn) */
let wikiMapsPromise: Promise<WikiMapFile> | null = null
function loadWikiMaps(): Promise<WikiMapFile> {
  wikiMapsPromise ??= import('./wiki-maps.json').then((m) => (m.default ?? m) as WikiMapFile)
  return wikiMapsPromise
}

export async function loadResourceMap(mapName: string, version: GameVersion = 'asa'): Promise<ResourceMapData | null> {
  const maps = await loadWikiMaps()
  const entry = maps[version]?.[mapName]
  if (!entry) return null
  return { groups: entry.groups }
}

/**
 * Primer token del id de grupo → recurso nuestro. Los grupos vienen como
 * "metal", "metal cave", "metal tier-5", "gem-blue cave"… el primer token
 * (antes del espacio) es la clase; se compara EXACTO para no mezclar
 * "metal" con "metal-rich".
 */
export const RESOURCE_GROUP_ALIASES: Record<string, string[]> = {
  metal: ['metal'],
  'metal-rico': ['metal-rich'],
  cristal: ['crystal'],
  obsidiana: ['obsidian'],
  petroleo: ['oil', 'oil-rock', 'oil-vein'],
  perlas: ['silica', 'silica-pearls', 'pearls'],
  'perlas-negras': ['black-pearl'],
  azufre: ['sulfur'],
  sal: ['salt'],
  savia: ['sap'],
  'gema-azul': ['gem-blue'],
  'gema-verde': ['gem-green'],
  'gema-roja': ['gem-red'],
  setas: ['mushroom'],
  flor: ['rare-flower'],
  cactus: ['cactus'],
  keratina: ['keratin'],
  seda: ['silk'],
  elemento: ['element-ore', 'element-dust', 'element-node', 'element-vein', 'charge-node'],
  gas: ['gas-vein'],
  agua: ['water-vein'],
  arcilla: ['clay'],
  polimero: ['organic-polymer'],
  verduras: ['rockarrot', 'savoroot', 'longrass', 'citronal'],
  plantas: ['plant-y', 'plant-r', 'plant-z', 'plant-x'],
}

/** Puntos de un recurso: agrega todos los grupos cuyo primer token coincide con un alias. */
export function resourcePoints(data: ResourceMapData, resId: string): MapPoint[] {
  const aliases = RESOURCE_GROUP_ALIASES[resId] ?? [resId]
  const set = new Set(aliases)
  const out: MapPoint[] = []
  for (const [group, pts] of Object.entries(data.groups)) {
    if (set.has(group.split(' ')[0])) out.push(...pts)
  }
  return out
}

/* ——— Spawns de criaturas (formato Purlovia) ——— */

interface SpawnContainer {
  /** nombre interno del contenedor (DinoSpawnEntries_…) */
  n: string
  /** entradas: qué especies salen de este contenedor */
  e?: { n: string; c?: number; s?: { n: string; c?: number }[] }[]
  /** regiones: f = frecuencia, l = cajas [y1,x1,y2,x2] en % */
  s?: { f?: number; l?: number[][] }[]
}

export async function loadSpawnData(mapName: string, version: GameVersion = 'asa'): Promise<SpawnContainer[] | null> {
  const maps = await loadWikiMaps()
  return maps[version]?.[mapName]?.spawns ?? null
}

/** Regiones donde aparece la criatura (por nombre mostrado, insensible a mayúsculas). */
export function spawnRegionsForCreature(containers: SpawnContainer[], creatureName: string): SpawnRegion[] {
  const want = creatureName.replace(/\s*\(.*\)$/, '').trim().toLowerCase()
  const out: SpawnRegion[] = []
  for (const c of containers) {
    const hasCreature = (c.e ?? []).some((entry) =>
      (entry.s ?? []).some((sp) => (sp.n ?? '').toLowerCase() === want),
    )
    if (!hasCreature) continue
    for (const region of c.s ?? []) {
      for (const box of region.l ?? []) {
        const [y1, x1, y2, x2] = box
        if ([y1, x1, y2, x2].every((v) => typeof v === 'number')) {
          out.push({ x1, y1, x2, y2, f: region.f ?? 1 })
        }
      }
    }
  }
  return out
}
