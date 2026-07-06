import type { StatKey } from '../engine/types'
import { STAT_META } from './statMeta'

/**
 * Barra de stat visual: segmento sólido = puntos salvajes, segmento claro = puntos del jugador.
 * Siempre con icono + etiqueta + números (el color nunca va solo — WCAG 1.4.1).
 */
export function StatBar({
  stat,
  wild,
  dom = 0,
  max = 60,
  ambiguous = false,
}: {
  stat: StatKey
  wild: number
  dom?: number
  /** escala del 100% de la barra (puntos) */
  max?: number
  ambiguous?: boolean
}) {
  const meta = STAT_META[stat]
  const wildPct = Math.min(100, (wild / max) * 100)
  const domPct = Math.min(100 - wildPct, (dom / max) * 100)

  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid size-7 shrink-0 place-items-center rounded-lg text-sm"
        style={{ background: `color-mix(in srgb, ${meta.color} 18%, transparent)`, color: meta.color }}
      >
        {meta.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="truncate text-xs font-medium text-bone-dim">{meta.label}</span>
          <span className="display shrink-0 text-sm font-semibold tabular-nums" style={{ color: meta.color }}>
            {wild}
            {dom > 0 && <span className="text-bone-dim"> +{dom}</span>}
            {ambiguous && <span className="text-warn"> ?</span>}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-3/70" role="presentation">
          <div className="flex h-full">
            <div
              className="h-full rounded-l-full"
              style={{
                width: `${wildPct}%`,
                background: `linear-gradient(90deg, color-mix(in srgb, ${meta.color} 65%, #000), ${meta.color})`,
                boxShadow: `0 0 8px color-mix(in srgb, ${meta.color} 45%, transparent)`,
              }}
            />
            {dom > 0 && (
              <div
                className="h-full"
                style={{
                  width: `${domPct}%`,
                  background: `repeating-linear-gradient(-55deg, color-mix(in srgb, ${meta.color} 80%, #fff) 0 4px, color-mix(in srgb, ${meta.color} 35%, transparent) 4px 8px)`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
