import {
  IMPRINT_EXCLUDED,
  type CreatureContext,
  type ServerMultipliers,
  type StatConstants,
  type StatKey,
  type StatState,
} from './types'

const m = (rec: Partial<Record<StatKey, number>>, key: StatKey) => rec[key] ?? 1

/**
 * Fórmula forward completa:
 * V = (B·(1+Lw·Iw·IwM)·TBHM·(1+IB·0.2·IBM) + Ta·TaM) · (1+TE·Tm·TmM) · (1+Ld·Id·IdM)
 *
 * Detalles fieles al juego (y a ARK Smart Breeding):
 * - TBHM solo aplica a salud y solo si está domada.
 * - Imprint solo si es criada, y nunca en estamina/oxígeno.
 * - Ta/Tm negativos NO escalan con los multiplicadores de servidor.
 * - Si Tm < 0, la TE no se aplica (el factor es 1+Tm directamente).
 */
export function calcStat(
  key: StatKey,
  c: StatConstants,
  s: StatState,
  ctx: CreatureContext,
  mult: ServerMultipliers,
  TBHM: number,
): number {
  let v = c.B * (1 + s.Lw * c.Iw * m(mult.IwM, key))

  if (ctx.tamed && key === 'health') v *= TBHM
  if (ctx.bred && !IMPRINT_EXCLUDED.has(key)) v *= 1 + ctx.IB * 0.2 * mult.IBM

  if (ctx.tamed) {
    v += c.Ta > 0 ? c.Ta * m(mult.TaM, key) : c.Ta
    if (c.Tm > 0) v *= 1 + ctx.TE * c.Tm * m(mult.TmM, key)
    else if (c.Tm < 0) v *= 1 + c.Tm
    v *= 1 + s.Ld * c.Id * m(mult.IdM, key)
  }

  return v
}

/** Valor de un stat salvaje (sin domar): V = B·(1+Lw·Iw·IwM) */
export function calcWildStat(key: StatKey, c: StatConstants, Lw: number, mult: ServerMultipliers): number {
  return c.B * (1 + Lw * c.Iw * m(mult.IwM, key))
}

/** Niveles bonus por efectividad de tameo: floor(nivelSalvaje · TE / 2) */
export function tameBonusLevels(wildLevel: number, TE: number): number {
  return Math.floor((wildLevel * TE) / 2)
}
