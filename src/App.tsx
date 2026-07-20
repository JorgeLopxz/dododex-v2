import { Navigate, NavLink, Route, Routes, useParams } from 'react-router-dom'
import { HomePage } from './features/home/HomePage'
import { CreatureDetailPage } from './features/creatures/CreatureDetailPage'
import { MaterialsPage } from './features/materials/MaterialsPage'
import { RecipesPage } from './features/recipes/RecipesPage'
import { AssistantPage } from './features/assistant/AssistantPage'
import { getDataInfo } from './data'
import { ClawMark, IconBrain, IconPick, IconPot } from './ui/icons'
import { useSettings } from './store/settings'

const NAV = [
  { to: '/', icon: ClawMark, label: 'Criaturas', end: true },
  { to: '/materiales', icon: IconPick, label: 'Recursos' },
  { to: '/recetas', icon: IconPot, label: 'Recetas' },
  { to: '/ia', icon: IconBrain, label: 'Asistente' },
]

/** URLs antiguas /tameo/:id e /inspector/:id → pestaña correspondiente de la súper-ficha */
function LegacyRedirect({ tab }: { tab: string }) {
  const { speciesId } = useParams()
  return <Navigate to={speciesId ? `/criaturas/${speciesId}?tab=${tab}` : '/'} replace />
}

export default function App() {
  const { gameVersion, setGameVersion } = useSettings()
  const info = getDataInfo(gameVersion)

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <header className="flex items-center gap-3 px-4 py-4">
        {/* Selector de juego: sello de dos posiciones, ASA y ASE tienen dinos/recursos/reglas distintos */}
        <div
          role="group"
          aria-label="Versión del juego"
          title="Cambia entre ARK: Survival Ascended y Survival Evolved"
          className="mono flex border border-bone text-xs font-semibold"
        >
          {([
            ['asa', 'ASA'],
            ['ase', 'ASE'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setGameVersion(value)}
              aria-pressed={gameVersion === value}
              className={`px-3 py-1.5 tracking-widest transition-colors ${
                gameVersion === value ? 'bg-bone text-surface-0' : 'text-bone-dim hover:text-bone'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <NavLink to="/" className="ml-auto flex items-center gap-2.5">
          <ClawMark size={26} className="text-amber" />
          <span className="flex flex-col leading-none">
            <span className="display text-xl font-semibold tracking-wide">ArkMaster</span>
            <span className="kicker text-[9px]">Expedición ARK · Vol. II</span>
          </span>
        </NavLink>
      </header>

      <main className="flex-1 px-4 pb-28">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/criaturas" element={<Navigate to="/" replace />} />
          <Route path="/criaturas/:speciesId" element={<CreatureDetailPage />} />
          <Route path="/inspector/:speciesId?" element={<LegacyRedirect tab="inspector" />} />
          <Route path="/tameo/:speciesId?" element={<LegacyRedirect tab="tameo" />} />
          <Route path="/materiales" element={<MaterialsPage />} />
          <Route path="/recetas/:slug?" element={<RecipesPage />} />
          <Route path="/ia" element={<AssistantPage />} />
          <Route path="/dinos" element={<Navigate to="/" replace />} />
          <Route path="/ajustes" element={<Navigate to="/" replace />} />
        </Routes>
        <p className="mono mt-10 text-center text-[10px] leading-relaxed text-bone-faint">
          Registro Nº {info.version} · actualizado {new Date(info.generated).toLocaleDateString()} · datos derivados de
          ARK Smart Breeding (MIT, © cadon)
          <br />
          Expediente no oficial de uso personal, sin afiliación con Studio Wildcard
        </p>
      </main>

      {/* Navegación inferior: zona de alcance del pulgar */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-bone bg-surface-1/95 backdrop-blur-sm"
      >
        <div className="mx-auto flex max-w-3xl">
          {NAV.map(({ to, icon: Icon, label, end }, i) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `mono flex flex-1 flex-col items-center gap-1 py-2.5 text-[9px] font-semibold tracking-[0.16em] uppercase transition-colors ${
                  i > 0 ? 'border-l border-surface-3' : ''
                } ${isActive ? 'bg-verdigris text-surface-0' : 'text-bone-faint hover:text-bone-dim'}`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
