import { POINT_STATS } from '../../engine/types'
import { STAT_META } from '../../ui/statMeta'
import { PRESET_LABEL, useSettings, type ServerPreset } from '../../store/settings'

/**
 * Perfiles de servidor: sin multiplicadores correctos, la extracción da puntos
 * erróneos en servers boosted (fallo conocido de Dododex — 23 votos en su Canny).
 */
export function SettingsPage() {
  const s = useSettings()

  return (
    <section aria-label="Ajustes" className="mx-auto max-w-lg space-y-4">
      <div>
        <h2 className="display text-2xl font-bold">Ajustes del servidor</h2>
        <p className="text-sm text-bone-dim">
          Para que los puntos salgan exactos, esto debe reflejar tu servidor.
        </p>
      </div>

      <div className="panel p-5">
        <h3 className="display mb-3 font-semibold">Perfil</h3>
        <div role="group" aria-label="Preset de servidor" className="grid gap-2">
          {(Object.keys(PRESET_LABEL) as ServerPreset[]).map((p) => (
            <button
              key={p}
              onClick={() => s.setPreset(p)}
              aria-pressed={s.preset === p}
              className="mode-tab text-left"
            >
              {PRESET_LABEL[p]}
              <span className="block text-[11px] font-normal text-bone-faint">
                {p === 'official' && 'Servidores oficiales de Wildcard (Add 0.14 salud/melee, Affinity 0.44 melee)'}
                {p === 'vanilla' && 'No oficial con valores por defecto del juego, sin nerf post-tame'}
                {p === 'custom' && 'Servidor boosted: define tus PerLevelStatsMultiplier'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {s.preset === 'custom' && (
        <div className="panel p-5">
          <h3 className="display mb-1 font-semibold">Multiplicadores por stat</h3>
          <p className="mb-4 text-xs text-bone-dim">
            Los <code className="text-tek">PerLevelStatsMultiplier_DinoWild / _DinoTamed</code> de tu Game.ini.
            Déjalo en 1 si no lo tocaste.
          </p>
          <div className="mb-2 grid grid-cols-[1fr_5rem_5rem] items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-bone-faint">
            <span>Stat</span>
            <span className="text-center">Salvaje</span>
            <span className="text-center">Domado</span>
          </div>
          <div className="grid gap-2">
            {POINT_STATS.filter((k) => k !== 'speed').map((k) => {
              const meta = STAT_META[k]
              return (
                <div key={k} className="grid grid-cols-[1fr_5rem_5rem] items-center gap-2">
                  <span className="flex items-center gap-1.5 text-sm text-bone-dim">
                    <span aria-hidden="true" style={{ color: meta.color }}>{meta.icon}</span>
                    {meta.label}
                  </span>
                  {(['IwM', 'IdM'] as const).map((kind) => (
                    <input
                      key={kind}
                      type="number"
                      step="0.1"
                      min="0.1"
                      aria-label={`${meta.label} ${kind === 'IwM' ? 'salvaje' : 'domado'}`}
                      value={(kind === 'IwM' ? s.customIwM[k] : s.customIdM[k]) ?? 1}
                      onChange={(e) => s.setCustomMult(kind, k, Number(e.target.value))}
                      className="input-field px-2 py-1.5 text-center text-sm"
                    />
                  ))}
                </div>
              )
            })}
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-bone-dim">
            <input
              type="checkbox"
              checked={s.customNerf}
              onChange={(e) => s.setCustomNerf(e.target.checked)}
              className="size-4 accent-(--color-tek-deep)"
            />
            Mantener nerf oficial post-tame (salud/melee)
          </label>
        </div>
      )}

      <p className="text-xs text-bone-faint">
        Próximamente: importar Game.ini directamente, TamingSpeedMultiplier (calculadora de tameo) y ajustes de
        singleplayer.
      </p>
    </section>
  )
}
