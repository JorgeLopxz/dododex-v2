import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { extractPostTame, extractWildStat, statReceivesPoints, type ExtractionResult } from '../../engine/extractor'
import { tameBonusLevels } from '../../engine/statFormula'
import { POINT_STATS, type PointStatKey } from '../../engine/types'
import { findSpecies, getSpecies } from '../../data'
import { STAT_META } from '../../ui/statMeta'
import { StatBar } from '../../ui/StatBar'
import { getMultipliers, useSettings } from '../../store/settings'
import { db } from '../../store/db'

/**
 * ⭐ Inspector post-tame: la función que Dododex no tiene.
 * Flujo guiado en 3 pasos: dino → contexto → stats. Resultado visual con barras.
 */
export function InspectorPage() {
  const { speciesId } = useParams()
  const navigate = useNavigate()
  const { version } = useSettings()

  const species = speciesId ? findSpecies(version, decodeURIComponent(speciesId)) : undefined

  /** 'fresh' = recién domado (Ld=0 — el caso común); 'leveled' = con niveles gastados; 'wild' = sin domar */
  const [mode, setMode] = useState<'fresh' | 'leveled' | 'wild'>('fresh')
  const [bred, setBred] = useState(false)
  const [TE, setTE] = useState('100')
  const [IB, setIB] = useState('0')
  const [level, setLevel] = useState('')
  const [postTameLevel, setPostTameLevel] = useState('')
  const [values, setValues] = useState<Partial<Record<PointStatKey, string>>>({})
  const [locked, setLocked] = useState<Set<PointStatKey>>(new Set())
  const [dinoName, setDinoName] = useState('')
  const [saved, setSaved] = useState(false)

  const settings = useSettings()
  const mult = useMemo(() => getMultipliers(settings), [settings])

  const relevantStats = useMemo(() => {
    if (!species) return []
    const base = POINT_STATS.filter((k) => statReceivesPoints(k, species, version) && species.displayed[k])
    // en modo salvaje solo tienen sentido los stats con crecimiento salvaje (Iw > 0)
    return mode === 'wild' ? base.filter((k) => (species.stats[k]?.Iw ?? 0) > 0) : base
  }, [species, version, mode])

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

    // Modo "salvaje": extracción directa Lw = (V/B − 1)/(Iw·IwM), sin términos de tameo
    if (mode === 'wild') {
      const perStat: ExtractionResult['perStat'] = {}
      const sol: Partial<Record<PointStatKey, { Lw: number; Ld: number }>> = {}
      let ok = true
      const keys = Object.keys(observed) as PointStatKey[]
      for (const k of keys) {
        const Lw = extractWildStat(k, species, observed[k]!, mult, precisions[k])
        if (Lw === null) {
          perStat[k] = { candidates: [], ambiguous: false }
          ok = false
        } else {
          perStat[k] = { candidates: [{ Lw, Ld: 0 }], ambiguous: false }
          sol[k] = { Lw, Ld: 0 }
        }
      }
      return { perStat, solutions: ok ? [sol] : [], statsConsidered: keys } satisfies ExtractionResult
    }

    // Modo "recién domado": el nivel actual ES el nivel tras domar y nadie gastó puntos aún
    const fresh = mode === 'fresh'
    const ptl = Number(fresh ? level : postTameLevel)
    const lvl = Number(level)
    return extractPostTame({
      species,
      version,
      observed,
      ctx: { tamed: true, bred, TE: bred ? 1 : Number(TE) / 100, IB: Number(IB) / 100 },
      mult,
      wildPoints: Number.isFinite(ptl) && ptl > 0 ? ptl - 1 : undefined,
      domPoints: fresh
        ? 0
        : Number.isFinite(ptl) && ptl > 0 && Number.isFinite(lvl) && lvl >= ptl
          ? lvl - ptl
          : undefined,
      displayPrecisionPerStat: precisions,
      lockedLd0: fresh ? [...relevantStats] : [...locked],
    })
  }, [species, version, relevantStats, values, mode, bred, TE, IB, level, postTameLevel, locked, mult])

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
      TE: mode === 'wild' ? 0 : bred ? 1 : Number(TE) / 100,
      IB: mode === 'wild' ? 0 : Number(IB) / 100,
      stats,
      createdAt: Date.now(),
    })
    setSaved(true)
    setTimeout(() => navigate('/dinos'), 600)
  }

  /* ——— Paso 1: elegir especie ——— */
  if (!species) {
    return (
      <section className="mx-auto max-w-lg">
        <h2 className="display mb-1 text-2xl font-bold">Inspector post-tame</h2>
        <p className="mb-6 text-sm text-bone-dim">
          Descubre cuántos puntos cayeron en cada stat de tu dino <strong className="text-bone">ya domado</strong> —
          lo que ninguna otra app puede decirte.
        </p>
        <div className="panel p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="step-badge">1</span>
            <h3 className="display font-semibold">¿Qué criatura es?</h3>
          </div>
          <select
            aria-label="Especie"
            className="input-field"
            defaultValue=""
            onChange={(e) => e.target.value && navigate(`/inspector/${encodeURIComponent(e.target.value)}`)}
          >
            <option value="" disabled>
              Elige especie ({getSpecies(version).length} · {version})
            </option>
            {getSpecies(version).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <p className="mt-3 text-xs text-bone-faint">
            Consejo: también puedes llegar aquí desde la pestaña <strong>Criaturas</strong>.
          </p>
        </div>
      </section>
    )
  }

  const uniqueSolution = result?.solutions.length === 1 ? result.solutions[0] : null
  const barMax = Math.max(30, ...result ? result.statsConsidered.map((k) => {
    const c = (uniqueSolution?.[k] ?? result.perStat[k]?.candidates[0])
    return c ? c.Lw + c.Ld : 0
  }) : [0]) * 1.15

  return (
    <section aria-label={`Inspector de ${species.name}`} className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="display text-2xl font-bold">{species.name}</h2>
          <p className="text-xs text-bone-faint">Inspector post-tame · {version}</p>
        </div>
        <button onClick={() => navigate('/inspector')} className="btn-ghost text-sm">
          Cambiar
        </button>
      </div>

      {/* Paso 2: contexto */}
      <div className="panel p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="step-badge">2</span>
          <h3 className="display font-semibold">Cuéntame de tu dino</h3>
        </div>

        {/* Selector de situación: el caso típico es "recién domado" */}
        <div role="group" aria-label="Situación del dino" className="mb-4 flex gap-2 rounded-lg bg-surface-0/60 p-1.5">
          <button onClick={() => setMode('fresh')} aria-pressed={mode === 'fresh'} className="mode-tab">
            ⚡ Recién domado
          </button>
          <button onClick={() => setMode('leveled')} aria-pressed={mode === 'leveled'} className="mode-tab">
            Ya le subí niveles
          </button>
          <button onClick={() => setMode('wild')} aria-pressed={mode === 'wild'} className="mode-tab">
            🌿 Salvaje
          </button>
        </div>
        {mode === 'fresh' && (
          <p className="mb-4 text-xs text-bone-dim">
            Acabas de domarlo y no has gastado ningún punto → te digo <strong className="text-tek">exactamente</strong>{' '}
            dónde cayeron los puntos salvajes (los que se heredan al criar).
          </p>
        )}
        {mode === 'wild' && (
          <p className="mb-4 text-xs text-bone-dim">
            Aún no lo has domado → mira dónde tiene los puntos y decide si <strong className="text-tek">merece la pena</strong> el tameo.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-bone-dim">
              {mode === 'fresh' ? 'Nivel (tras domar)' : mode === 'wild' ? 'Nivel salvaje' : 'Nivel actual'}
            </span>
            <input type="number" inputMode="numeric" value={level} onChange={(e) => setLevel(e.target.value)} className="input-field" />
          </label>
          {mode === 'leveled' && (
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-bone-dim">Nivel tras domar</span>
              <input
                type="number"
                inputMode="numeric"
                value={postTameLevel}
                onChange={(e) => setPostTameLevel(e.target.value)}
                placeholder="opcional"
                className="input-field"
              />
            </label>
          )}
          {!bred && mode !== 'wild' && (
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-bone-dim">Efectividad %</span>
              <input type="number" inputMode="decimal" value={TE} onChange={(e) => setTE(e.target.value)} className="input-field" />
            </label>
          )}
          {mode !== 'wild' && (
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-bone-dim">Imprint %</span>
              <input type="number" inputMode="decimal" value={IB} onChange={(e) => setIB(e.target.value)} className="input-field" />
            </label>
          )}
        </div>
        {mode !== 'wild' && (
          <label className="mt-3 flex items-center gap-2 text-sm text-bone-dim">
            <input type="checkbox" checked={bred} onChange={(e) => setBred(e.target.checked)} className="size-4 accent-(--color-tek-deep)" />
            Es un dino criado — la efectividad se asume 100%
          </label>
        )}
        {mode === 'leveled' && (
          <p className="mt-2 text-xs text-bone-faint">
            💡 El «nivel tras domar» (antes de gastar puntos) convierte varias posibilidades en una respuesta exacta.
          </p>
        )}
      </div>

      {/* Paso 3: stats */}
      <div className="panel p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="step-badge">3</span>
          <h3 className="display font-semibold">Copia los valores que ves in-game</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3">
          {relevantStats.map((k) => {
            const meta = STAT_META[k]
            return (
              <div key={k}>
                <label className="text-sm">
                  <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-bone-dim">
                    <span aria-hidden="true" style={{ color: meta.color }}>{meta.icon}</span>
                    {meta.label}
                    {meta.percent && ' (%)'}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={values[k] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
                    className="input-field"
                    style={values[k] ? { borderColor: meta.color, boxShadow: `0 0 0 3px color-mix(in srgb, ${meta.color} 18%, transparent)` } : undefined}
                  />
                </label>
                {mode === 'leveled' && (
                <label className="mt-1.5 flex items-center gap-1.5 text-[11px] text-bone-faint">
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
                    className="size-3.5 accent-(--color-tek-deep)"
                  />
                  nunca subí este stat
                </label>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Resultado */}
      {result && (
        <div
          className="panel p-5"
          style={
            uniqueSolution
              ? { borderColor: 'color-mix(in srgb, var(--color-ok) 45%, transparent)' }
              : undefined
          }
        >
          <h3 className="display mb-1 font-semibold">
            {result.solutions.length === 1 && <span className="text-ok">✓ Puntos descifrados</span>}
            {result.solutions.length > 1 && <span className="text-warn">{result.solutions.length} combinaciones posibles</span>}
            {result.solutions.length === 0 && <span className="text-danger">Los datos no cuadran</span>}
          </h3>
          {result.solutions.length === 0 && (
            <p className="mb-2 text-sm text-bone-dim">
              Revisa la efectividad, los valores copiados o los multiplicadores del servidor. El «nivel tras domar»
              suele arreglarlo.
            </p>
          )}
          {result.solutions.length > 1 && (
            <p className="mb-3 text-sm text-bone-dim">
              Marca «nunca subí este stat» donde aplique o añade el <strong>nivel tras domar</strong> para llegar a la
              respuesta exacta.
            </p>
          )}

          <div className="mt-3 grid gap-3.5">
            {result.statsConsidered.map((k) => {
              const ex = result.perStat[k]!
              const c = uniqueSolution?.[k] ?? ex.candidates[0]
              if (!c) return null
              return (
                <StatBar
                  key={k}
                  stat={k}
                  wild={c.Lw}
                  dom={c.Ld}
                  max={barMax}
                  ambiguous={ex.ambiguous && !uniqueSolution}
                />
              )
            })}
          </div>
          <p className="mt-3 text-[11px] text-bone-faint">
            {mode === 'wild'
              ? 'Puntos salvajes por stat — se heredan al criar tras el tameo'
              : 'Barra sólida = puntos salvajes (heredables al criar) · rayada = niveles que subiste tú'}
          </p>

          {/* Modo salvaje: puntos que fueron a stats ocultos (velocidad, etc.) */}
          {mode === 'wild' && uniqueSolution && Number(level) > 1 && (() => {
            const assigned = result.statsConsidered.reduce((acc, k) => acc + (uniqueSolution[k]?.Lw ?? 0), 0)
            const hidden = Number(level) - 1 - assigned
            if (hidden < 0) return null
            return (
              <p className="mt-2 rounded-lg border border-tek-dark/40 bg-surface-0/50 px-3 py-2 text-sm text-bone-dim">
                <span className="display font-bold text-bone">{assigned}</span> puntos visibles ·{' '}
                <span className="display font-bold text-bone-faint">{hidden}</span> en stats ocultos
                {version === 'ASA' ? ' (velocidad y similares — desperdiciados)' : ' (velocidad, etc.)'}
              </p>
            )
          })()}

          {/* Comparación salvaje → domado: nivel original y niveles bonus por TE */}
          {uniqueSolution && !bred && (() => {
            const ptl = Number(mode === 'fresh' ? level : postTameLevel)
            if (!Number.isFinite(ptl) || ptl <= 0) return null
            const te = Number(TE) / 100
            // busca el nivel salvaje wl tal que wl + floor(wl·TE/2) = nivel tras domar
            let wildLevel: number | null = null
            for (let wl = Math.floor(ptl / (1 + te / 2)) - 2; wl <= ptl; wl++) {
              if (wl > 0 && wl + tameBonusLevels(wl, te) === ptl) { wildLevel = wl; break }
            }
            if (!wildLevel) return null
            const bonus = ptl - wildLevel
            return (
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-tek-dark/40 bg-surface-0/50 px-3 py-2 text-sm">
                <span className="text-bone-dim">Salvaje era</span>
                <span className="display font-bold text-bone">Nv {wildLevel}</span>
                <span className="text-tek" aria-hidden="true">→</span>
                <span className="text-bone-dim">domado</span>
                <span className="display font-bold text-tek">Nv {ptl}</span>
                {bonus > 0 && (
                  <span className="text-xs text-bone-dim">
                    (+{bonus} niveles bonus por {TE}% de efectividad, repartidos como salvajes)
                  </span>
                )}
              </div>
            )
          })()}

          {uniqueSolution && (
            <div className="mt-4 flex flex-col gap-2 border-t border-surface-3 pt-4 sm:flex-row">
              <input
                type="text"
                value={dinoName}
                onChange={(e) => setDinoName(e.target.value)}
                placeholder="Ponle nombre (Rexy, Machacadora…)"
                aria-label="Nombre del dino"
                className="input-field flex-1"
              />
              <button onClick={saveDino} disabled={saved} className="btn-primary">
                {saved ? '✓ Guardado' : '💾 Guardar en Mis Dinos'}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
