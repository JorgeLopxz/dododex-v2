import { Navigate, NavLink, Route, Routes, useParams } from 'react-router-dom'
import { HomePage } from './features/home/HomePage'
import { CreatureDetailPage } from './features/creatures/CreatureDetailPage'
import { MaterialsPage } from './features/materials/MaterialsPage'
import { RecipesPage } from './features/recipes/RecipesPage'
import { AssistantPage } from './features/assistant/AssistantPage'
import { getDataInfo } from './data'
import { DinoFootprint, IconBrain, IconHome, IconPick, IconPot } from './ui/icons'
import { useSettings } from './store/settings'

const NAV = [
  { to: '/', icon: IconHome, label: 'Buscar', end: true },
  { to: '/materiales', icon: IconPick, label: 'Materiales' },
  { to: '/recetas', icon: IconPot, label: 'Recetas' },
  { to: '/ia', icon: IconBrain, label: 'IA' },
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
      <header className="flex items-center justify-between gap-3 px-4 py-4">
        <div className="flex items-center gap-3">
          <NavLink to="/" className="flex items-center gap-2.5">
            <DinoFootprint size={30} />
            <span className="display text-xl font-bold tracking-wide">
              DODODEX <span className="text-amber">V2</span>
            </span>
          </NavLink>
          <div role="group" aria-label="Versión del juego" className="flex rounded-lg bg-surface-0/60 p-1 text-[11px] font-semibold uppercase tracking-widest">
            {([
              ['asa', 'ASA'],
              ['ase', 'ASE'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setGameVersion(value)}
                aria-pressed={gameVersion === value}
                className={`mode-tab px-2.5 py-1 ${gameVersion === value ? 'border-amber-deep text-amber' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <span className="display text-[11px] font-semibold uppercase tracking-widest text-bone-faint">
          {gameVersion === 'asa' ? 'ASA · Vanilla' : 'ASE · Vanilla'}
        </span>
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
        <p className="mt-10 text-center text-[11px] leading-relaxed text-bone-faint">
          Datos v{info.version} · {new Date(info.generated).toLocaleDateString()} · derivados de ARK Smart Breeding
          (MIT, © cadon)
          <br />
          App no oficial para uso personal, sin afiliación con Studio Wildcard
        </p>
      </main>

      {/* Navegación inferior: zona de alcance del pulgar */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-metal-dim bg-surface-1/90 backdrop-blur-lg"
      >
        <div className="mx-auto flex max-w-3xl">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-amber' : 'text-bone-faint hover:text-bone-dim'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute -top-px h-0.5 w-10 rounded-full bg-gradient-to-r from-amber to-amber-deep" />
                  )}
                  <Icon />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
