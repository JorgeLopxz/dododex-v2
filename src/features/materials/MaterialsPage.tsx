import { useEffect, useState } from 'react'
import { ASA_MAPS, loadResourceMap, resourcePoints, type ResourceMapData } from '../../data/wikiMaps'
import { MapAttribution, MapBoard, type MapLayer } from '../../ui/MapBoard'

const RESOURCES = [
  { id: 'metal', label: 'Metal', icon: '⛏️', color: '#c8d2dc' },
  { id: 'cristal', label: 'Cristal', icon: '💎', color: '#8fe3f7' },
  { id: 'obsidiana', label: 'Obsidiana', icon: '🌑', color: '#b29aff' },
  { id: 'petroleo', label: 'Petróleo', icon: '🛢️', color: '#7fbc8c' },
  { id: 'perlas', label: 'Perlas', icon: '🦪', color: '#ffffff' },
  { id: 'perlas-negras', label: 'P. negras', icon: '⚫', color: '#ff8fb6' },
  { id: 'miel', label: 'Miel', icon: '🍯', color: '#ffb547' },
  { id: 'azufre', label: 'Azufre', icon: '🌋', color: '#e8dc4e' },
  { id: 'sal', label: 'Sal', icon: '🧂', color: '#f0e6d8' },
  { id: 'gemas', label: 'Gemas', icon: '💠', color: '#7dff9e' },
  { id: 'seda', label: 'Seda', icon: '🕸️', color: '#e0c8ff' },
  { id: 'elemento', label: 'Elemento', icon: '⚡', color: '#c084fc' },
] as const

/**
 * Materiales: mapa de recursos real (datos de ark.wiki.gg).
 * Selecciona mapa + materiales y se pintan TODOS los puntos de spawn de cada uno.
 */
export function MaterialsPage() {
  const [map, setMap] = useState<string>(ASA_MAPS[0])
  const [active, setActive] = useState<Set<string>>(new Set(['metal']))
  const [data, setData] = useState<ResourceMapData | null>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    let alive = true
    setStatus('loading')
    setData(null)
    loadResourceMap(map).then((d) => {
      if (!alive) return
      setData(d)
      setStatus(d ? 'ok' : 'error')
    })
    return () => {
      alive = false
    }
  }, [map])

  const counts: Record<string, number> = {}
  for (const r of RESOURCES) counts[r.id] = data ? resourcePoints(data, r.id).length : 0

  const layers: MapLayer[] = RESOURCES.filter((r) => active.has(r.id) && counts[r.id] > 0).map((r) => ({
    color: r.color,
    points: resourcePoints(data!, r.id),
  }))

  function toggle(id: string) {
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section aria-label="Mapa de materiales" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="display text-2xl font-bold">Materiales</h2>
          <p className="text-sm text-bone-dim">Todos los puntos de spawn de cada recurso, por mapa.</p>
        </div>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-bone-dim">Mapa</span>
          <select value={map} onChange={(e) => setMap(e.target.value)} className="input-field w-44">
            {ASA_MAPS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Capas de recursos (multi-selección); deshabilitado = sin datos en este mapa */}
      <div role="group" aria-label="Recursos a mostrar" className="flex flex-wrap gap-1.5">
        {RESOURCES.map((r) => (
          <button
            key={r.id}
            onClick={() => toggle(r.id)}
            aria-pressed={active.has(r.id)}
            disabled={status === 'ok' && counts[r.id] === 0}
            className="mode-tab flex-none px-2.5 text-xs disabled:opacity-35"
            style={active.has(r.id) && counts[r.id] > 0 ? { borderColor: r.color, color: r.color } : undefined}
          >
            {r.icon} {r.label}
            {counts[r.id] > 0 && <span className="ml-1 opacity-70">({counts[r.id]})</span>}
          </button>
        ))}
      </div>

      <MapBoard map={map} image={data?.image} layers={layers} status={status} />
      <MapAttribution />
    </section>
  )
}
