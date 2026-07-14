import { useEffect, useRef, useState } from 'react'
import type { MapPoint, SpawnRegion } from '../data/wikiMaps'

const wikiFileUrl = (file: string) =>
  `https://ark.wiki.gg/wiki/Special:FilePath/${encodeURIComponent(file.replace(/ /g, '_'))}`

const topoUrl = (map: string) => wikiFileUrl(`${map} Topographic Map.jpg`)

export interface MapLayer {
  color: string
  points?: MapPoint[]
  /** regiones; si traen `color` propio (escala de rareza) prevalece sobre el de la capa */
  regions?: (SpawnRegion & { color?: string })[]
}

const MIN_SCALE = 1
const MAX_SCALE = 8

interface View {
  scale: number
  tx: number
  ty: number
}

function clampView(scale: number, tx: number, ty: number, size: number): View {
  const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
  const min = size - size * s
  return { scale: s, tx: Math.min(0, Math.max(min, tx)), ty: Math.min(0, Math.max(min, ty)) }
}

/**
 * Tablero de mapa con zoom y desplazamiento: rueda (hacia el cursor), arrastre,
 * pellizco táctil, doble clic y botones. Fondo de ark.wiki.gg + capas en canvas.
 */
export function MapBoard({
  map,
  image,
  layers,
  status,
}: {
  map: string
  /** archivo de fondo exacto de la wiki (coincide con las coordenadas); si falta, topográfico */
  image?: string | null
  layers: MapLayer[]
  status: 'loading' | 'ok' | 'error'
}) {
  const boardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  /** 0 = imagen del dataset, 1 = topográfico, 2 = cuadrícula */
  const [imgAttempt, setImgAttempt] = useState(0)
  const [view, setView] = useState<View>({ scale: 1, tx: 0, ty: 0 })
  const pointers = useRef(new Map<number, { x: number; y: number }>())

  useEffect(() => setImgAttempt(image ? 0 : 1), [image, map])
  useEffect(() => setView({ scale: 1, tx: 0, ty: 0 }), [map])

  /* pintado de capas (no depende del zoom: el canvas se escala por CSS con el mapa) */
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    ctx.clearRect(0, 0, cv.width, cv.height)
    const W = cv.width
    const H = cv.height
    for (const layer of layers) {
      if (layer.regions?.length) {
        ctx.globalAlpha = 0.45
        for (const r of layer.regions) {
          ctx.fillStyle = r.color ?? layer.color
          const x = (Math.min(r.x1, r.x2) / 100) * W
          const y = (Math.min(r.y1, r.y2) / 100) * H
          const w = (Math.abs(r.x2 - r.x1) / 100) * W
          const h = (Math.abs(r.y2 - r.y1) / 100) * H
          ctx.fillRect(x, y, Math.max(w, 6), Math.max(h, 6))
        }
        ctx.globalAlpha = 1
      }
      if (layer.points?.length) {
        ctx.fillStyle = layer.color
        ctx.strokeStyle = 'rgba(0,0,0,0.8)'
        ctx.lineWidth = 1.5
        for (const p of layer.points) {
          ctx.beginPath()
          ctx.arc((p.x / 100) * W, (p.y / 100) * H, 5, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
        }
      }
    }
  }, [layers, map])

  /** zoom hacia un punto (coordenadas locales del tablero) */
  function zoomAt(px: number, py: number, factor: number) {
    setView((v) => {
      const size = boardRef.current?.clientWidth ?? 1
      const ns = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor))
      const cx = (px - v.tx) / v.scale
      const cy = (py - v.ty) / v.scale
      return clampView(ns, px - cx * ns, py - cy * ns, size)
    })
  }

  /* rueda: React registra wheel pasivo — hace falta listener propio para preventDefault */
  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-e.deltaY * 0.0016))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault()
    boardRef.current?.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
  }
  function onPointerMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    const pts = pointers.current
    if (pts.size === 1) {
      // arrastre
      const dx = e.clientX - prev.x
      const dy = e.clientY - prev.y
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      setView((v) => clampView(v.scale, v.tx + dx, v.ty + dy, boardRef.current?.clientWidth ?? 1))
    } else if (pts.size === 2) {
      // pellizco
      const [a, b] = [...pts.entries()]
      const other = a[0] === e.pointerId ? b[1] : a[1]
      const dPrev = Math.hypot(prev.x - other.x, prev.y - other.y)
      const dNew = Math.hypot(e.clientX - other.x, e.clientY - other.y)
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (dPrev > 0) {
        const rect = boardRef.current!.getBoundingClientRect()
        const midX = (e.clientX + other.x) / 2 - rect.left
        const midY = (e.clientY + other.y) / 2 - rect.top
        zoomAt(midX, midY, dNew / dPrev)
      }
    }
  }
  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId)
  }
  function onDoubleClick(e: React.MouseEvent) {
    const rect = boardRef.current!.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    if (view.scale > 1.1) setView({ scale: 1, tx: 0, ty: 0 })
    else zoomAt(px, py, 2.5)
  }

  const src = imgAttempt === 0 && image ? wikiFileUrl(image) : imgAttempt <= 1 ? topoUrl(map) : null

  return (
    <div className="panel overflow-hidden p-1.5">
      <div
        ref={boardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        role="application"
        aria-label={`Mapa de ${map} — arrastra para mover, rueda o pellizco para zoom`}
        className={`relative aspect-square w-full touch-none select-none overflow-hidden rounded ${
          view.scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
        }`}
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent 0 12.4%, rgba(239,228,205,0.07) 12.4% 12.5%), repeating-linear-gradient(90deg, transparent 0 12.4%, rgba(239,228,205,0.07) 12.4% 12.5%), #101a14',
        }}
      >
        {/* contenido zoomeable: mapa + capas comparten transform */}
        <div
          className="absolute inset-0"
          style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`, transformOrigin: '0 0' }}
        >
          {src && (
            <img
              key={src}
              src={src}
              alt={`Mapa de ${map}`}
              referrerPolicy="no-referrer"
              onError={() => setImgAttempt((a) => a + 1)}
              className="pointer-events-none absolute inset-0 size-full object-cover opacity-90"
              draggable={false}
            />
          )}
          <canvas
            ref={canvasRef}
            width={1000}
            height={1000}
            className="pointer-events-none absolute inset-0 size-full"
            aria-hidden="true"
          />
        </div>

        {/* controles de zoom */}
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              const s = (boardRef.current?.clientWidth ?? 2) / 2
              zoomAt(s, s, 1.6)
            }}
            aria-label="Acercar"
            className="grid size-8 place-items-center rounded border border-metal-dim bg-surface-0/80 text-lg leading-none text-bone hover:border-amber-deep"
          >＋</button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              const s = (boardRef.current?.clientWidth ?? 2) / 2
              zoomAt(s, s, 1 / 1.6)
            }}
            aria-label="Alejar"
            className="grid size-8 place-items-center rounded border border-metal-dim bg-surface-0/80 text-lg leading-none text-bone hover:border-amber-deep"
          >−</button>
          {view.scale > 1.05 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setView({ scale: 1, tx: 0, ty: 0 })
              }}
              aria-label="Restablecer zoom"
              className="grid size-8 place-items-center rounded border border-metal-dim bg-surface-0/80 text-sm leading-none text-bone hover:border-amber-deep"
            >⤢</button>
          )}
        </div>

        {status === 'loading' && (
          <p className="absolute inset-x-0 top-2 text-center text-xs text-bone-dim">Cargando datos…</p>
        )}
        {status === 'error' && (
          <p className="absolute inset-x-0 top-2 mx-auto max-w-xs rounded bg-surface-0/80 px-3 py-1.5 text-center text-xs text-warn">
            Sin datos para {map} (o sin conexión) — el mapa se muestra igualmente.
          </p>
        )}
      </div>
    </div>
  )
}

/** Pie legal común de los mapas. */
export function MapAttribution() {
  return (
    <p className="text-[11px] text-bone-faint">
      Mapa y localizaciones:{' '}
      <a href="https://ark.wiki.gg" target="_blank" rel="noreferrer" className="underline">ark.wiki.gg</a>{' '}
      (CC BY-NC-SA 3.0) — uso personal no comercial. Los datos se cachean en tu dispositivo 30 días.
    </p>
  )
}
