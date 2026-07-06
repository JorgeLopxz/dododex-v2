import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSpecies } from '../../data'
import { STAT_META } from '../../ui/statMeta'
import { useSettings } from '../../store/settings'
import type { StatKey } from '../../engine/types'
import { IconScan } from '../../ui/icons'

const PREVIEW_STATS: StatKey[] = ['health', 'stamina', 'weight', 'melee']

export function CreaturesPage() {
  const { version } = useSettings()
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const all = getSpecies(version)
    const q = query.trim().toLowerCase()
    const filtered = q ? all.filter((s) => s.name.toLowerCase().includes(q)) : all
    return filtered.slice(0, 48)
  }, [version, query])

  return (
    <section aria-label="Buscador de criaturas">
      <h2 className="display mb-1 text-2xl font-bold">Criaturas</h2>
      <p className="mb-4 text-sm text-bone-dim">
        {getSpecies(version).length} especies · datos {version}
      </p>
      <input
        id="search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔎  Rex, Argentavis, Shadowmane…"
        autoComplete="off"
        aria-label="Buscar criatura"
        className="input-field mb-5 py-3"
      />

      <ul className="grid gap-2.5 sm:grid-cols-2">
        {results.map((s) => {
          const initials = s.name.replace(/\(.*\)/, '').trim().slice(0, 2).toUpperCase()
          return (
            <li key={s.id}>
              <Link
                to={`/inspector/${encodeURIComponent(s.id)}`}
                className="panel panel-hover group flex items-center gap-3 p-3.5"
              >
                {/* Avatar monograma con gradiente ámbar */}
                <span
                  aria-hidden="true"
                  className="display grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-surface-3 to-surface-2 text-sm font-bold text-tek"
                >
                  {initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{s.name}</span>
                  <span className="mt-0.5 flex gap-3 text-[11px] text-bone-faint">
                    {PREVIEW_STATS.map((k) => {
                      const c = s.stats[k]
                      if (!c || !s.displayed[k]) return null
                      const meta = STAT_META[k]
                      return (
                        <span key={k} className="inline-flex items-center gap-1" title={meta.label}>
                          <span aria-hidden="true" style={{ color: meta.color }}>
                            {meta.icon}
                          </span>
                          <span className="sr-only">{meta.label}:</span>
                          <span className="tabular-nums">
                            {meta.percent ? `${(c.B * 100).toFixed(0)}%` : c.B}
                          </span>
                        </span>
                      )
                    })}
                  </span>
                </span>
                <span className="text-bone-faint opacity-0 transition-opacity group-hover:opacity-100">
                  <IconScan size={18} />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
      {results.length === 48 && (
        <p className="mt-4 text-center text-xs text-bone-faint">Mostrando 48 — afina la búsqueda para ver más</p>
      )}
      {results.length === 0 && (
        <p className="panel p-6 text-center text-bone-dim">Sin resultados para «{query}» en {version}</p>
      )}
    </section>
  )
}
