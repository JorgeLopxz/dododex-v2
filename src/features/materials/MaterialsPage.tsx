import { useEffect, useState } from 'react'
import { ASA_MAPS, ASE_MAPS, loadResourceMap, mapImageFile, resourcePoints, type ResourceMapData } from '../../data/wikiMaps'
import { MapAttribution, MapBoard, type MapLayer } from '../../ui/MapBoard'
import { ItemImage } from '../../ui/GameImage'
import { useSettings } from '../../store/settings'

/** item = nombre del icono real del juego (CDN de Dododex); icon = fallback emoji */
const RESOURCES = [
  { id: 'metal', label: 'Metal', item: 'Metal', icon: '⛏️', color: '#c8d2dc' },
  { id: 'cristal', label: 'Cristal', item: 'Crystal', icon: '💎', color: '#8fe3f7' },
  { id: 'obsidiana', label: 'Obsidiana', item: 'Obsidian', icon: '🌑', color: '#b29aff' },
  { id: 'petroleo', label: 'Petróleo', item: 'Oil', icon: '🛢️', color: '#7fbc8c' },
  { id: 'perlas', label: 'Perlas', item: 'Silica Pearls', icon: '🦪', color: '#ffffff' },
  { id: 'perlas-negras', label: 'P. negras', item: 'Black Pearl', icon: '⚫', color: '#ff8fb6' },
  { id: 'miel', label: 'Miel', item: 'Giant Bee Honey', icon: '🍯', color: '#ffb547' },
  { id: 'savia', label: 'Savia', item: 'Sap', icon: '🌳', color: '#d9b06a' },
  { id: 'azufre', label: 'Azufre', item: 'Sulfur', icon: '🌋', color: '#e8dc4e' },
  { id: 'sal', label: 'Sal', item: 'Raw Salt', icon: '🧂', color: '#f0e6d8' },
  { id: 'gema-azul', label: 'G. azul', item: 'Blue Gem', icon: '🔷', color: '#5bb8ff' },
  { id: 'gema-verde', label: 'G. verde', item: 'Green Gem', icon: '💚', color: '#7dff9e' },
  { id: 'gema-roja', label: 'G. roja', item: 'Red Gem', icon: '🔻', color: '#ff6b6b' },
  { id: 'setas', label: 'Setas', item: 'Rare Mushroom', icon: '🍄', color: '#e09fd0' },
  { id: 'flor', label: 'Flor rara', item: 'Rare Flower', icon: '🌸', color: '#ffa3c2' },
  { id: 'cactus', label: 'Cactus', item: 'Cactus Sap', icon: '🌵', color: '#9adf7a' },
  { id: 'keratina', label: 'Keratina', item: 'Keratin', icon: '🦴', color: '#e6d7b8' },
  { id: 'seda', label: 'Seda', item: 'Silk', icon: '🕸️', color: '#e0c8ff' },
  { id: 'elemento', label: 'Elemento', item: 'Element', icon: '⚡', color: '#c084fc' },
  { id: 'gas', label: 'Gas', item: 'Congealed Gas Ball', icon: '💨', color: '#a8e6cf' },
  { id: 'agua', label: 'Agua', item: 'Water Jar', icon: '💧', color: '#6fc3ff' },
  { id: 'arcilla', label: 'Arcilla', item: 'Clay', icon: '🧱', color: '#d99a6c' },
  { id: 'polimero', label: 'Polímero o.', item: 'Organic Polymer', icon: '⚪', color: '#e8f0f2' },
  { id: 'verduras', label: 'Verduras', item: 'Rockarrot', icon: '🥕', color: '#ffb36b' },
  { id: 'plantas', label: 'Especie Y/R', item: 'Plant Species Y Seed', icon: '🌱', color: '#8ce68c' },
] as const

/**
 * Materiales: mapa de recursos real (datos de ark.wiki.gg).
 * Selecciona mapa + materiales y se pintan TODOS los puntos de spawn de cada uno.
 */
export function MaterialsPage() {
  const { gameVersion } = useSettings()
  const maps = gameVersion === 'asa' ? ASA_MAPS : ASE_MAPS
  const mapSet = new Set<string>(maps)
  const [map, setMap] = useState<string>(maps[0])
  const [active, setActive] = useState<Set<string>>(new Set(['metal']))
  const [data, setData] = useState<ResourceMapData | null>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    if (!mapSet.has(map)) setMap(maps[0])
  }, [gameVersion, map, mapSet, maps])

  useEffect(() => {
    let alive = true
    setStatus('loading')
    setData(null)
    loadResourceMap(map, gameVersion).then((d) => {
      if (!alive) return
      setData(d)
      setStatus(d ? 'ok' : 'error')
    })
    return () => {
      alive = false
    }
  }, [map, gameVersion])

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
            {maps.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Capas de recursos (multi-selección); solo se listan los que EXISTEN en este mapa */}
      <div role="group" aria-label="Recursos a mostrar" className="flex flex-wrap gap-1.5">
        {RESOURCES.filter((r) => status !== 'ok' || counts[r.id] > 0).map((r) => (
          <button
            key={r.id}
            onClick={() => toggle(r.id)}
            aria-pressed={active.has(r.id)}
            className="mode-tab flex flex-none items-center gap-1.5 px-2.5 text-xs"
            style={active.has(r.id) && counts[r.id] > 0 ? { borderColor: r.color, color: r.color } : undefined}
          >
            <ItemImage name={r.item} size={18} fallback={r.icon} /> {r.label}
            {counts[r.id] > 0 && <span className="opacity-70">({counts[r.id]})</span>}
          </button>
        ))}
      </div>

      <MapBoard map={map} image={mapImageFile(map, gameVersion)} layers={layers} status={status} />
      <MapAttribution />
    </section>
  )
}
