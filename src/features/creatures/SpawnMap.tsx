import { useEffect, useState } from 'react'
import type { SpeciesEntry } from '../../data'
import {
  ASA_MAPS,
  loadResourceMap,
  loadSpawnData,
  spawnRegionsForCreature,
  type SpawnRegion,
} from '../../data/wikiMaps'
import { MapAttribution, MapBoard } from '../../ui/MapBoard'

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
  const [map, setMap] = useState<string>(ASA_MAPS[0])
  const [regions, setRegions] = useState<SpawnRegion[] | null>(null)
  const [image, setImage] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    let alive = true
    setStatus('loading')
    setRegions(null)
    Promise.all([loadSpawnData(map), loadResourceMap(map)]).then(([containers, res]) => {
      if (!alive) return
      setImage(res?.image ?? null)
      if (!containers) {
        setStatus('error')
        return
      }
      setRegions(spawnRegionsForCreature(containers, species.name))
      setStatus('ok')
    })
    return () => {
      alive = false
    }
  }, [map, species])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-bone-dim">Mapa</span>
          <select value={map} onChange={(e) => setMap(e.target.value)} className="input-field w-44">
            {ASA_MAPS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        {status === 'ok' && regions && (
          <p className="text-sm text-bone-dim">
            {regions.length > 0 ? (
              <>
                <strong className="display text-danger">{regions.length}</strong> zonas de aparición
              </>
            ) : (
              <span className="text-warn">No aparece salvaje en {map}</span>
            )}
          </p>
        )}
      </div>

      <MapBoard
        map={map}
        image={image}
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
