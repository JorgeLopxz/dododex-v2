import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { liveQuery } from 'dexie'
import { db, exportLibrary, importLibrary, type SavedDino } from '../../store/db'
import { POINT_STATS, type PointStatKey } from '../../engine/types'
import { STAT_META } from '../../ui/statMeta'
import { StatBar } from '../../ui/StatBar'
import { IconScan } from '../../ui/icons'

type SortKey = 'createdAt' | PointStatKey

/** Biblioteca "Mis Dinos": lo que ni Dododex ni Wikily tienen. */
export function LibraryPage() {
  const [dinos, setDinos] = useState<SavedDino[]>([])
  const [sortBy, setSortBy] = useState<SortKey>('createdAt')
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const sub = liveQuery(() => db.dinos.toArray()).subscribe({ next: setDinos })
    return () => sub.unsubscribe()
  }, [])

  const sorted = [...dinos].sort((a, b) => {
    if (sortBy === 'createdAt') return b.createdAt - a.createdAt
    const pa = a.stats[sortBy] ? a.stats[sortBy]!.Lw + a.stats[sortBy]!.Ld : -1
    const pb = b.stats[sortBy] ? b.stats[sortBy]!.Lw + b.stats[sortBy]!.Ld : -1
    return pb - pa
  })

  async function onExport() {
    const json = await exportLibrary()
    const blob = new Blob([json], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `mis-dinos-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function onImport(file: File) {
    try {
      const n = await importLibrary(await file.text())
      setMsg(`✓ ${n} dinos importados`)
    } catch (e) {
      setMsg(`✕ ${e instanceof Error ? e.message : 'Error al importar'}`)
    }
  }

  return (
    <section aria-label="Mis dinos guardados">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="display text-2xl font-bold">
          Mis Dinos <span className="text-base font-semibold text-bone-faint">({dinos.length})</span>
        </h2>
        <div className="flex gap-2">
          <button onClick={onExport} className="btn-ghost text-sm">
            ⬇ Exportar
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-ghost text-sm">
            ⬆ Importar
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            aria-hidden="true"
            onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
          />
        </div>
      </div>
      <p className="mb-4 text-sm text-bone-dim">Tu colección, con los puntos de cada stat al descubierto.</p>
      {msg && <p className="mb-3 text-sm text-bone-dim">{msg}</p>}

      {sorted.length > 0 && (
        <label className="mb-4 block text-sm">
          <span className="mb-1 block text-xs font-medium text-bone-dim">Ordenar por</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="input-field max-w-60">
            <option value="createdAt">Más recientes</option>
            {POINT_STATS.map((k) => (
              <option key={k} value={k}>
                Mejor {STAT_META[k].label} (puntos)
              </option>
            ))}
          </select>
        </label>
      )}

      {sorted.length === 0 ? (
        <div className="panel p-8 text-center">
          <p className="mb-4 text-bone-dim">
            Aún no hay dinos guardados.
            <br />
            Analiza tu primer tame con el Inspector. 🦖
          </p>
          <Link to="/inspector" className="btn-primary inline-flex items-center gap-2">
            <IconScan size={18} /> Abrir Inspector
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3">
          {sorted.map((d) => {
            const entries = POINT_STATS.filter((k) => d.stats[k])
            const max = Math.max(30, ...entries.map((k) => d.stats[k]!.Lw + d.stats[k]!.Ld)) * 1.15
            return (
              <li key={d.id} className="panel p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="display grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-surface-3 to-surface-2 text-sm font-bold text-amber"
                    >
                      {d.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <h3 className="display font-bold">{d.name}</h3>
                      <p className="text-xs text-bone-faint">
                        {d.speciesName} · Nv {d.level} · {d.version} · TE {(d.TE * 100).toFixed(0)}%
                        {d.IB > 0 && ` · Imprint ${(d.IB * 100).toFixed(0)}%`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => db.dinos.delete(d.id!)}
                    aria-label={`Eliminar ${d.name}`}
                    className="rounded-lg px-2 py-1 text-bone-faint transition-colors hover:bg-surface-2 hover:text-danger"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-x-6">
                  {entries.map((k) => (
                    <StatBar key={k} stat={k} wild={d.stats[k]!.Lw} dom={d.stats[k]!.Ld} max={max} />
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
