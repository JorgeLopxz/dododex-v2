import { useEffect, useRef, useState } from 'react'
import type { MapPoint, SpawnRegion } from '../data/wikiMaps'

const wikiFileUrl = (file: string) =>
  `https://ark.wiki.gg/wiki/Special:FilePath/${encodeURIComponent(file.replace(/ /g, '_'))}`

const topoUrl = (map: string) => wikiFileUrl(`${map} Topographic Map.jpg`)

export interface MapLayer {
  color: string
  points?: MapPoint[]
  regions?: SpawnRegion[]
}

/**
 * Tablero de mapa: fondo de ark.wiki.gg + capas (puntos y/o regiones) en canvas
 * (1000×1000 interno escalado por CSS — miles de marcas sin coste DOM).
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  /** 0 = imagen del dataset, 1 = topográfico, 2 = cuadrícula */
  const [imgAttempt, setImgAttempt] = useState(0)

  useEffect(() => setImgAttempt(image ? 0 : 1), [image, map])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    ctx.clearRect(0, 0, cv.width, cv.height)
    const W = cv.width
    const H = cv.height
    for (const layer of layers) {
      // regiones (heatmap): alpha según frecuencia relativa del contenedor
      if (layer.regions?.length) {
        const maxF = Math.max(...layer.regions.map((r) => r.f), 1)
        for (const r of layer.regions) {
          const alpha = 0.16 + 0.42 * Math.min(1, r.f / maxF)
          ctx.fillStyle = layer.color
          ctx.globalAlpha = alpha
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

  const src = imgAttempt === 0 && image ? wikiFileUrl(image) : imgAttempt <= 1 ? topoUrl(map) : null

  return (
    <div className="panel overflow-hidden p-1.5">
      <div
        className="relative aspect-square w-full overflow-hidden rounded"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent 0 12.4%, rgba(239,228,205,0.07) 12.4% 12.5%), repeating-linear-gradient(90deg, transparent 0 12.4%, rgba(239,228,205,0.07) 12.4% 12.5%), #101a14',
        }}
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
