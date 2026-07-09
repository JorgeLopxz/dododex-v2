import { useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { findSpecies, getTamingFoods } from '../../data'
import { calcTaming, formatDuration } from '../../engine/taming'
import { STAT_KEYS } from '../../engine/types'
import { STAT_META } from '../../ui/statMeta'
import { useFavorites } from '../../store/favorites'
import { IconStar } from '../../ui/icons'
import { CreatureImage } from '../../ui/GameImage'
import { TamingCalculator } from './TamingCalculator'
import { StatInspector } from './StatInspector'

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'tameo', label: '🧮 Tameo' },
  { id: 'inspector', label: '⭐ Inspector' },
] as const
type TabId = (typeof TABS)[number]['id']

/** Súper-ficha: TODO lo de una criatura en un sitio — resumen, calculadora de tameo e inspector. */
export function CreatureDetailPage() {
  const { speciesId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const species = speciesId ? findSpecies(decodeURIComponent(speciesId)) : undefined
  const { ids: favoriteIds, toggle } = useFavorites()

  const rawTab = searchParams.get('tab')
  const tab: TabId = rawTab === 'tameo' || rawTab === 'inspector' ? rawTab : 'resumen'

  if (!species) {
    return (
      <p className="panel p-6 text-center text-bone-dim">
        Especie no encontrada. <Link to="/" className="text-tek underline">Volver al buscador</Link>
      </p>
    )
  }
  const isFav = favoriteIds.includes(species.id)

  return (
    <section aria-label={`Ficha de ${species.name}`} className="space-y-4">
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          aria-label="Volver"
          className="btn-ghost px-2.5 py-1.5 text-lg leading-none"
        >
          ←
        </button>
        <CreatureImage name={species.name} size={52} />
        <div className="min-w-0 flex-1">
          <h2 className="display truncate text-2xl font-bold leading-tight">{species.name}</h2>
          <p className="text-xs text-bone-faint">
            {species.taming.nonViolent ? 'Tameo pasivo' : 'Tameo por noqueo'}
          </p>
        </div>
        <button
          onClick={() => toggle(species.id)}
          aria-label={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          aria-pressed={isFav}
          className={`grid size-10 shrink-0 place-items-center rounded-lg border border-surface-3 transition-colors ${
            isFav ? 'text-warn' : 'text-bone-faint hover:text-bone-dim'
          }`}
        >
          <IconStar filled={isFav} />
        </button>
      </div>

      {/* Pestañas de la súper-ficha */}
      <div role="group" aria-label="Sección de la ficha" className="flex gap-2 rounded-lg bg-surface-0/60 p-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSearchParams(t.id === 'resumen' ? {} : { tab: t.id }, { replace: true })}
            aria-pressed={tab === t.id}
            className="mode-tab"
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'resumen' && <SummaryTab species={species} />}
      {tab === 'tameo' && <TamingCalculator species={species} />}
      {tab === 'inspector' && <StatInspector species={species} />}
    </section>
  )
}

function SummaryTab({ species }: { species: NonNullable<ReturnType<typeof findSpecies>> }) {
  const [, setSearchParams] = useSearchParams()

  const quickTame = useMemo(() => {
    const foods = getTamingFoods(species.name)
    if (!foods?.length) return null
    return calcTaming(species.taming, foods[0], 150, {
      torporStat: species.stats.torpor ? { B: species.stats.torpor.B, Iw: species.stats.torpor.Iw } : undefined,
    })
  }, [species])

  const rows = STAT_KEYS.filter((k) => species.stats[k] && species.displayed[k])

  return (
    <div className="space-y-4">
      {/* Tameo de un vistazo (nv 150 oficial) → la pestaña Tameo para afinar */}
      {quickTame && (
        <button
          onClick={() => setSearchParams({ tab: 'tameo' }, { replace: true })}
          className="panel panel-hover w-full p-4 text-left"
        >
          <p className="display mb-1 text-xs font-semibold uppercase tracking-widest text-tek">
            Tameo nv 150 · oficial — toca para ajustar
          </p>
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
        </button>
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
    </div>
  )
}
