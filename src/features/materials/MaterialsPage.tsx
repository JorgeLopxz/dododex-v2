import { useRef, useState } from 'react'
import { useMarkers } from '../../store/markers'

/** Mapas de ASA con topográfico en ark.wiki.gg (hotlink en runtime, como los iconos de Dododex). */
const MAPS = [
  'The Island',
  'Scorched Earth',
  'The Center',
  'Aberration',
  'Extinction',
  'Ragnarok',
  'Valguero',
  'Astraeos',
] as const

const mapImageUrl = (map: string) =>
  `https://ark.wiki.gg/wiki/Special:FilePath/${map.replace(/ /g, '_')}_Topographic_Map.jpg`

/** Recursos marcables: emoji visible + color del punto (borde). */
const RESOURCES = [
  { id: 'metal', label: 'Metal', icon: '⛏️', color: '#b9c2cb' },
  { id: 'cristal', label: 'Cristal', icon: '💎', color: '#8fe3f7' },
  { id: 'obsidiana', label: 'Obsidiana', icon: '🌑', color: '#8d86a8' },
  { id: 'petroleo', label: 'Petróleo', icon: '🛢️', color: '#7fbc8c' },
  { id: 'perlas', label: 'Perlas', icon: '🦪', color: '#cfe8ff' },
  { id: 'perlas-negras', label: 'P. negras', icon: '⚫', color: '#e08fb6' },
  { id: 'miel', label: 'Miel', icon: '🍯', color: '#ffb547' },
  { id: 'azufre', label: 'Azufre', icon: '🌋', color: '#e8dc4e' },
] as const

/**
 * Materiales: tu propio mapa de recursos (estilo Wikily, pero con TUS puntos).
 * Elige mapa y recurso, toca el mapa para marcar; toca un marcador para quitarlo.
 * Todo persiste en el dispositivo.
 */
export function MaterialsPage() {
  const [map, setMap] = useState<string>(MAPS[0])
  const [active, setActive] = useState<string>(RESOURCES[0].id)
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({})
  const { markers, add, remove, clearMap } = useMarkers()
  const boardRef = useRef<HTMLDivElement>(null)

  const here = markers.filter((m) => m.map === map)
  const countByRes = (id: string) => here.filter((m) => m.res === id).length

  function onBoardClick(e: React.MouseEvent) {
    const rect = boardRef.current!.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    if (x < 0 || x > 100 || y < 0 || y > 100) return
    add({ map, res: active, x, y })
  }

  return (
    <section aria-label="Mapa de materiales" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="display text-2xl font-bold">Materiales</h2>
          <p className="text-sm text-bone-dim">Marca tus vetas y farmeos — se guardan en este dispositivo.</p>
        </div>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-bone-dim">Mapa</span>
          <select value={map} onChange={(e) => setMap(e.target.value)} className="input-field w-44">
            {MAPS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Paleta de recursos: el activo es el que se coloca al tocar el mapa */}
      <div role="group" aria-label="Recurso a marcar" className="flex flex-wrap gap-1.5">
        {RESOURCES.map((r) => (
          <button
            key={r.id}
            onClick={() => setActive(r.id)}
            aria-pressed={active === r.id}
            className="mode-tab flex-none px-2.5 text-xs"
            style={active === r.id ? { borderColor: r.color, color: r.color } : undefined}
          >
            {r.icon} {r.label}
            {countByRes(r.id) > 0 && <span className="ml-1 opacity-70">({countByRes(r.id)})</span>}
          </button>
        ))}
      </div>

      {/* Tablero: mapa topográfico + marcadores del usuario */}
      <div className="panel overflow-hidden p-1.5">
        <div
          ref={boardRef}
          onClick={onBoardClick}
          role="application"
          aria-label={`Mapa de ${map} — toca para marcar ${RESOURCES.find((r) => r.id === active)?.label}`}
          className="relative aspect-square w-full cursor-crosshair overflow-hidden rounded"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent 0 12.4%, rgba(239,228,205,0.07) 12.4% 12.5%), repeating-linear-gradient(90deg, transparent 0 12.4%, rgba(239,228,205,0.07) 12.4% 12.5%), #101a14',
          }}
        >
          {!imgFailed[map] && (
            <img
              src={mapImageUrl(map)}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setImgFailed((f) => ({ ...f, [map]: true }))}
              className="pointer-events-none absolute inset-0 size-full object-cover opacity-90"
              draggable={false}
            />
          )}
          {imgFailed[map] && (
            <p className="absolute inset-x-0 top-2 text-center text-xs text-bone-faint">
              (sin imagen del mapa — cuadrícula lat/lon)
            </p>
          )}
          {here.map((m) => {
            const r = RESOURCES.find((x) => x.id === m.res)
            return (
              <button
                key={m.id}
                onClick={(e) => {
                  e.stopPropagation()
                  remove(m.id)
                }}
                title={`${r?.label ?? m.res} — toca para quitar`}
                aria-label={`Quitar marcador de ${r?.label ?? m.res}`}
                className="absolute grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 bg-surface-0/85 text-sm leading-none shadow-lg transition-transform hover:scale-125"
                style={{ left: `${m.x}%`, top: `${m.y}%`, borderColor: r?.color ?? '#fff' }}
              >
                {r?.icon ?? '❓'}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-bone-faint">
        <span>
          {here.length === 0
            ? 'Toca el mapa para poner tu primer marcador.'
            : `${here.length} marcadores en ${map} · toca uno para quitarlo`}
        </span>
        {here.length > 0 && (
          <button
            onClick={() => window.confirm(`¿Quitar los ${here.length} marcadores de ${map}?`) && clearMap(map)}
            className="btn-ghost px-2.5 py-1 text-xs"
          >
            Vaciar mapa
          </button>
        )}
      </div>
    </section>
  )
}
