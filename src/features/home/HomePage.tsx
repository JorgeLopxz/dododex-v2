import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSpecies, type SpeciesEntry } from '../../data'
import { STAT_META } from '../../ui/statMeta'
import type { StatKey } from '../../engine/types'
import { useFavorites } from '../../store/favorites'
import { IconStar } from '../../ui/icons'
import { CreatureImage } from '../../ui/GameImage'

const PREVIEW_STATS: StatKey[] = ['health', 'stamina', 'weight', 'melee']
const MAX_RESULTS = 30

/** Home = buscador. Sin búsqueda: SOLO favoritos. Al teclear: filtro en tiempo real. */
export function HomePage() {
  const [query, setQuery] = useState('')
  const { ids: favoriteIds } = useFavorites()

  const q = query.trim().toLowerCase()
  const results = useMemo(() => {
    if (!q) return null
    return getSpecies().filter((s) => s.name.toLowerCase().includes(q)).slice(0, MAX_RESULTS)
  }, [q])
  const favorites = useMemo(
    () => getSpecies().filter((s) => favoriteIds.includes(s.id)),
    [favoriteIds],
  )

  return (
    <section aria-label="Buscador de criaturas" className="mx-auto max-w-xl pt-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔎  Rex, Argentavis, Shadowmane…"
        autoComplete="off"
        autoFocus
        aria-label="Buscar criatura"
        className="input-field mb-5 py-3.5 text-lg"
      />

      {results ? (
        <>
          <ul className="grid gap-2.5">
            {results.map((s) => (
              <CreatureRow key={s.id} species={s} />
            ))}
          </ul>
          {results.length === 0 && (
            <p className="panel p-6 text-center text-bone-dim">Sin resultados para «{query}»</p>
          )}
          {results.length === MAX_RESULTS && (
            <p className="mt-4 text-center text-xs text-bone-faint">
              Mostrando {MAX_RESULTS} — afina la búsqueda para ver más
            </p>
          )}
        </>
      ) : favorites.length > 0 ? (
        <>
          <h2 className="display mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-bone-faint">
            <IconStar size={15} filled /> Favoritos
          </h2>
          <ul className="grid gap-2.5">
            {favorites.map((s) => (
              <CreatureRow key={s.id} species={s} />
            ))}
          </ul>
        </>
      ) : (
        <div className="panel p-8 text-center text-sm text-bone-dim">
          <p className="mb-2">
            Busca cualquiera de las <strong className="text-bone">{getSpecies().length}</strong> criaturas domables de ARK.
          </p>
          <p className="text-xs text-bone-faint">
            Marca tus habituales con la <IconStar size={13} filled /> y aparecerán aquí nada más abrir la app.
          </p>
        </div>
      )}
    </section>
  )
}

function CreatureRow({ species: s }: { species: SpeciesEntry }) {
  const { ids, toggle } = useFavorites()
  const isFav = ids.includes(s.id)
  return (
    <li className="panel panel-hover relative flex items-center">
      <Link
        to={`/criaturas/${encodeURIComponent(s.id)}`}
        className="flex min-w-0 flex-1 items-center gap-3 p-3.5"
      >
        <CreatureImage name={s.name} size={44} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{s.name}</span>
          <span className="mt-0.5 flex gap-3 text-[11px] text-bone-faint">
            {PREVIEW_STATS.map((k) => {
              const c = s.stats[k]
              if (!c || !s.displayed[k]) return null
              const meta = STAT_META[k]
              return (
                <span key={k} className="inline-flex items-center gap-1" title={meta.label}>
                  <span aria-hidden="true" style={{ color: meta.color }}>{meta.icon}</span>
                  <span className="sr-only">{meta.label}:</span>
                  <span className="tabular-nums">{meta.percent ? `${(c.B * 100).toFixed(0)}%` : c.B}</span>
                </span>
              )
            })}
          </span>
        </span>
      </Link>
      <button
        onClick={() => toggle(s.id)}
        aria-label={isFav ? `Quitar ${s.name} de favoritos` : `Añadir ${s.name} a favoritos`}
        aria-pressed={isFav}
        className={`grid size-11 shrink-0 place-items-center self-stretch transition-colors ${
          isFav ? 'text-warn' : 'text-bone-faint hover:text-bone-dim'
        }`}
      >
        <IconStar filled={isFav} />
      </button>
    </li>
  )
}
