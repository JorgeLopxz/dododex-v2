import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { db } from '../../store/db'
import { getSpecies } from '../../data'
import { useSettings } from '../../store/settings'
import { IconDino, IconLibrary, IconScan } from '../../ui/icons'

/** Home: acceso directo a lo esencial + visión del roadmap (Dododex + Wikily en una). */
export function HomePage() {
  const { version } = useSettings()
  const [count, setCount] = useState(0)
  useEffect(() => {
    db.dinos.count().then(setCount)
  }, [])

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="pt-4 text-center">
        <h2 className="display text-3xl font-bold leading-tight sm:text-4xl">
          Tu manada, <span className="text-tek">bajo control</span>
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-bone-dim">
          El companion de ARK que une lo mejor de Dododex y Wikily — y hace lo que ninguno:
          <strong className="text-bone"> ver los puntos de stats de tus dinos ya domados.</strong>
        </p>
        <div className="claw-divider mx-auto mt-5 max-w-xs" aria-hidden="true" />
      </section>

      {/* Acciones principales */}
      <section className="grid gap-3 sm:grid-cols-3" aria-label="Herramientas">
        <Link to="/inspector" className="panel panel-hover flex flex-col gap-2 p-5 sm:col-span-3 sm:flex-row sm:items-center sm:gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-tek-deep/20 text-tek">
            <IconScan size={26} />
          </span>
          <span className="flex-1">
            <span className="display block text-lg font-semibold">
              Inspector post-tame <span className="rounded-md bg-tek-deep/25 px-1.5 py-0.5 text-xs font-bold text-tek">EXCLUSIVO</span>
            </span>
            <span className="text-sm text-bone-dim">
              ¿Cuántos puntos cayeron en cada stat de tu tame? Dododex no puede decírtelo. Nosotros sí.
            </span>
          </span>
          <span className="btn-primary hidden sm:block">Analizar dino →</span>
        </Link>

        <Link to="/criaturas" className="panel panel-hover flex items-center gap-3 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-3 text-bone-dim">
            <IconDino />
          </span>
          <span>
            <span className="display block font-semibold">Criaturas</span>
            <span className="text-xs text-bone-dim">{getSpecies(version).length} especies · {version}</span>
          </span>
        </Link>

        <Link to="/dinos" className="panel panel-hover flex items-center gap-3 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-3 text-bone-dim">
            <IconLibrary />
          </span>
          <span>
            <span className="display block font-semibold">Mis Dinos</span>
            <span className="text-xs text-bone-dim">{count} guardados</span>
          </span>
        </Link>

        <div className="panel flex items-center gap-3 p-4 opacity-80">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-3 text-bone-faint">🧬</span>
          <span>
            <span className="display block font-semibold text-bone-dim">Cría y mutaciones</span>
            <span className="text-xs text-bone-faint">próximamente</span>
          </span>
        </div>
      </section>

      {/* Roadmap: la visión completa */}
      <section aria-label="En camino">
        <h3 className="display mb-3 text-sm font-semibold uppercase tracking-widest text-bone-faint">
          En camino — lo mejor de los dos mundos
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          {[
            ['🧮 Calculadora de tameo', 'comida, narcóticos, torpor'],
            ['📱 PWA instalable', 'offline total, como app'],
            ['🧬 Cría y mutaciones', 'árbol genealógico, planificador'],
            ['🗺️ Mapas interactivos', 'recursos, spawns, cuevas'],
            ['🎁 Tablas de loot', 'con simulador de cajas'],
            ['⏰ Scheduler de imprint', 'cuddles y alarmas'],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-xl border border-surface-3/60 bg-surface-1/50 px-3 py-2.5">
              <span className="block font-medium text-bone-dim">{title}</span>
              <span className="text-xs text-bone-faint">{desc}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
