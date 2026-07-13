import type { PointStatKey } from '../engine/types'
import { STAT_META } from './statMeta'

/**
 * Radar hexagonal de puntos por stat (estilo Dododex): muestra de un vistazo
 * en qué destaca el dino. Normalizado al stat más alto del propio dino.
 */
export function StatRadar({ values }: { values: { stat: PointStatKey; points: number }[] }) {
  if (values.length < 3) return null
  const size = 260
  const cx = size / 2
  const cy = size / 2
  const R = size / 2 - 38
  const max = Math.max(...values.map((v) => v.points), 1)
  const n = values.length

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2
  const px = (i: number, r: number) => cx + r * Math.cos(angle(i))
  const py = (i: number, r: number) => cy + r * Math.sin(angle(i))
  const ring = (frac: number) =>
    values.map((_, i) => `${px(i, R * frac).toFixed(1)},${py(i, R * frac).toFixed(1)}`).join(' ')
  const shape = values
    .map((v, i) => {
      const r = R * (v.points / max)
      return `${px(i, r).toFixed(1)},${py(i, r).toFixed(1)}`
    })
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto block w-full max-w-70"
      role="img"
      aria-label={`Radar de puntos: ${values.map((v) => `${STAT_META[v.stat].label} ${v.points}`).join(', ')}`}
    >
      {/* anillos de referencia */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={ring(f)} fill="none" stroke="var(--color-metal-dim)" strokeWidth={f === 1 ? 1.5 : 0.7} />
      ))}
      {/* ejes */}
      {values.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={px(i, R)} y2={py(i, R)} stroke="var(--color-metal-dim)" strokeWidth="0.7" />
      ))}
      {/* silueta del dino */}
      <polygon points={shape} fill="color-mix(in srgb, var(--color-amber) 30%, transparent)" stroke="var(--color-amber)" strokeWidth="2" strokeLinejoin="round" />
      {/* vértices + etiquetas */}
      {values.map((v, i) => {
        const meta = STAT_META[v.stat]
        const r = R * (v.points / max)
        const lx = px(i, R + 16)
        const ly = py(i, R + 16)
        const anchor = Math.abs(Math.cos(angle(i))) < 0.3 ? 'middle' : Math.cos(angle(i)) > 0 ? 'start' : 'end'
        return (
          <g key={v.stat}>
            <circle cx={px(i, r)} cy={py(i, r)} r="3" fill={meta.color} stroke="rgba(0,0,0,0.6)" />
            <text
              x={lx}
              y={ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="10"
              fontWeight="600"
              fill={meta.color}
              style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              {meta.short} {v.points}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
