import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { extractPostTame, statReceivesPoints } from '../../engine/extractor'
import { OFFICIAL_MULTIPLIERS, POINT_STATS, type PointStatKey } from '../../engine/types'
import { findSpecies, getSpecies } from '../../data'
import { STAT_META } from '../../ui/statMeta'
import { StatChip } from '../../ui/StatChip'
import { useSettings } from '../../store/settings'
import { db } from '../../store/db'

/**
 * ⭐ Inspector post-tame: la función que Dododex no tiene.
 * Introduce los stats de tu dino YA DOMADO y descubre cuántos puntos
 * cayeron en cada stat (salvajes + gastados por ti).
 */
export function InspectorPage() {
  const { speciesId } = useParams()
  const navigate = useNavigate()
  const { version } = useSettings()

  const species = speciesId ? findSpecies(version, decodeURIComponent(speciesId)) : undefined

  const [bred, setBred] = useState(false)
  const [TE, setTE] = useState('100')
  const [IB, setIB] = useState('0')
  const [level, setLevel] = useState('')
  const [postTameLevel, setPostTameLevel] = useState('')
  const [values, setValues] = useState<Partial<Record<PointStatKey, string>>>({})
  const [locked, setLocked] = useState<Set<PointStatKey>>(new Set())
  const [dinoName, setDinoName] = useState('')
  const [saved, setSaved] = useState(false)

  const relevantStats = useMemo(
    () => (species ? POINT_STATS.filter((k) => statReceivesPoints(k, species, version) && species.displayed[k]) : []),
    [species, version],
  )

  const result = useMemo(() => {
    if (!species) return null
    const observed: Partial<Record<PointStatKey, number>> = {}
    const precisions: Partial<Record<PointStatKey, number>> = {}
    for (const k of relevantStats) {
      const raw = values[k]
      if (raw === undefined || raw.trim() === '') continue
      const n = Number(raw.replace(',', '.'))
      if (!Number.isFinite(n)) continue
      // melee/speed se muestran in-game como % → valor interno = n/100
      observed[k] = STAT_META[k].percent ? n / 100 : n
      precisions[k] = STAT_META[k].percent ? 0.001 : 0.1
    }
    if (Object.keys(observed).length === 0) return null

    const ptl = Number(postTameLevel)
    const lvl = Number(level)
    return extractPostTame({
      species,
      version,
      observed,
      ctx: { tamed: true, bred, TE: bred ? 1 : Number(TE) / 100, IB: Number(IB) / 100 },
      mult: OFFICIAL_MULTIPLIERS,
      wildPoints: Number.isFinite(ptl) && ptl > 0 ? ptl - 1 : undefined,
      domPoints: Number.isFinite(ptl) && ptl > 0 && Number.isFinite(lvl) && lvl >= ptl ? lvl - ptl : undefined,
      displayPrecisionPerStat: precisions,
      lockedLd0: [...locked],
    })
  }, [species, version, relevantStats, values, bred, TE, IB, level, postTameLevel, locked])

  async function saveDino() {
    if (!species || !result || result.solutions.length !== 1) return
    const sol = result.solutions[0]
    const stats: Record<string, { Lw: number; Ld: number; value: number }> = {}
    for (const k of result.statsConsidered) {
      const cand = sol[k]
      if (!cand) continue
      const raw = Number((values[k] ?? '0').replace(',', '.'))
      stats[k] = { ...cand, value: STAT_META[k].percent ? raw / 100 : raw }
    }
    await db.dinos.add({
      name: dinoName || `${species.name} sin nombre`,
      speciesId: species.id,
      speciesName: species.name,
      version,
      level: Number(level) || 0,
      TE: bred ? 1 : Number(TE) / 100,
      IB: Number(IB) / 100,
      stats,
      createdAt: Date.now(),
    })
    setSaved(true)
    setTimeout(() => navigate('/dinos'), 600)
  }

  if (!species) {
    return (
      <section>
        <h2 className="mb-2 text-xl font-bold">Inspector post-tame</h2>
        <p className="mb-4 text-bone-dim">Elige una especie para empezar:</p>
        <select
          aria-label="Especie"
          className="w-full rounded-xl border border-surface-3 bg-surface-1 px-4 py-3"
          defaultValue=""
          onChange={(e) => e.target.value && navigate(`/inspector/${encodeURIComponent(e.target.value)}`)}
        >
          <option value="" disabled>
            — especie —
          </option>
          {getSpecies(version).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </section>
    )
  }

  const uniqueSolution = result?.solutions.length === 1 ? result.solutions[0] : null

  return (
    <section aria-label={`Inspector de ${species.name}`}>
      <h2 className="mb-1 text-xl font-bold">{species.name}</h2>
      <p className="mb-4 text-sm text-bone-dim">
        Introduce los valores que ves in-game en tu dino <strong>ya domado</strong>. Te diré cuántos puntos cayeron en
        cada stat.
      </p>

      {/* Contexto del dino */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block text-bone-dim">Nivel actual</span>
          <input
            type="number"
            inputMode="numeric"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full rounded-lg border border-surface-3 bg-surface-1 px-3 py-2 tabular-nums"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-bone-dim">Nivel tras domar</span>
          <input
            type="number"
            inputMode="numeric"
            value={postTameLevel}
            onChange={(e) => setPostTameLevel(e.target.value)}
            placeholder="opcional"
            className="w-full rounded-lg border border-surface-3 bg-surface-1 px-3 py-2 tabular-nums"
          />
        </label>
        {!bred && (
          <label className="text-sm">
            <span className="mb-1 block text-bone-dim">Efectividad %</span>
            <input
              type="number"
              inputMode="decimal"
              value={TE}
              onChange={(e) => setTE(e.target.value)}
              className="w-full rounded-lg border border-surface-3 bg-surface-1 px-3 py-2 tabular-nums"
            />
          </label>
        )}
        <label className="text-sm">
          <span className="mb-1 block text-bone-dim">Imprint %</span>
          <input
            type="number"
            inputMode="decimal"
            value={IB}
            onChange={(e) => setIB(e.target.value)}
            className="w-full rounded-lg border border-surface-3 bg-surface-1 px-3 py-2 tabular-nums"
          />
        </label>
      </div>
      <label className="mb-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={bred} onChange={(e) => setBred(e.target.checked)} className="size-5" />
        Es un dino criado (bred) — TE se asume 100%
      </label>

      {/* Valores por stat */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {relevantStats.map((k) => {
          const meta = STAT_META[k]
          return (
            <label key={k} className="text-sm">
              <span className="mb-1 flex items-center gap-1.5 text-bone-dim">
                <span aria-hidden="true">{meta.icon}</span>
                {meta.label}
                {meta.percent && ' (%)'}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={values[k] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
                className="w-full rounded-lg border-2 bg-surface-1 px-3 py-2 tabular-nums"
                style={{ borderColor: values[k] ? meta.color : 'var(--color-surface-3)' }}
              />
              <label className="mt-1 flex items-center gap-1.5 text-xs text-bone-faint">
                <input
                  type="checkbox"
                  checked={locked.has(k)}
                  onChange={(e) =>
                    setLocked((prev) => {
                      const next = new Set(prev)
                      if (e.target.checked) next.add(k)
                      else next.delete(k)
                      return next
                    })
                  }
                  className="size-4"
                />
                nunca lo subí
              </label>
            </label>
          )
        })}
      </div>

      {/* Resultado */}
      {result && (
        <div className="rounded-xl bg-surface-1 p-4">
          <h3 className="mb-3 font-bold">
            {result.solutions.length === 1 && '✅ Solución única'}
            {result.solutions.length > 1 && `⚠️ ${result.solutions.length} combinaciones posibles`}
            {result.solutions.length === 0 && '❌ Sin solución con estos datos'}
          </h3>
          {result.solutions.length === 0 && (
            <p className="text-sm text-bone-dim">
              Revisa: ¿efectividad correcta? ¿multiplicadores del servidor? ¿valores bien copiados? Añadir el «nivel
              tras domar» suele resolver la ambigüedad.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {result.statsConsidered.map((k) => {
              const ex = result.perStat[k]!
              const c = uniqueSolution?.[k] ?? ex.candidates[0]
              if (!c) return null
              return (
                <StatChip key={k} stat={k}>
                  {c.Lw} salvajes{c.Ld > 0 && ` +${c.Ld} tuyos`}
                  {ex.ambiguous && !uniqueSolution && ' (?)'}
                </StatChip>
              )
            })}
          </div>
          {result.solutions.length > 1 && (
            <p className="mt-3 text-sm text-bone-dim">
              Para reducir a una única solución: indica el <strong>nivel justo tras domar</strong> (sin puntos tuyos) o
              marca stats que nunca subiste.
            </p>
          )}

          {uniqueSolution && (
            <div className="mt-4 flex gap-2 border-t border-surface-3 pt-4">
              <input
                type="text"
                value={dinoName}
                onChange={(e) => setDinoName(e.target.value)}
                placeholder="Nombre del dino"
                aria-label="Nombre del dino"
                className="flex-1 rounded-lg border border-surface-3 bg-surface-0 px-3 py-2"
              />
              <button
                onClick={saveDino}
                disabled={saved}
                className="rounded-lg bg-amber-deep px-4 py-2 font-semibold text-surface-0 hover:bg-amber disabled:opacity-60"
              >
                {saved ? '✓ Guardado' : 'Guardar en Mis Dinos'}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
