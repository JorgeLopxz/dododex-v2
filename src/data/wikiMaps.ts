/**
 * Datos de mapas de ark.wiki.gg (CC BY-NC-SA 3.0 — uso no comercial con atribución).
 * Se descargan bajo demanda vía la API de MediaWiki (CORS con origin=*) y se
 * cachean en localStorage (30 días) + memoria para no golpear la wiki.
 *
 * Fuentes verificadas:
 *  - Recursos:  "Data:Maps/Resources/<Mapa>/ASA"  (fallback sin /ASA = datos ASE)
 *  - Spawns:    "Data:Spawn Map/<Mapa>/ASA"       (formato Purlovia, fallback ídem)
 */

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

/** Mapas liberados en ASA (única fuente para selectores). */
export const ASA_MAPS = [
  'The Island',
  'Scorched Earth',
  'The Center',
  'Aberration',
  'Extinction',
  'Ragnarok',
  'Valguero',
  'Astraeos',
] as const

const API = 'https://ark.wiki.gg/api.php'
const CACHE_PREFIX = 'dododex-v2-wiki:'
const CACHE_DAYS = 30
const memCache = new Map<string, unknown>()

async function fetchRawPage(title: string): Promise<string | null> {
  const key = CACHE_PREFIX + title
  try {
    const cached = localStorage.getItem(key)
    if (cached) {
      const { t, body } = JSON.parse(cached)
      if (Date.now() - t < CACHE_DAYS * 86400_000) return body
    }
  } catch {
    /* caché corrupta → refetch */
  }
  const url = `${API}?action=query&prop=revisions&rvprop=content&rvslots=main&formatversion=2&format=json&origin=*&titles=${encodeURIComponent(title)}`
  let body: string | undefined
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    body = json?.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content
  } catch {
    return null
  }
  if (!body) return null
  try {
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), body }))
  } catch {
    /* storage lleno: seguimos con caché en memoria */
  }
  return body
}

/* ——— Recursos ——— */

export interface ResourceMapData {
  /** Nombre de archivo del mapa de fondo en la wiki (coincide con las coordenadas) */
  image: string | null
  /** id de grupo (p.ej. "metal tier-5", "oil-vein") → puntos */
  groups: Record<string, MapPoint[]>
}

export async function loadResourceMap(mapName: string): Promise<ResourceMapData | null> {
  const memKey = `res:${mapName}`
  if (memCache.has(memKey)) return memCache.get(memKey) as ResourceMapData | null
  const body =
    (await fetchRawPage(`Data:Maps/Resources/${mapName}/ASA`)) ??
    (await fetchRawPage(`Data:Maps/Resources/${mapName}`))
  let out: ResourceMapData | null = null
  if (body) {
    try {
      const data = JSON.parse(body)
      const groups: Record<string, MapPoint[]> = {}
      for (const [group, list] of Object.entries<{ x?: number; y?: number }[]>(data.markers ?? {})) {
        groups[group.toLowerCase()] = list
          .map((m) => ({ x: m.x ?? -1, y: m.y ?? -1 }))
          .filter((p) => p.x >= 0 && p.y >= 0)
      }
      const bg = data.background
      out = { image: typeof bg === 'string' ? bg : (bg?.image ?? null), groups }
    } catch {
      out = null
    }
  }
  memCache.set(memKey, out)
  return out
}

/** ids base de grupo de la wiki por recurso nuestro ("metal" cubre "metal tier-5" y "metal-rich"). */
export const RESOURCE_GROUP_ALIASES: Record<string, string[]> = {
  metal: ['metal', 'metal-rich'],
  cristal: ['crystal'],
  obsidiana: ['obsidian'],
  petroleo: ['oil', 'oil-vein', 'oil-rock'],
  perlas: ['silica', 'silica-pearls', 'pearls'],
  'perlas-negras': ['black-pearls'],
  miel: ['beehive', 'giant-bee-hive', 'honey'],
  azufre: ['sulfur'],
  sal: ['salt', 'raw-salt'],
  gemas: ['gems', 'gem', 'blue-gems', 'green-gems', 'red-gems'],
  seda: ['silk'],
  elemento: ['element-node', 'element-vein', 'charge-node'],
}

/** Puntos de un recurso: agrega todos los grupos cuyo id base coincide con un alias. */
export function resourcePoints(data: ResourceMapData, resId: string): MapPoint[] {
  const aliases = RESOURCE_GROUP_ALIASES[resId] ?? [resId]
  const out: MapPoint[] = []
  for (const [group, pts] of Object.entries(data.groups)) {
    const base = group.split(' ')[0]
    if (aliases.some((a) => base === a || base.startsWith(`${a}-`))) out.push(...pts)
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

export async function loadSpawnData(mapName: string): Promise<SpawnContainer[] | null> {
  const memKey = `spawn:${mapName}`
  if (memCache.has(memKey)) return memCache.get(memKey) as SpawnContainer[] | null
  const body =
    (await fetchRawPage(`Data:Spawn Map/${mapName}/ASA`)) ??
    (await fetchRawPage(`Data:Spawn Map/${mapName}`))
  let out: SpawnContainer[] | null = null
  if (body) {
    try {
      const data = JSON.parse(body)
      out = Array.isArray(data) ? data : null
    } catch {
      out = null
    }
  }
  memCache.set(memKey, out)
  return out
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
