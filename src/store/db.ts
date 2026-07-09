/**
 * Persistencia local-first (IndexedDB vía Dexie). Sin cuentas, sin nube:
 * los datos son del usuario y se exportan/importan como JSON.
 */
import Dexie, { type EntityTable } from 'dexie'
import type { PointStatKey } from '../engine/types'

export interface SavedStat {
  /** Niveles salvajes (incluye bonus de tameo) */
  Lw: number
  /** Niveles gastados post-tame */
  Ld: number
  /** Valor observado in-game al guardar */
  value: number
}

export interface SavedDino {
  id?: number
  name: string
  speciesId: string
  speciesName: string
  sex?: 'M' | 'F'
  /** Nivel total actual */
  level: number
  TE: number
  IB: number
  stats: Partial<Record<PointStatKey, SavedStat>>
  notes?: string
  createdAt: number
}

export const db = new Dexie('dododex-v2') as Dexie & {
  dinos: EntityTable<SavedDino, 'id'>
}

db.version(1).stores({
  dinos: '++id, speciesId, name, version, createdAt',
})
// v2: fuera el índice "version" (la app es solo ASA); los dinos guardados se conservan
db.version(2).stores({
  dinos: '++id, speciesId, name, createdAt',
})

export async function exportLibrary(): Promise<string> {
  const dinos = await db.dinos.toArray()
  return JSON.stringify({ app: 'dododex-v2', schema: 1, exported: new Date().toISOString(), dinos }, null, 2)
}

export async function importLibrary(json: string): Promise<number> {
  const parsed = JSON.parse(json) as { app?: string; dinos?: SavedDino[] }
  if (parsed.app !== 'dododex-v2' || !Array.isArray(parsed.dinos)) {
    throw new Error('Archivo no reconocido: se esperaba un export de DODODEX V2')
  }
  const clean = parsed.dinos.map(({ id: _id, ...rest }) => rest)
  await db.dinos.bulkAdd(clean)
  return clean.length
}
