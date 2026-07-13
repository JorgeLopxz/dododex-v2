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

/**
 * Mapa de aparición de la criatura: regiones de spawn reales (datos Purlovia
 * vía ark.wiki.gg) pintadas como zonas calientes según frecuencia.
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
        layers={regions?.length ? [{ color: '#ef6c2e', regions }] : []}
        status={status}
      />
      <p className="text-[11px] text-bone-faint">
        Zonas más opacas = contenedores de spawn más frecuentes. Cuevas y zonas especiales pueden no reflejarse.
      </p>
      <MapAttribution />
    </div>
  )
}
