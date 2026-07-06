import { NavLink, Route, Routes } from 'react-router-dom'
import { HomePage } from './features/home/HomePage'
import { CreaturesPage } from './features/creatures/CreaturesPage'
import { InspectorPage } from './features/inspector/InspectorPage'
import { LibraryPage } from './features/library/LibraryPage'
import { useSettings } from './store/settings'
import { getDataInfo } from './data'
import { DinoFootprint, IconDino, IconHome, IconLibrary, IconScan } from './ui/icons'

const NAV = [
  { to: '/', icon: IconHome, label: 'Inicio', end: true },
  { to: '/criaturas', icon: IconDino, label: 'Criaturas' },
  { to: '/inspector', icon: IconScan, label: 'Inspector' },
  { to: '/dinos', icon: IconLibrary, label: 'Mis Dinos' },
]

export default function App() {
  const { version, setVersion } = useSettings()
  const info = getDataInfo(version)

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <header className="flex items-center justify-between gap-2 px-4 py-4">
        <NavLink to="/" className="flex items-center gap-2.5">
          <DinoFootprint size={30} />
          <span className="display text-xl font-bold tracking-wide">
            DODODEX <span className="text-amber">V2</span>
          </span>
        </NavLink>
        {/* Toggle ASA/ASE: cambia constantes Y reglas del motor (Speed, caps…) */}
        <div
          role="group"
          aria-label="Versión del juego"
          className="flex rounded-xl border border-surface-3 bg-surface-1 p-1"
        >
          {(['ASA', 'ASE'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVersion(v)}
              aria-pressed={version === v}
              className={`display rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                version === v
                  ? 'bg-gradient-to-br from-amber to-amber-deep text-surface-0 shadow-lg shadow-amber-deep/30'
                  : 'text-bone-dim hover:text-bone'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-4 pb-28">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/criaturas" element={<CreaturesPage />} />
          <Route path="/inspector/:speciesId?" element={<InspectorPage />} />
          <Route path="/dinos" element={<LibraryPage />} />
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
        className="fixed inset-x-0 bottom-0 z-10 border-t border-amber-deep/15 bg-surface-1/90 backdrop-blur-lg"
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
