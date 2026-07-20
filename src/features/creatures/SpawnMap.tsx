import { useEffect, useState } from 'react'
import type { SpeciesEntry } from '../../data'
import {
  ASA_MAPS,
  ASE_MAPS,
  creatureHasAnySpawnData,
  loadSpawnData,
  mapImageFile,
  spawnRegionsForCreature,
  type SpawnRegion,
} from '../../data/wikiMaps'
import { MapAttribution, MapBoard } from '../../ui/MapBoard'
import { useSettings } from '../../store/settings'

/** Escala de probabilidad de spawn: verde = donde MÁS aparece, rojo = casi nunca. */
const PROB_SCALE = [
  { max: 0.2, color: '#ef4444', label: 'Muy rara' },
  { max: 0.4, color: '#f97316', label: 'Rara' },
  { max: 0.6, color: '#eab308', label: 'Media' },
  { max: 0.8, color: '#a3cc16', label: 'Alta' },
  { max: Infinity, color: '#22c55e', label: 'Muy alta' },
] as const

function probColor(ratio: number): string {
  return PROB_SCALE.find((s) => ratio <= s.max)!.color
}

/**
 * Mapa de aparición de la criatura: regiones de spawn reales (datos Purlovia
 * vía ark.wiki.gg), coloreadas de verde (poco probable) a rojo (muy probable).
 */
export function SpawnMap({ species }: { species: SpeciesEntry }) {
  const { gameVersion } = useSettings()
  const maps = gameVersion === 'asa' ? ASA_MAPS : ASE_MAPS
  const mapSet = new Set<string>(maps)
  const [map, setMap] = useState<string>(maps[0])
  const [regions, setRegions] = useState<SpawnRegion[] | null>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  /** ¿el mapa seleccionado tiene ALGÚN dato de spawn en la wiki? (Astraeos aún no) */
  const [mapHasData, setMapHasData] = useState(true)
  /** null = sin comprobar; true/false = la wiki tiene datos de esta criatura en algún mapa */
  const [hasAnyData, setHasAnyData] = useState<boolean | null>(null)

  useEffect(() => {
    if (!mapSet.has(map)) setMap(maps[0])
  }, [gameVersion, map, mapSet, maps])

  useEffect(() => {
    let alive = true
    setHasAnyData(null)
    creatureHasAnySpawnData(species.name, gameVersion).then((v) => alive && setHasAnyData(v))
    return () => {
      alive = false
    }
  }, [species, gameVersion])

  useEffect(() => {
    let alive = true
    setStatus('loading')
    setRegions(null)
    loadSpawnData(map, gameVersion).then((containers) => {
      if (!alive) return
      if (!containers) {
        setStatus('error')
        return
      }
      setMapHasData(containers.length > 0)
      setRegions(spawnRegionsForCreature(containers, species.name))
      setStatus('ok')
    })
    return () => {
      alive = false
    }
  }, [map, species, gameVersion])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm">
          <span className="mono mb-1 block text-[10px] uppercase text-bone-dim">Mapa</span>
          <select value={map} onChange={(e) => setMap(e.target.value)} className="input-field w-44">
            {maps.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        {status === 'ok' && regions && (
          <p className="text-sm text-bone-dim">
            {regions.length > 0 ? (
              <>
                <strong className="display text-amber">{regions.length}</strong> zonas de aparición
              </>
            ) : !mapHasData ? (
              <span className="italic text-bone-faint">Mapa sin datos aún</span>
            ) : hasAnyData === false ? (
              <span className="italic text-bone-faint">Sin datos de aparición en la wiki</span>
            ) : (
              <span className="text-warn">No aparece salvaje en {map}</span>
            )}
          </p>
        )}
      </div>

      {/* Mapa que la wiki aún no ha mapeado (Astraeos) */}
      {status === 'ok' && !mapHasData && (
        <p className="border border-surface-3 bg-surface-1/60 px-3 py-2 text-xs italic text-bone-dim">
          La wiki todavía no ha publicado datos de aparición de <strong className="not-italic text-bone">{map}</strong>. En
          cuanto los suban, se integran automáticamente.
        </p>
      )}

      {/* Criatura que la wiki aún no ha mapeado (nuevas de ASA como el Maeguana) */}
      {status === 'ok' && mapHasData && hasAnyData === false && (
        <p className="border border-surface-3 bg-surface-1/60 px-3 py-2 text-xs italic text-bone-dim">
          La wiki todavía no tiene datos de aparición de <strong className="not-italic text-bone">{species.name}</strong> en
          ningún mapa (habitual en criaturas nuevas de ASA). En cuanto los publiquen, se integran automáticamente.
        </p>
      )}

      <MapBoard
        map={map}
        image={mapImageFile(map, gameVersion)}
        layers={
          regions?.length
            ? (() => {
                const maxF = Math.max(...regions.map((r) => r.f), 0.0001)
                return [{ color: '#ef4444', regions: regions.map((r) => ({ ...r, color: probColor(r.f / maxF) })) }]
              })()
            : []
        }
        status={status}
      />
      {/* Leyenda de probabilidad (de más a menos spawn) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-bone-dim">
        <span className="text-bone-faint">Probabilidad:</span>
        {[...PROB_SCALE].reverse().map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
            {s.label}
          </span>
        ))}
      </div>
      <p className="text-[11px] text-bone-faint">
        Frecuencia relativa al punto más caliente de este mapa. Cuevas y zonas especiales pueden no reflejarse.
      </p>
      <MapAttribution />
    </div>
  )
}
