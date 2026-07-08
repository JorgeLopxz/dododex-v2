import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  TAMING_PRESETS,
  calcTamingPlan,
  formatDuration,
  type PlanItem,
  type TamingServerMults,
} from '../../engine/taming'
import { WEAPONS, hitsToKnockout, wildTorpor } from '../../engine/knockout'
import { findSpecies, getSpecies, getTamingFoods } from '../../data'
import { useSettings } from '../../store/settings'
import { tameBonusLevels } from '../../engine/statFormula'
import { CreatureImage, ItemImage } from '../../ui/GameImage'

const TOP_FOODS = 6

/** Calculadora de tameo v2 — paridad Dododex: presets, combos de comida, noqueo por arma. */
export function TamingPage() {
  const { speciesId } = useParams()
  const navigate = useNavigate()
  const { version } = useSettings()

  const species = speciesId ? findSpecies(version, decodeURIComponent(speciesId)) : undefined
  const [level, setLevel] = useState('150')
  const [preset, setPreset] = useState<string>('official')
  const [customTsm, setCustomTsm] = useState('1')
  const [sanguine, setSanguine] = useState(false)
  const [showAll, setShowAll] = useState(false)
  /** cantidades elegidas por comida (plan combinado); vacío ⇒ auto con la mejor comida */
  const [qty, setQty] = useState<Record<string, number>>({})
  const [weaponId, setWeaponId] = useState('crossbow')
  const [quality, setQuality] = useState('100')
  const [search, setSearch] = useState('')

  const foods = useMemo(() => (species ? getTamingFoods(species.name) : null), [species])
  const lvl = Math.max(1, Number(level) || 150)
  const tsm = preset === 'custom' ? (Number(customTsm) > 0 ? Number(customTsm) : 1) : TAMING_PRESETS.find((p) => p.id === preset)?.tsm ?? 1
  const mults: TamingServerMults = { tamingSpeed: tsm, foodDrain: 1, wildTorporDrain: 1 }
  const torporStat = species?.stats.torpor ? { B: species.stats.torpor.B, Iw: species.stats.torpor.Iw } : undefined
  const sang = sanguine && version === 'ASA'

  /** por comida: resultado usando SOLO esa comida (para la tabla) */
  const soloRows = useMemo(() => {
    if (!species?.taming || !foods) return []
    return foods
      .map((food) => {
        const r = calcTamingPlan(species.taming!, [{ food, pieces: 100000 }], lvl, { mults, torporStat, sanguineElixir: sang })
        return r.enough && r.used.length > 0 ? { food, pieces: r.used[0].pieces, te: r.te, bonus: r.bonusLevels, seconds: r.seconds } : null
      })
      .filter((r) => r !== null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [species, foods, lvl, tsm, sang])

  /** plan activo: cantidades del usuario, o auto (mejor comida) si no tocó nada */
  const hasCustomPlan = Object.values(qty).some((n) => n > 0)
  const plan = useMemo(() => {
    if (!species?.taming || !foods) return null
    const items: PlanItem[] = hasCustomPlan
      ? foods.map((f) => ({ food: f, pieces: qty[f.name] ?? 0 })).filter((i) => i.pieces > 0)
      : foods.length > 0
        ? [{ food: foods[0], pieces: 100000 }]
        : []
    if (items.length === 0) return null
    return calcTamingPlan(species.taming, items, lvl, { mults, torporStat, sanguineElixir: sang })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [species, foods, qty, hasCustomPlan, lvl, tsm, sang])

  if (!species) {
    const q = search.trim().toLowerCase()
    const list = getSpecies(version).filter((s) => s.taming && (!q || s.name.toLowerCase().includes(q))).slice(0, 30)
    return (
      <section className="mx-auto max-w-lg">
        <h2 className="display mb-1 text-2xl font-bold">Calculadora de tameo</h2>
        <p className="mb-4 text-sm text-bone-dim">Comida, efectividad, narcóticos y noqueo — fórmulas exactas del juego.</p>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔎  Busca una criatura…"
          aria-label="Buscar criatura"
          className="input-field mb-3 py-3"
        />
        <ul className="grid gap-2">
          {list.map((s) => (
            <li key={s.id}>
              <Link to={`/tameo/${encodeURIComponent(s.id)}`} className="panel panel-hover flex items-center gap-3 p-2.5">
                <CreatureImage name={s.name} size={40} />
                <span className="font-semibold">{s.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  const visibleRows = showAll ? soloRows : soloRows.slice(0, TOP_FOODS)
  const torporTotal = torporStat ? wildTorpor(torporStat, lvl) : null
  const weapon = WEAPONS.find((w) => w.id === weaponId)!
  const qualityNum = Math.max(1, Number(quality) || 100)

  return (
    <section aria-label={`Tameo de ${species.name}`} className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <CreatureImage name={species.name} size={52} />
          <div>
            <h2 className="display text-2xl font-bold leading-tight">{species.name}</h2>
            <p className="text-xs text-bone-faint">
              Tameo · {version}
              {species.taming?.nonViolent && ' · pasivo'}
            </p>
          </div>
        </div>
        <button onClick={() => navigate('/tameo')} className="btn-ghost text-sm">Cambiar</button>
      </div>

      {/* Nivel + presets de servidor */}
      <div className="panel p-4">
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-bone-dim">Nivel salvaje</span>
            <input type="number" inputMode="numeric" value={level} onChange={(e) => setLevel(e.target.value)} className="input-field w-28" />
          </label>
          {version === 'ASA' && (
            <label className="flex items-center gap-2 pb-2 text-sm text-bone-dim">
              <input type="checkbox" checked={sanguine} onChange={(e) => setSanguine(e.target.checked)} className="size-4 accent-(--color-tek-deep)" />
              Sanguine Elixir (−30%)
            </label>
          )}
        </div>
        <div role="group" aria-label="Preset de servidor" className="flex flex-wrap gap-1.5">
          {TAMING_PRESETS.map((p) => (
            <button key={p.id} onClick={() => setPreset(p.id)} aria-pressed={preset === p.id} className="mode-tab flex-none px-3 text-xs">
              {p.label} ×{p.tsm}
            </button>
          ))}
          <button onClick={() => setPreset('custom')} aria-pressed={preset === 'custom'} className="mode-tab flex-none px-3 text-xs">
            Custom
          </button>
          {preset === 'custom' && (
            <input
              type="number"
              step="0.5"
              aria-label="Taming Speed personalizado"
              value={customTsm}
              onChange={(e) => setCustomTsm(e.target.value)}
              className="input-field w-20 px-2 py-1.5 text-sm"
            />
          )}
        </div>
        <p className="mt-2 text-[11px] text-bone-faint">
          ⚠️ Las rates oficiales fluctúan con eventos de Wildcard — si tu servidor va boosted, usa Evento o Custom.
        </p>
      </div>

      {!species.taming || !foods ? (
        <div className="panel p-6 text-center text-bone-dim">
          {!species.taming ? 'Esta especie no se doma por afinidad (o no hay datos).' : 'Sin datos de dieta para esta especie.'}
        </div>
      ) : (
        <>
          {/* Resultado del plan activo */}
          {plan && (
            <div
              className="panel p-5"
              style={{ borderColor: plan.enough ? 'color-mix(in srgb, var(--color-tek) 40%, transparent)' : 'color-mix(in srgb, var(--color-warn) 50%, transparent)' }}
            >
              <p className="display mb-2 text-xs font-semibold uppercase tracking-widest text-tek">
                {hasCustomPlan ? 'Tu plan de comida' : `Mejor opción · ${plan.used[0]?.food.name}`}
              </p>
              {hasCustomPlan && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {plan.used.map((u) => (
                    <span key={u.food.name} className="flex items-center gap-1.5 rounded-lg bg-surface-2 px-2 py-1 text-sm">
                      <ItemImage name={u.food.name} size={22} />
                      ×<strong className="display">{u.pieces}</strong>
                    </span>
                  ))}
                </div>
              )}
              {!plan.enough ? (
                <p className="text-sm text-warn">
                  ⚠️ Falta afinidad ({Math.ceil(plan.affinityLeft).toLocaleString()}): añade más comida al plan.
                </p>
              ) : (
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-bone-dim">
                  {!hasCustomPlan && plan.used[0] && (
                    <span className="flex items-center gap-1.5">
                      <ItemImage name={plan.used[0].food.name} size={24} />×
                      <strong className="display text-bone">{plan.used[0].pieces}</strong>
                    </span>
                  )}
                  <span>TE <strong className="display text-ok">{(plan.te * 100).toFixed(1)}%</strong></span>
                  <span>
                    → Nv <strong className="display text-tek">{lvl + plan.bonusLevels}</strong>
                    <span className="text-xs"> (+{plan.bonusLevels})</span>
                  </span>
                  {plan.seconds > 0 && <span>⏱ {formatDuration(plan.seconds)}</span>}
                </div>
              )}
              {plan.enough && plan.torpor && (
                <p className="mt-2 border-t border-surface-3 pt-2 text-sm text-bone-dim">
                  💤 <ItemImage name="Narcotic" size={20} fallback="💊" /> <strong className="text-bone">{plan.torpor.narcotics}</strong> narcóticos ·{' '}
                  <ItemImage name="Bio_Toxin" size={20} fallback="🪼" /> <strong className="text-bone">{plan.torpor.bioToxins}</strong> bio toxin ·{' '}
                  <ItemImage name="Narcoberry" size={20} fallback="🫐" /> <strong className="text-bone">{plan.torpor.narcoberries}</strong> narcobayas
                  <span className="text-xs text-bone-faint"> · lleva ~50% extra</span>
                </p>
              )}
              {plan.enough && !plan.torpor && !species.taming.nonViolent && (
                <p className="mt-2 text-xs text-bone-faint">Sin datos de torpor para esta especie.</p>
              )}
            </div>
          )}

          {/* Tabla de comidas: top 6 + ver más; steppers para combinar */}
          <div className="panel p-2">
            <div className="grid grid-cols-[1fr_4.5rem_3.5rem_4.5rem_5.5rem] items-center gap-1 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-bone-faint">
              <span>Comida</span><span className="text-right">Cant.</span><span className="text-right">TE</span><span className="text-right">Tiempo</span><span className="text-center">Tu plan</span>
            </div>
            {visibleRows.map((r) => (
              <div key={r.food.name} className="grid grid-cols-[1fr_4.5rem_3.5rem_4.5rem_5.5rem] items-center gap-1 rounded-lg px-2 py-1.5 odd:bg-surface-0/40">
                <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                  <ItemImage name={r.food.name} size={26} />
                  <span className="truncate">{r.food.name}</span>
                </span>
                <span className="display text-right text-sm tabular-nums">{r.pieces}</span>
                <span
                  className="display text-right text-sm tabular-nums"
                  style={{ color: r.te > 0.9 ? 'var(--color-ok)' : r.te > 0.6 ? 'var(--color-warn)' : 'var(--color-danger)' }}
                >
                  {(r.te * 100).toFixed(0)}%
                </span>
                <span className="text-right text-xs tabular-nums text-bone-dim">
                  {r.seconds > 0 ? formatDuration(r.seconds) : '—'}
                </span>
                <span className="flex items-center justify-center gap-1">
                  <button
                    aria-label={`Quitar ${r.food.name} del plan`}
                    onClick={() => setQty((q) => ({ ...q, [r.food.name]: Math.max(0, (q[r.food.name] ?? 0) - 1) }))}
                    className="grid size-6 place-items-center rounded bg-surface-2 text-bone-dim hover:text-bone"
                  >−</button>
                  <input
                    type="number"
                    min="0"
                    aria-label={`Piezas de ${r.food.name} en tu plan`}
                    value={qty[r.food.name] ?? 0}
                    onChange={(e) => setQty((q) => ({ ...q, [r.food.name]: Math.max(0, Number(e.target.value) || 0) }))}
                    className="input-field w-12 px-1 py-0.5 text-center text-xs"
                  />
                  <button
                    aria-label={`Añadir ${r.food.name} al plan`}
                    onClick={() => setQty((q) => ({ ...q, [r.food.name]: (q[r.food.name] ?? 0) + 1 }))}
                    className="grid size-6 place-items-center rounded bg-surface-2 text-bone-dim hover:text-bone"
                  >+</button>
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between px-2 py-2">
              {soloRows.length > TOP_FOODS ? (
                <button onClick={() => setShowAll((v) => !v)} className="btn-ghost text-xs">
                  {showAll ? 'Ver menos' : `Ver ${soloRows.length - TOP_FOODS} opciones más`}
                </button>
              ) : <span />}
              {hasCustomPlan && (
                <button onClick={() => setQty({})} className="btn-ghost text-xs">Limpiar plan</button>
              )}
            </div>
          </div>

          {/* Noqueo por arma y calidad */}
          {torporTotal !== null && !species.taming.nonViolent && (
            <div className="panel p-4">
              <p className="display mb-3 text-xs font-semibold uppercase tracking-widest text-tek">Noqueo · torpor {Math.round(torporTotal).toLocaleString()}</p>
              <div className="mb-3 flex flex-wrap items-end gap-3">
                <label className="text-sm">
                  <span className="mb-1 block text-xs font-medium text-bone-dim">Arma</span>
                  <select value={weaponId} onChange={(e) => setWeaponId(e.target.value)} className="input-field w-56">
                    {WEAPONS.map((w) => (
                      <option key={w.id} value={w.id}>{w.label}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-xs font-medium text-bone-dim">Calidad (daño %)</span>
                  <input type="number" step="1" min="100" inputMode="numeric" value={quality} onChange={(e) => setQuality(e.target.value)} className="input-field w-24" />
                </label>
                <p className="flex items-center gap-2 pb-1 text-lg">
                  <ItemImage name={weapon.weaponImage} size={30} fallback="🏹" />
                  <ItemImage name={weapon.itemImage} size={26} fallback="➶" />
                  <strong className="display text-2xl text-tek">{hitsToKnockout(torporTotal, weapon, qualityNum)}</strong>{' '}
                  <span className="text-sm text-bone-dim">{weapon.ammo}</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-sm sm:grid-cols-3">
                {WEAPONS.filter((w) => w.id !== weaponId).map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setWeaponId(w.id)}
                    className="flex items-center justify-between gap-1.5 rounded-lg border border-surface-3/60 bg-surface-0/40 px-2.5 py-1.5 text-left hover:border-tek-dark"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <ItemImage name={w.weaponImage} size={22} fallback="🏹" />
                      <span className="truncate text-xs text-bone-dim">{w.label}</span>
                    </span>
                    <span className="display ml-1 tabular-nums">{hitsToKnockout(torporTotal, w, qualityNum)}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-bone-faint">
                Calidad 100% = arma primitiva. No incluye multiplicador de headshot ni resistencias especiales.
              </p>
            </div>
          )}

          <p className="text-xs text-bone-faint">
            TE 100% teórica: +{tameBonusLevels(lvl, 1)} niveles → Nv {lvl + tameBonusLevels(lvl, 1)}. Tras domar,{' '}
            <Link to={`/inspector/${encodeURIComponent(species.id)}`} className="text-tek underline">inspecciona dónde cayeron los puntos</Link>.
          </p>
        </>
      )}
    </section>
  )
}
