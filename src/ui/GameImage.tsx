import { useState } from 'react'

/**
 * Imágenes de criaturas/items (CDN de Dododex, uso personal) con fallback
 * elegante al monograma/emoji si la imagen no existe (variantes, mods…).
 */

/** slug de criatura: "Aberrant Megalosaurus (Aberrant)" → "aberrant-megalosaurus" */
export function creatureSlug(name: string): string {
  return name
    .replace(/\s*\(.*\)$/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

/** slug base sin prefijos de variante, para segundo intento */
export function baseCreatureSlug(name: string): string {
  return creatureSlug(name.replace(/\s*\(.*\)$/, '').replace(/^(Aberrant|Tek|Corrupted|R-|X-)\s*/i, ''))
}

/** Alias para nombres cuyo archivo difiere en el CDN (verificados por HTTP 200) */
const ITEM_ALIASES: Record<string, string> = {
  'Tranquilizer Arrow': 'Tranq Arrow',
}

export function itemImageUrl(itemName: string): string {
  // los kibbles "Augmented" (ASA) no tienen imagen propia → usar la del kibble base
  const resolved = (ITEM_ALIASES[itemName] ?? itemName).replace(/\bAugmented\s+/, '')
  return `https://www.dododex.com/media/item/${resolved.replace(/ /g, '_')}.png`
}

export function CreatureImage({ name, size = 44, className = '' }: { name: string; size?: number; className?: string }) {
  const [attempt, setAttempt] = useState(0)
  const slugs = [creatureSlug(name), baseCreatureSlug(name)]
  const initials = name.replace(/\(.*\)/, '').trim().slice(0, 2).toUpperCase()

  if (attempt >= slugs.length || slugs[attempt] === '') {
    return (
      <span
        aria-hidden="true"
        style={{ width: size, height: size }}
        className={`display inline-grid shrink-0 place-items-center align-middle rounded-xl bg-gradient-to-br from-surface-3 to-surface-2 text-sm font-bold text-amber ${className}`}
      >
        {initials}
      </span>
    )
  }
  return (
    <img
      src={`https://www.dododex.com/media/creature/${slugs[attempt]}.png`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setAttempt((a) => a + 1)}
      className={`shrink-0 rounded-xl bg-surface-2/60 object-contain p-0.5 ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

export function ItemImage({ name, size = 28, fallback = '🍖' }: { name: string; size?: number; fallback?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <span aria-hidden="true" style={{ width: size, height: size }} className="inline-grid shrink-0 place-items-center align-middle text-base">
        {fallback}
      </span>
    )
  }
  return (
    <img
      src={itemImageUrl(name)}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  )
}
