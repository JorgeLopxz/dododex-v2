import { POINT_STATS } from '../../engine/types'
import { STAT_META } from '../../ui/statMeta'
import { PRESET_LABEL, useSettings, type ServerPreset } from '../../store/settings'

/**
 * Perfil de multiplicadores del servidor (PerLevelStatsMultiplier): vive dentro
 * del Inspector porque es lo único a lo que afecta. Sin esto bien puesto, la
 * extracción da puntos erróneos en servers boosted (fallo conocido de Dododex).
 */
export function ServerProfile() {
  const s = useSettings()

  return (
    <details className="panel group p-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4 text-sm">
        <span className="flex items-center gap-2 font-medium text-bone-dim">
          <span className="kicker">Perfil del servidor</span>
          <span className="mono border border-surface-3 bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase text-bone-faint">{PRESET_LABEL[s.preset]}</span>
        </span>
        <span className="text-bone-faint transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
      </summary>
      <div className="space-y-4 border-t border-dashed border-surface-3 p-4">
        <div role="group" aria-label="Preset de servidor" className="grid gap-2">
          {(Object.keys(PRESET_LABEL) as ServerPreset[]).map((p) => (
            <button key={p} onClick={() => s.setPreset(p)} aria-pressed={s.preset === p} className="mode-tab text-left">
              {PRESET_LABEL[p]}
              <span className="block text-[11px] font-normal text-bone-faint">
                {p === 'official' && 'Servidores oficiales de Wildcard (con nerf salud/melee post-tame)'}
                {p === 'vanilla' && 'No oficial con valores por defecto del juego, sin nerf'}
                {p === 'custom' && 'Servidor boosted: define tus PerLevelStatsMultiplier'}
              </span>
            </button>
          ))}
        </div>

        {s.preset === 'custom' && (
          <div>
            <p className="mb-3 text-xs text-bone-dim">
              Los <code className="text-amber">PerLevelStatsMultiplier_DinoWild / _DinoTamed</code> de tu Game.ini. Déjalo en 1 si no lo tocaste.
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
                className="size-4 accent-amber-deep"
              />
              Mantener nerf oficial post-tame (salud/melee)
            </label>
          </div>
        )}
      </div>
    </details>
  )
}
