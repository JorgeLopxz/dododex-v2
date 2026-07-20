import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { findSpecies, getTamingFoods } from '../../data'
import { calcTaming, formatDuration } from '../../engine/taming'
import { getTamingSpeed, useSettings } from '../../store/settings'
import { useFavorites } from '../../store/favorites'
import { IconStar } from '../../ui/icons'
import { CreatureImage } from '../../ui/GameImage'
import { TamingCalculator } from './TamingCalculator'
import { StatInspector } from './StatInspector'
import { SpawnMap } from './SpawnMap'

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'tameo', label: 'Tameo' },
  { id: 'inspector', label: 'Inspector' },
] as const
type TabId = (typeof TABS)[number]['id']

/** Súper-ficha: TODO lo de una criatura en un sitio — resumen, calculadora de tameo e inspector. */
export function CreatureDetailPage() {
  const { speciesId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { gameVersion } = useSettings()
  const species = speciesId ? findSpecies(decodeURIComponent(speciesId), gameVersion) : undefined
  const { ids: favoriteIds, toggle } = useFavorites()

  const rawTab = searchParams.get('tab')
  const tab: TabId = rawTab === 'tameo' || rawTab === 'inspector' ? rawTab : 'resumen'

  if (!species) {
    return (
      <p className="panel p-6 text-center italic text-bone-dim">
        Especie no encontrada en el registro {gameVersion.toUpperCase()}.{' '}
        <Link to="/" className="not-italic text-amber underline">Volver al buscador</Link>
      </p>
    )
  }
  const isFav = favoriteIds.includes(species.id)

  return (
    <section aria-label={`Ficha de ${species.name}`} className={`space-y-4 ${tab === 'inspector' ? 'inspector-scope' : ''}`}>
      <div className="flex items-start gap-2.5">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          aria-label="Volver"
          className="btn-ghost px-2.5 py-1.5 text-lg leading-none"
        >
          ←
        </button>
        <CreatureImage name={species.name} size={52} />
        <div className="min-w-0 flex-1">
          <h2 className="display truncate text-2xl font-semibold leading-tight">{species.name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="stamp stamp-verdigris">Domable</span>
            <span className="kicker text-bone-faint">
              {species.taming.nonViolent ? 'tameo pasivo' : 'tameo por noqueo'}
            </span>
          </div>
        </div>
        <button
          onClick={() => toggle(species.id)}
          aria-label={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          aria-pressed={isFav}
          className={
            isFav
              ? 'stamp shrink-0'
              : 'grid size-10 shrink-0 place-items-center border border-surface-3 text-bone-faint transition-colors hover:text-bone-dim'
          }
        >
          <IconStar size={isFav ? 12 : 18} filled={isFav} /> {isFav && 'Fav'}
        </button>
      </div>

      {/* Pestañas de la súper-ficha (archivador): activa = tinta sólida; pencil dentro del Inspector */}
      <div role="group" aria-label="Sección de la ficha" className="flex">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSearchParams(t.id === 'resumen' ? {} : { tab: t.id }, { replace: true })}
            aria-pressed={tab === t.id}
            className="tab-archive -ml-px first:ml-0"
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

/** Comando de consola con botón de copiar (lámina de bloque de código). */
function CommandRow({ label, cmd }: { label: string; cmd: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center gap-2">
      <span className="mono w-20 shrink-0 text-[10px] uppercase tracking-wider text-bone-faint">{label}</span>
      <code className="code-block min-w-0 flex-1 truncate px-2 py-1.5 text-xs">{cmd}</code>
      <button
        onClick={() => {
          navigator.clipboard.writeText(cmd).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1200)
          })
        }}
        className="btn-ghost mono shrink-0 px-2.5 py-1 text-xs"
        aria-label={`Copiar comando: ${label}`}
      >
        {copied ? '✓' : 'copiar'}
      </button>
    </div>
  )
}

function SummaryTab({ species }: { species: NonNullable<ReturnType<typeof findSpecies>> }) {
  const [, setSearchParams] = useSearchParams()
  const settings = useSettings()
  const tsm = getTamingSpeed(settings)
  const { breedingMult, setBreedingMult } = settings

  const quickTame = useMemo(() => {
    const foods = getTamingFoods(species.name)
    if (!foods?.length) return null
    return calcTaming(species.taming, foods[0], 150, {
      mults: { tamingSpeed: tsm, foodDrain: 1, wildTorporDrain: 1 },
      torporStat: species.stats.torpor ? { B: species.stats.torpor.B, Iw: species.stats.torpor.Iw } : undefined,
    })
  }, [species, tsm])

  const [cmdLevel, setCmdLevel] = useState('150')
  const lvl = Math.max(1, Number(cmdLevel) || 150)
  /** clase del blueprint para comandos: id + "_C" */
  const cls = `${species.id.replace(/~\d+$/, '')}_C`
  /** heurística de silla: nombre sin espacios + "Saddle" (GFI hace matching parcial in-game) */
  const saddleGfi = species.name.replace(/\s*\(.*\)$/, '').replace(/[\s-]/g, '') + 'Saddle'

  return (
    <div className="space-y-4">
      {/* Tameo de un vistazo (nv 150 oficial) → la pestaña Tameo para afinar */}
      {quickTame && (
        <button
          onClick={() => setSearchParams({ tab: 'tameo' }, { replace: true })}
          className="panel panel-hover w-full p-4 text-left"
        >
          <p className="kicker mb-1">Tameo nv 150 · rates ×{tsm} — toca para ajustar</p>
          <p className="text-sm text-bone-dim">
            <strong className="text-bone">{quickTame.food.name}</strong> ×
            <strong className="display text-bone">{quickTame.pieces}</strong> · TE{' '}
            <strong className="text-verdigris">{(quickTame.te * 100).toFixed(1)}%</strong> · →Nv{' '}
            <strong className="text-amber">{150 + quickTame.bonusLevels}</strong> · ⏱{' '}
            {formatDuration(quickTame.seconds)}
            {quickTame.torpor && quickTame.torpor.narcotics > 0 && (
              <> · {quickTame.torpor.narcotics} narcóticos</>
            )}
          </p>
        </button>
      )}

      {/* Cría con rates del servidor (multiplicador persistente) */}
      {species.breeding && (() => {
        const b = species.breeding
        const m = breedingMult
        const CUDDLE = 28800 / m // 8h oficial, escala con las rates
        const maturation = b.maturation / m
        const cuddles = maturation > 0 ? Math.floor(maturation / CUDDLE) : 0
        const perCuddle = cuddles > 0 ? Math.min(100, 100 / cuddles) : 0
        const babyFoods = getTamingFoods(species.name)?.filter((f) => !f.name.endsWith('Kibble')).slice(0, 3)
        return (
          <div className="panel p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="kicker">Cría · rates ×{m}</p>
              <div role="group" aria-label="Rates de cría del servidor" className="flex items-center gap-1">
                {[1, 2, 3].map((v) => (
                  <button
                    key={v}
                    onClick={() => setBreedingMult(v)}
                    aria-pressed={m === v}
                    className="mode-tab flex-none px-2 py-1 text-[11px]"
                  >
                    ×{v}
                  </button>
                ))}
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={breedingMult}
                  onChange={(e) => setBreedingMult(Number(e.target.value))}
                  aria-label="Multiplicador de cría personalizado"
                  className="input-field w-16 px-1.5 py-1 text-center text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4">
              <div>
                <span className="mono block text-[10px] uppercase text-bone-faint">{b.gestation > 0 ? 'Gestación' : 'Incubación'}</span>
                <span className="display font-semibold">{formatDuration((b.gestation > 0 ? b.gestation : b.incubation) / m)}</span>
                {b.incubation > 0 && b.eggTempMax > 0 && (
                  <span className="block text-[11px] text-bone-dim">{b.eggTempMin}–{b.eggTempMax} °C</span>
                )}
              </div>
              <div>
                <span className="mono block text-[10px] uppercase text-bone-faint">Maduración</span>
                <span className="display font-semibold">{formatDuration(maturation)}</span>
                <span className="block text-[11px] text-bone-dim">bebé {formatDuration(maturation * 0.1)} · juvenil hasta {formatDuration(maturation * 0.5)}</span>
              </div>
              <div>
                <span className="mono block text-[10px] uppercase text-bone-faint">Imprint (cada {formatDuration(CUDDLE)})</span>
                <span className="display font-semibold">{cuddles > 0 ? `${cuddles} cuddles · ${perCuddle.toFixed(1)}%/ud` : '—'}</span>
                <span className="block text-[11px] text-bone-dim">100%: +20% stats (no estamina/oxígeno)</span>
              </div>
              <div>
                <span className="mono block text-[10px] uppercase text-bone-faint">Comen de crías</span>
                <span className="text-xs text-bone-dim">
                  {babyFoods?.length ? babyFoods.map((f) => f.name).join(', ') : 'dieta del adulto'}
                </span>
                <span className="block text-[11px] text-bone-faint">(sin kibble; a mano hasta juvenil)</span>
              </div>
            </div>
            <p className="mt-2 border-t border-surface-3 pt-2 text-[11px] italic text-bone-faint">
              ×1 = oficial · ajusta a las MatingSpeed/EggHatchSpeed/MaturationSpeed de tu servidor.
              Montado por quien lo imprintó: +30% daño y −30% daño recibido.
            </p>
          </div>
        )
      })()}

      {/* Comandos de spawn (un jugador / servidores con admin) */}
      <div className="panel space-y-2 p-4">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <p className="kicker">Comandos</p>
          <label className="mono flex items-center gap-2 text-[10px] uppercase text-bone-dim">
            nivel
            <input
              type="number"
              inputMode="numeric"
              value={cmdLevel}
              onChange={(e) => setCmdLevel(e.target.value)}
              className="input-field w-16 px-1.5 py-1 text-center text-xs"
              aria-label="Nivel para el comando de spawn tameado"
            />
          </label>
        </div>
        <CommandRow label="Salvaje" cmd={`cheat Summon ${cls}`} />
        <CommandRow label="Tameado" cmd={`cheat GMSummon "${cls}" ${lvl}`} />
        <CommandRow label="Montura" cmd={`cheat GFI ${saddleGfi} 1 0 0`} />
        <p className="text-[11px] italic text-bone-faint">
          Pégalo en la consola (un jugador o admin). La montura usa búsqueda parcial GFI — si no da
          resultado, esa criatura no tiene silla o usa otro nombre.
        </p>
      </div>

      {/* Dónde aparece: mapa de spawn integrado */}
      <div>
        <p className="kicker mb-2">Dónde aparece</p>
        <SpawnMap species={species} />
      </div>
    </div>
  )
}
