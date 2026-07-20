import { useEffect, useState } from 'react'

/**
 * Imágenes de criaturas/items. Fuente principal: ark.wiki.gg (Special:FilePath,
 * miniaturas por ?width — CC BY-NC-SA, coherente con los mapas). Fallback:
 * CDN de Dododex (a veces bloqueado por su Cloudflare) y por último
 * monograma/emoji. Los nombres de ASB coinciden con los archivos de la wiki.
 *
 * Presentación "lámina de archivo": marco de tinta + tono sepia (.icon-frame
 * en index.css); al pasar el ratón o en fila activa se ve a todo color.
 */

const wikiFile = (name: string, width: number) =>
  `https://ark.wiki.gg/wiki/Special:FilePath/${encodeURIComponent(name.replace(/ /g, '_'))}.png?width=${width}`

/** Nombres cuyo slug en el CDN de Dododex no coincide con el de ASB */
const CREATURE_ALIASES: Record<string, string> = {
  Therizinosaur: 'therizinosaurus',
  'Blood Crystal Wyvern': 'crystal-wyvern',
  'Ember Crystal Wyvern': 'crystal-wyvern',
  'Tropical Crystal Wyvern': 'crystal-wyvern',
  'Ice Wyvern': 'wyvern',
  'Fire Wyvern': 'wyvern',
  'Lightning Wyvern': 'wyvern',
  'Poison Wyvern': 'wyvern',
}

/** slug de criatura para Dododex: "Tek Rex" → "tek-rex" */
export function creatureSlug(name: string): string {
  const clean = name.replace(/\s*\(.*\)$/, '').trim()
  if (CREATURE_ALIASES[clean]) return CREATURE_ALIASES[clean]
  return clean
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

const cleanName = (name: string) => name.replace(/\s*\(.*\)$/, '').trim()
const baseName = (name: string) => cleanName(name).replace(/^(Astral|Lost|Aberrant|Tek|Corrupted|X-|R-)\s*/i, '')

/** Alias para items cuyo archivo difiere */
const ITEM_ALIASES: Record<string, string> = {
  'Tranquilizer Arrow': 'Tranq Arrow',
}

export function itemImageUrl(itemName: string): string {
  const resolved = (ITEM_ALIASES[itemName] ?? itemName).replace(/\bAugmented\s+/, '')
  return wikiFile(resolved, 64)
}

function ImageChain({
  urls,
  size,
  className,
  fallback,
}: {
  urls: string[]
  size: number
  className: string
  fallback: React.ReactNode
}) {
  const [attempt, setAttempt] = useState(0)
  useEffect(() => setAttempt(0), [urls[0]])
  if (attempt >= urls.length) return <>{fallback}</>
  return (
    <img
      key={urls[attempt]}
      src={urls[attempt]}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setAttempt((a) => a + 1)}
      className={className}
      style={{ width: size, height: size }}
    />
  )
}

export function CreatureImage({ name, size = 44, className = '' }: { name: string; size?: number; className?: string }) {
  const clean = cleanName(name)
  const base = baseName(name)
  const urls = [
    wikiFile(clean, 112),
    ...(base !== clean ? [wikiFile(base, 112)] : []),
    `https://www.dododex.com/media/creature/${creatureSlug(name)}.png`,
  ]
  const initials = clean.slice(0, 2).toUpperCase()
  return (
    <ImageChain
      urls={urls}
      size={size}
      className={`icon-frame shrink-0 object-contain p-0.5 ${className}`}
      fallback={
        <span
          aria-hidden="true"
          style={{ width: size, height: size }}
          className={`display icon-frame inline-grid shrink-0 place-items-center align-middle text-sm font-bold text-amber ${className}`}
        >
          {initials}
        </span>
      }
    />
  )
}

export function ItemImage({ name, size = 28, fallback = '🍖' }: { name: string; size?: number; fallback?: string }) {
  const resolved = (ITEM_ALIASES[name] ?? name).replace(/\bAugmented\s+/, '')
  const urls = [
    wikiFile(resolved, 64),
    `https://www.dododex.com/media/item/${resolved.replace(/ /g, '_')}.png`,
  ]
  return (
    <ImageChain
      urls={urls}
      size={size}
      className="icon-frame inline-block shrink-0 object-contain p-px align-middle"
      fallback={
        <span aria-hidden="true" style={{ width: size, height: size }} className="inline-grid shrink-0 place-items-center align-middle text-base">
          {fallback}
        </span>
      }
    />
  )
}
