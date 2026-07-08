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

      {/* Acciones: todo lo que puedes hacer con este dino, desde su ficha */}
      <div className="grid grid-cols-3 gap-2">
        <Link to={`/tameo/${encodeURIComponent(species.id)}`} className="btn-primary text-center text-xs sm:text-sm">
          🧮 Calcular tameo
        </Link>
        <Link
          to={`/inspector/${encodeURIComponent(species.id)}?m=wild`}
          className="btn-ghost inline-flex items-center justify-center gap-1.5 text-center text-xs sm:text-sm"
        >
          🌿 Stats salvaje
        </Link>
        <Link
          to={`/inspector/${encodeURIComponent(species.id)}?m=fresh`}
          className="btn-ghost inline-flex items-center justify-center gap-1.5 text-center text-xs sm:text-sm"
        >
          <IconScan size={15} /> Stats post-tame
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

      {/* Cría: incubación, maduración, cuddles e imprint — compacto como Dododex */}
      {species.breeding && (() => {
        const b = species.breeding
        const CUDDLE = 28800 // 8h oficial
        const cuddles = b.maturation > 0 ? Math.floor(b.maturation / CUDDLE) : 0
        const perCuddle = cuddles > 0 ? Math.min(100, 100 / cuddles) : 0
        const babyFoods = getTamingFoods(species.name)?.filter((f) => !f.name.endsWith('Kibble')).slice(0, 3)
        return (
          <div className="panel p-4">
            <p className="display mb-2 text-xs font-semibold uppercase tracking-widest text-tek">Cría · rates oficiales</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4">
              <div>
                <span className="block text-[11px] text-bone-faint">{b.gestation > 0 ? '🤰 Gestación' : '🥚 Incubación'}</span>
                <span className="display font-semibold">{formatDuration(b.gestation > 0 ? b.gestation : b.incubation)}</span>
                {b.incubation > 0 && b.eggTempMax > 0 && (
                  <span className="block text-[11px] text-bone-dim">{b.eggTempMin}–{b.eggTempMax} °C</span>
                )}
              </div>
              <div>
                <span className="block text-[11px] text-bone-faint">🐣 Maduración</span>
                <span className="display font-semibold">{formatDuration(b.maturation)}</span>
                <span className="block text-[11px] text-bone-dim">bebé {formatDuration(b.maturation * 0.1)} · juvenil hasta {formatDuration(b.maturation * 0.5)}</span>
              </div>
              <div>
                <span className="block text-[11px] text-bone-faint">🤗 Imprint (cuddle cada 8h)</span>
                <span className="display font-semibold">{cuddles > 0 ? `${cuddles} cuddles · ${perCuddle.toFixed(1)}%/ud` : '—'}</span>
                <span className="block text-[11px] text-bone-dim">100%: +20% stats (no estamina/oxígeno)</span>
              </div>
              <div>
                <span className="block text-[11px] text-bone-faint">🍖 Comen de crías</span>
                <span className="text-xs text-bone-dim">
                  {babyFoods?.length ? babyFoods.map((f) => f.name).join(', ') : 'dieta del adulto'}
                </span>
                <span className="block text-[11px] text-bone-faint">(sin kibble; a mano hasta juvenil)</span>
              </div>
            </div>
            <p className="mt-2 border-t border-surface-3 pt-2 text-[11px] text-bone-faint">
              Montado por quien lo imprintó: +30% daño y −30% daño recibido adicionales.
            </p>
          </div>
        )
      })()}

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
