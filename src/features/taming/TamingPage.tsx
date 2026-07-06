import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { calcTaming, formatDuration, type TamingServerMults } from '../../engine/taming'
import { findSpecies, getSpecies, getTamingFoods } from '../../data'
import { useSettings } from '../../store/settings'
import { tameBonusLevels } from '../../engine/statFormula'

/** Calculadora de tameo — fórmulas verificadas contra ASB (Taming.cs, MIT). */
export function TamingPage() {
  const { speciesId } = useParams()
  const navigate = useNavigate()
  const { version } = useSettings()

  const species = speciesId ? findSpecies(version, decodeURIComponent(speciesId)) : undefined
  const [level, setLevel] = useState('150')
  const [tsm, setTsm] = useState('1')
  const [fdm, setFdm] = useState('1')
  const [sanguine, setSanguine] = useState(false)

  const foods = useMemo(() => (species ? getTamingFoods(species.name) : null), [species])

  const rows = useMemo(() => {
    if (!species?.taming || !foods) return []
    const lvl = Math.max(1, Number(level) || 150)
    const mults: TamingServerMults = {
      tamingSpeed: Number(tsm) > 0 ? Number(tsm) : 1,
      foodDrain: Number(fdm) > 0 ? Number(fdm) : 1,
      wildTorporDrain: 1,
    }
    const torporStat = species.stats.torpor ? { B: species.stats.torpor.B, Iw: species.stats.torpor.Iw } : undefined
    return foods
      .map((food) =>
        calcTaming(species.taming!, food, lvl, { mults, torporStat, sanguineElixir: sanguine && version === 'ASA' }),
      )
      .filter((r) => r !== null)
  }, [species, foods, level, tsm, fdm, sanguine, version])

  if (!species) {
    return (
      <section className="mx-auto max-w-lg">
        <h2 className="display mb-1 text-2xl font-bold">Calculadora de tameo</h2>
        <p className="mb-6 text-sm text-bone-dim">
          Comida, efectividad, niveles bonus, tiempo y narcóticos — con las fórmulas exactas del juego.
        </p>
        <div className="panel p-5">
          <select
            aria-label="Especie"
            className="input-field"
            defaultValue=""
            onChange={(e) => e.target.value && navigate(`/tameo/${encodeURIComponent(e.target.value)}`)}
          >
            <option value="" disabled>
              Elige especie ({getSpecies(version).length} · {version})
            </option>
            {getSpecies(version)
              .filter((s) => s.taming)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </div>
      </section>
    )
  }

  const best = rows[0]
  const lvlNum = Math.max(1, Number(level) || 150)

  return (
    <section aria-label={`Tameo de ${species.name}`} className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="display text-2xl font-bold">{species.name}</h2>
          <p className="text-xs text-bone-faint">
            Calculadora de tameo · {version}
            {species.taming?.nonViolent && ' · tameo pasivo'}
          </p>
        </div>
        <button onClick={() => navigate('/tameo')} className="btn-ghost text-sm">
          Cambiar
        </button>
      </div>

      {/* Parámetros */}
      <div className="panel grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-bone-dim">Nivel salvaje</span>
          <input type="number" inputMode="numeric" value={level} onChange={(e) => setLevel(e.target.value)} className="input-field" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-bone-dim">Taming Speed ×</span>
          <input type="number" step="0.5" inputMode="decimal" value={tsm} onChange={(e) => setTsm(e.target.value)} className="input-field" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-bone-dim">Food Drain ×</span>
          <input type="number" step="0.5" inputMode="decimal" value={fdm} onChange={(e) => setFdm(e.target.value)} className="input-field" />
        </label>
        {version === 'ASA' && (
          <label className="flex items-end gap-2 pb-2 text-sm text-bone-dim">
            <input type="checkbox" checked={sanguine} onChange={(e) => setSanguine(e.target.checked)} className="size-4 accent-(--color-tek-deep)" />
            Sanguine Elixir (−30%)
          </label>
        )}
      </div>

      {!species.taming || !foods ? (
        <div className="panel p-6 text-center text-bone-dim">
          {!species.taming
            ? 'Esta especie no se doma por afinidad (o no hay datos de tameo).'
            : 'Sin datos de dieta para esta especie en la fuente (ASB).'}
        </div>
      ) : (
        <>
          {/* Resultado destacado: mejor comida */}
          {best && (
            <div className="panel p-5" style={{ borderColor: 'color-mix(in srgb, var(--color-tek) 40%, transparent)' }}>
              <p className="display mb-1 text-xs font-semibold uppercase tracking-widest text-tek">Mejor opción</p>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="display text-xl font-bold">{best.food.name}</span>
                <span className="text-bone-dim">
                  ×<span className="display font-bold text-bone">{best.pieces}</span>
                </span>
                <span className="text-bone-dim">
                  TE <span className="display font-bold text-ok">{(best.te * 100).toFixed(1)}%</span>
                </span>
                <span className="text-bone-dim">
                  → Nv <span className="display font-bold text-tek">{lvlNum + best.bonusLevels}</span>
                  <span className="text-xs"> (+{best.bonusLevels})</span>
                </span>
                <span className="text-bone-dim">⏱ {formatDuration(best.seconds)}</span>
              </div>
              {best.torpor && (
                <p className="mt-2 border-t border-surface-3 pt-2 text-sm text-bone-dim">
                  💤 Torpor {Math.round(best.torpor.total).toLocaleString()} ·{' '}
                  <strong className="text-bone">{best.torpor.narcotics}</strong> narcóticos ·{' '}
                  <strong className="text-bone">{best.torpor.bioToxins}</strong> bio toxin ·{' '}
                  <strong className="text-bone">{best.torpor.narcoberries}</strong> narcobayas
                  <span className="text-xs text-bone-faint"> (lleva ~50% extra por seguridad)</span>
                </p>
              )}
              {!best.torpor && !species.taming.nonViolent && (
                <p className="mt-2 text-xs text-bone-faint">Sin datos de torpor para esta especie — narcóticos no calculables.</p>
              )}
            </div>
          )}

          {/* Tabla completa de comidas */}
          <div className="panel overflow-x-auto p-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-bone-faint">
                  <th className="px-3 py-2">Comida</th>
                  <th className="px-3 py-2 text-right">Cant.</th>
                  <th className="px-3 py-2 text-right">TE</th>
                  <th className="px-3 py-2 text-right">Niveles</th>
                  <th className="px-3 py-2 text-right">Tiempo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.food.name} className={i === 0 ? 'bg-tek-dark/15' : 'odd:bg-surface-0/40'}>
                    <td className="px-3 py-2 font-medium">{r.food.name}</td>
                    <td className="display px-3 py-2 text-right tabular-nums">{r.pieces}</td>
                    <td
                      className="display px-3 py-2 text-right tabular-nums"
                      style={{ color: r.te > 0.9 ? 'var(--color-ok)' : r.te > 0.6 ? 'var(--color-warn)' : 'var(--color-danger)' }}
                    >
                      {(r.te * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-bone-dim">+{r.bonusLevels}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-bone-dim">{formatDuration(r.seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-bone-faint">
            TE máx teórica al 100%: +{tameBonusLevels(lvlNum, 1)} niveles → Nv {lvlNum + tameBonusLevels(lvlNum, 1)}.
            Tras domar, pásalo por el <Link to={`/inspector/${encodeURIComponent(species.id)}`} className="text-tek underline">Inspector</Link> para ver dónde cayeron los puntos.
          </p>
        </>
      )}
    </section>
  )
}
