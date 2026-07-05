import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { CreaturesPage } from './features/creatures/CreaturesPage'
import { InspectorPage } from './features/inspector/InspectorPage'
import { LibraryPage } from './features/library/LibraryPage'
import { useSettings } from './store/settings'
import { getDataInfo } from './data'

const NAV = [
  { to: '/criaturas', icon: '🦖', label: 'Criaturas' },
  { to: '/inspector', icon: '🔍', label: 'Inspector' },
  { to: '/dinos', icon: '📚', label: 'Mis Dinos' },
]

export default function App() {
  const { version, setVersion } = useSettings()
  const info = getDataInfo(version)

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <header className="flex items-center justify-between gap-2 px-4 py-3">
        <h1 className="text-lg font-bold tracking-wide text-amber">
          🦴 DODODEX <span className="text-bone-dim">V2</span>
        </h1>
        {/* Toggle ASA/ASE: cambia constantes Y reglas del motor (Speed, caps…) */}
        <div role="group" aria-label="Versión del juego" className="flex rounded-lg bg-surface-1 p-1">
          {(['ASA', 'ASE'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVersion(v)}
              aria-pressed={version === v}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                version === v ? 'bg-amber-deep text-surface-0' : 'text-bone-dim hover:text-bone'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-4 pb-24">
        <Routes>
          <Route path="/" element={<Navigate to="/criaturas" replace />} />
          <Route path="/criaturas" element={<CreaturesPage />} />
          <Route path="/inspector/:speciesId?" element={<InspectorPage />} />
          <Route path="/dinos" element={<LibraryPage />} />
        </Routes>
        <p className="mt-8 text-center text-xs text-bone-faint">
          Datos v{info.version} · {new Date(info.generated).toLocaleDateString()} · derivados de ARK Smart Breeding
          (MIT, © cadon) · App no oficial, sin afiliación con Studio Wildcard
        </p>
      </main>

      {/* Navegación inferior: zona de alcance del pulgar (ver ANALISIS.md §6.2) */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 border-t border-surface-3 bg-surface-1/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-3xl">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
                  isActive ? 'text-amber' : 'text-bone-dim'
                }`
              }
            >
              <span aria-hidden="true" className="text-xl">
                {n.icon}
              </span>
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
