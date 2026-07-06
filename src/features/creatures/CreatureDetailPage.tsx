import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { findSpecies, getTamingFoods } from '../../data'
import { calcTaming, formatDuration } from '../../engine/taming'
import { STAT_KEYS } from '../../engine/types'
import { STAT_META } from '../../ui/statMeta'
import { useSettings } from '../../store/settings'
import { IconScan } from '../../ui/icons'
import { CreatureImage } from '../../ui/GameImage'

/** Ficha de criatura: stats base + tameo de un vistazo + accesos directos (estilo Wikily unificado). */
export function CreatureDetailPage() {
  const { speciesId } = useParams()
  const navigate = useNavigate()
  const { version } = useSettings()
  const species = speciesId ? findSpecies(version, decodeURIComponent(speciesId)) : undefined

  const quickTame = useMemo(() => {
    if (!species?.taming) return null
    const foods = getTamingFoods(species.name)
    if (!foods?.length) return null
    return calcTaming(species.taming, foods[0], 150, {
      torporStat: species.stats.torpor ? { B: species.stats.torpor.B, Iw: species.stats.torpor.Iw } : undefined,
    })
  }, [species])

  if (!species) {
    return (
      <p className="panel p-6 text-center text-bone-dim">
        Especie no encontrada en {version}. <Link to="/criaturas" className="text-tek underline">Volver</Link>
      </p>
    )
  }

  const rows = STAT_KEYS.filter((k) => species.stats[k] && species.displayed[k])

  return (
    <section aria-label={`Ficha de ${species.name}`} className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CreatureImage name={species.name} size={56} />
          <div>
            <h2 className="display text-2xl font-bold leading-tight">{species.name}</h2>
            <p className="text-xs text-bone-faint">
              {version}
              {species.taming?.nonViolent && ' · tameo pasivo'}
              {!species.taming && ' · no domable por afinidad'}
            </p>
          </div>
        </div>
        <button onClick={() => navigate('/criaturas')} className="btn-ghost text-sm">←</button>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-2">
        <Link to={`/tameo/${encodeURIComponent(species.id)}`} className="btn-primary text-center text-sm">
          🧮 Calcular tameo
        </Link>
        <Link
          to={`/inspector/${encodeURIComponent(species.id)}`}
          className="btn-ghost inline-flex items-center justify-center gap-2 text-center text-sm"
        >
          <IconScan size={16} /> Inspeccionar stats
        </Link>
      </div>

      {/* Tameo de un vistazo (nv 150 oficial) */}
      {quickTame && (
        <div className="panel p-4">
          <p className="display mb-1 text-xs font-semibold uppercase tracking-widest text-tek">Tameo nv 150 · oficial</p>
          <p className="text-sm text-bone-dim">
            <strong className="text-bone">{quickTame.food.name}</strong> ×
            <strong className="display text-bone">{quickTame.pieces}</strong> · TE{' '}
            <strong className="text-ok">{(quickTame.te * 100).toFixed(1)}%</strong> · →Nv{' '}
            <strong className="text-tek">{150 + quickTame.bonusLevels}</strong> · ⏱{' '}
            {formatDuration(quickTame.seconds)}
            {quickTame.torpor && quickTame.torpor.narcotics > 0 && (
              <> · 💤 {quickTame.torpor.narcotics} narcóticos</>
            )}
          </p>
        </div>
      )}

      {/* Stats base */}
      <div className="panel overflow-x-auto p-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-bone-faint">
              <th className="px-3 py-2">Stat</th>
              <th className="px-3 py-2 text-right">Base</th>
              <th className="px-3 py-2 text-right">+/nivel salvaje</th>
              <th className="px-3 py-2 text-right">+/nivel domado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((k) => {
              const c = species.stats[k]!
              const meta = STAT_META[k]
              const fmt = (v: number) => (meta.percent ? `${(v * 100).toFixed(1)}%` : v % 1 === 0 ? v.toString() : v.toFixed(1))
              return (
                <tr key={k} className="odd:bg-surface-0/40">
                  <td className="flex items-center gap-2 px-3 py-2 font-medium">
                    <span aria-hidden="true" style={{ color: meta.color }}>{meta.icon}</span>
                    {meta.label}
                  </td>
                  <td className="display px-3 py-2 text-right tabular-nums">{fmt(c.B)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-bone-dim">
                    {c.Iw > 0 ? `+${fmt(c.B * c.Iw)}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-bone-dim">
                    {c.Id > 0 ? `+${(c.Id * 100).toFixed(1)}%` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-bone-faint">
        Salvaje: puntos suben el stat desde base. Domado: cada nivel tuyo sube un % del valor post-tame.
      </p>
    </section>
  )
}
