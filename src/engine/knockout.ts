/**
 * Calculadora de noqueo: cuántos golpes/flechas/dardos según arma y calidad.
 * Torpor por golpe al 100% de daño — valores estándar del juego (crumplecorn/ASB).
 * Nota: no modela resistencias de torpor por especie ni multiplicador de headshot.
 */

export interface Weapon {
  id: string
  label: string
  /** torpor infligido por golpe con el arma al 100% */
  torporPerHit: number
  /** proyectil consumible mostrado en el resultado */
  ammo: string
  /** icono del proyectil (formato dododex media, verificado HTTP 200) */
  itemImage: string
  /** icono del arma en sí (verificado HTTP 200) */
  weaponImage: string
}

export const WEAPONS: Weapon[] = [
  { id: 'shockdart', label: 'Rifle + Shocking Dart', torporPerHit: 442.5, ammo: 'shocking darts', itemImage: 'Shocking Tranquilizer Dart', weaponImage: 'Longneck Rifle' },
  { id: 'dart', label: 'Rifle + Tranq Dart', torporPerHit: 221, ammo: 'dardos', itemImage: 'Tranquilizer Dart', weaponImage: 'Longneck Rifle' },
  { id: 'harpoon', label: 'Arpón + Tranq Spear Bolt', torporPerHit: 300, ammo: 'spear bolts', itemImage: 'Tranq Spear Bolt', weaponImage: 'Harpoon Launcher' },
  { id: 'crossbow', label: 'Ballesta + Tranq Arrow', torporPerHit: 157.5, ammo: 'flechas tranq', itemImage: 'Tranquilizer Arrow', weaponImage: 'Crossbow' },
  { id: 'bow', label: 'Arco + Tranq Arrow', torporPerHit: 90, ammo: 'flechas tranq', itemImage: 'Tranquilizer Arrow', weaponImage: 'Bow' },
  { id: 'slingshot', label: 'Tirachinas', torporPerHit: 23.8, ammo: 'piedras', itemImage: 'Slingshot', weaponImage: 'Slingshot' },
  { id: 'club', label: 'Garrote de madera', torporPerHit: 10, ammo: 'golpes', itemImage: 'Wooden Club', weaponImage: 'Wooden Club' },
]

/** Torpor total de una criatura salvaje a un nivel dado. */
export function wildTorpor(torporStat: { B: number; Iw: number }, level: number): number {
  return torporStat.B * (1 + torporStat.Iw * (level - 1))
}

/**
 * Golpes necesarios para noquear.
 * @param quality daño del arma en % (100 = primitiva; una ballesta 200% mete el doble de torpor)
 */
export function hitsToKnockout(totalTorpor: number, weapon: Weapon, quality = 100): number {
  const perHit = weapon.torporPerHit * (quality / 100)
  if (perHit <= 0) return Infinity
  return Math.ceil(totalTorpor / perHit)
}
