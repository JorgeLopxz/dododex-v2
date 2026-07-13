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

/** Los tames que todo el mundo busca (ids verificados contra el dataset). */
const POPULAR_IDS = [
  'Rex_Character_BP',
  'Gigant_Character_BP',
  'Carcha_Character_BP',
  'Ptero_Character_BP',
  'Argent_Character_BP',
  'Griffin_Character_BP',
  'Maelizard_Character_BP',
  'FireLion_Character_BP',
  'RockDrake_Character_BP',
  'Wyvern_Character_BP_Ash',
  'Therizino_Character_BP',
  'Ankylo_Character_BP',
  'Doed_Character_BP',
  'Yutyrannus_Character_BP',
  'Desmodus_Character_BP',
  'Gigantoraptor_Character_BP',
  'Deinonychus_Character_BP',
  'Thylacoleo_Character_BP',
  'Quetz_Character_BP',
  'Shastasaurus_Character_BP',
]

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
  const popular = useMemo(
    () =>
      POPULAR_IDS.filter((id) => !favoriteIds.includes(id))
        .map((id) => getSpecies().find((s) => s.id === id))
        .filter((s) => s !== undefined),
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
      ) : (
        <div className="space-y-6">
          {favorites.length > 0 ? (
            <div>
              <h2 className="display mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-bone-faint">
                <IconStar size={15} filled /> Favoritos
              </h2>
              <ul className="grid gap-2.5">
                {favorites.map((s) => (
                  <CreatureRow key={s.id} species={s} />
                ))}
              </ul>
            </div>
          ) : (
            <p className="px-2 text-center text-xs text-bone-faint">
              Busca cualquiera de las <strong className="text-bone-dim">{getSpecies().length}</strong> criaturas domables —
              marca tus habituales con la estrella{' '}
              <span className="inline-flex translate-y-0.5 text-warn"><IconStar size={12} filled /></span>{' '}
              y aparecerán aquí las primeras.
            </p>
          )}
          {popular.length > 0 && (
            <div>
              <h2 className="display mb-3 text-sm font-semibold uppercase tracking-widest text-bone-faint">
                🔥 Populares
              </h2>
              <ul className="grid gap-2.5">
                {popular.map((s) => (
                  <CreatureRow key={s.id} species={s} />
                ))}
              </ul>
            </div>
          )}
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
