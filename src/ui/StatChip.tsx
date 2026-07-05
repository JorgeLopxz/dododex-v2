import type { StatKey } from '../engine/types'
import { STAT_META } from './statMeta'

/**
 * Chip de stat accesible: color Okabe-Ito + icono + etiqueta de texto.
 * El color nunca es el único portador de significado (WCAG 1.4.1).
 */
export function StatChip({ stat, children }: { stat: StatKey; children: React.ReactNode }) {
  const meta = STAT_META[stat]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-sm"
      style={{ borderLeft: `3px solid ${meta.color}` }}
    >
      <span aria-hidden="true">{meta.icon}</span>
      <span className="font-medium text-bone-dim">{meta.label}</span>
      <span className="font-semibold tabular-nums text-bone">{children}</span>
    </span>
  )
}
