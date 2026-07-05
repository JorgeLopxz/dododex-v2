import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSpecies } from '../../data'
import { STAT_META } from '../../ui/statMeta'
import { useSettings } from '../../store/settings'
import type { StatKey } from '../../engine/types'

const PREVIEW_STATS: StatKey[] = ['health', 'weight', 'melee']

export function CreaturesPage() {
  const { version } = useSettings()
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const all = getSpecies(version)
    const q = query.trim().toLowerCase()
    const filtered = q ? all.filter((s) => s.name.toLowerCase().includes(q)) : all
    return filtered.slice(0, 60)
  }, [version, query])

  return (
    <section aria-label="Buscador de criaturas">
      <label htmlFor="search" className="mb-1 block text-sm font-medium text-bone-dim">
        Buscar criatura ({getSpecies(version).length} especies · {version})
      </label>
      <input
        id="search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rex, Argentavis, Shadowmane…"
        autoComplete="off"
        className="mb-4 w-full rounded-xl border border-surface-3 bg-surface-1 px-4 py-3 text-bone placeholder:text-bone-faint"
      />

      <ul className="grid gap-2">
        {results.map((s) => (
          <li key={s.id}>
            <Link
              to={`/inspector/${encodeURIComponent(s.id)}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-surface-1 px-4 py-3 hover:bg-surface-2"
            >
              <span className="font-semibold">{s.name}</span>
              <span className="flex shrink-0 gap-3 text-xs text-bone-dim">
                {PREVIEW_STATS.map((k) => {
                  const c = s.stats[k]
                  if (!c || !s.displayed[k]) return null
                  const meta = STAT_META[k]
                  return (
                    <span key={k} className="inline-flex items-center gap-1" title={meta.label}>
                      <span aria-hidden="true">{meta.icon}</span>
                      <span className="sr-only">{meta.label}:</span>
                      <span className="tabular-nums">{meta.percent ? `${(c.B * 100).toFixed(0)}%` : c.B}</span>
                    </span>
                  )
                })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {results.length === 60 && (
        <p className="mt-3 text-center text-xs text-bone-faint">Mostrando 60 primeras — afina la búsqueda</p>
      )}
    </section>
  )
}
