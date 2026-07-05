/**
 * Metadatos de presentación por stat: etiqueta + icono + color.
 * Regla de accesibilidad: el color NUNCA va solo (WCAG 1.4.1) — siempre icono + texto.
 */
import type { StatKey } from '../engine/types'

export interface StatMeta {
  label: string
  short: string
  icon: string
  /** var CSS del color Okabe-Ito */
  color: string
  /** ¿El juego lo muestra como porcentaje? (melee, speed) */
  percent: boolean
}

export const STAT_META: Record<StatKey, StatMeta> = {
  health: { label: 'Salud', short: 'SAL', icon: '❤', color: 'var(--color-stat-health)', percent: false },
  stamina: { label: 'Estamina', short: 'EST', icon: '⚡', color: 'var(--color-stat-stamina)', percent: false },
  oxygen: { label: 'Oxígeno', short: 'OXÍ', icon: '🫧', color: 'var(--color-stat-oxygen)', percent: false },
  food: { label: 'Comida', short: 'COM', icon: '🍖', color: 'var(--color-stat-food)', percent: false },
  weight: { label: 'Peso', short: 'PES', icon: '⚖', color: 'var(--color-stat-weight)', percent: false },
  melee: { label: 'Melee', short: 'MEL', icon: '⚔', color: 'var(--color-stat-melee)', percent: true },
  speed: { label: 'Velocidad', short: 'VEL', icon: '💨', color: 'var(--color-stat-speed)', percent: true },
  torpor: { label: 'Torpor', short: 'TOR', icon: '💤', color: 'var(--color-stat-torpor)', percent: false },
}
