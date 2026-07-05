import { useEffect, useRef, useState } from 'react'
import { liveQuery } from 'dexie'
import { db, exportLibrary, importLibrary, type SavedDino } from '../../store/db'
import { POINT_STATS, type PointStatKey } from '../../engine/types'
import { STAT_META } from '../../ui/statMeta'
import { StatChip } from '../../ui/StatChip'

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
      setMsg(`❌ ${e instanceof Error ? e.message : 'Error al importar'}`)
    }
  }

  return (
    <section aria-label="Mis dinos guardados">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Mis Dinos ({dinos.length})</h2>
        <div className="flex gap-2">
          <button onClick={onExport} className="rounded-lg bg-surface-2 px-3 py-2 text-sm font-medium hover:bg-surface-3">
            Exportar
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-lg bg-surface-2 px-3 py-2 text-sm font-medium hover:bg-surface-3"
          >
            Importar
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
      {msg && <p className="mb-3 text-sm text-bone-dim">{msg}</p>}

      <label className="mb-4 block text-sm">
        <span className="mb-1 block text-bone-dim">Ordenar por</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="rounded-lg border border-surface-3 bg-surface-1 px-3 py-2"
        >
          <option value="createdAt">Más recientes</option>
          {POINT_STATS.map((k) => (
            <option key={k} value={k}>
              Mejor {STAT_META[k].label} (puntos)
            </option>
          ))}
        </select>
      </label>

      {sorted.length === 0 ? (
        <p className="rounded-xl bg-surface-1 p-6 text-center text-bone-dim">
          Aún no hay dinos guardados. Usa el <strong>Inspector</strong> para extraer los stats de un tame y guardarlo
          aquí. 🦖
        </p>
      ) : (
        <ul className="grid gap-3">
          {sorted.map((d) => (
            <li key={d.id} className="rounded-xl bg-surface-1 p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold">{d.name}</h3>
                  <p className="text-xs text-bone-dim">
                    {d.speciesName} · Nv {d.level} · {d.version} · TE {(d.TE * 100).toFixed(0)}%
                    {d.IB > 0 && ` · Imprint ${(d.IB * 100).toFixed(0)}%`}
                  </p>
                </div>
                <button
                  onClick={() => db.dinos.delete(d.id!)}
                  aria-label={`Eliminar ${d.name}`}
                  className="rounded-lg px-2 py-1 text-bone-faint hover:bg-surface-2 hover:text-danger"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POINT_STATS.filter((k) => d.stats[k]).map((k) => (
                  <StatChip key={k} stat={k}>
                    {d.stats[k]!.Lw}
                    {d.stats[k]!.Ld > 0 && `+${d.stats[k]!.Ld}`}
                  </StatChip>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
