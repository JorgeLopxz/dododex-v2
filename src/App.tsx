import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { HomePage } from './features/home/HomePage'
import { CreatureDetailPage } from './features/creatures/CreatureDetailPage'
import { InspectorPage } from './features/inspector/InspectorPage'
import { LibraryPage } from './features/library/LibraryPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { TamingPage } from './features/taming/TamingPage'
import { getDataInfo } from './data'
import { DinoFootprint, IconHome, IconLibrary, IconScan } from './ui/icons'

const NAV = [
  { to: '/', icon: IconHome, label: 'Buscar', end: true },
  { to: '/inspector', icon: IconScan, label: 'Inspector' },
  { to: '/dinos', icon: IconLibrary, label: 'Mis Dinos' },
]

export default function App() {
  const info = getDataInfo()

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <header className="flex items-center justify-between gap-2 px-4 py-4">
        <NavLink to="/" className="flex items-center gap-2.5">
          <DinoFootprint size={30} />
          <span className="display text-xl font-bold tracking-wide">
            DODODEX <span className="text-tek">V2</span>
          </span>
        </NavLink>
        <NavLink
          to="/ajustes"
          aria-label="Ajustes del servidor"
          className={({ isActive }) =>
            `grid size-9 place-items-center rounded-lg border border-surface-3 transition-colors ${
              isActive ? 'border-tek-deep/50 text-tek' : 'text-bone-dim hover:text-bone'
            }`
          }
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3.2" />
            <path d="M12 2.8v3M12 18.2v3M21.2 12h-3M5.8 12h-3M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1M18.5 18.5l-2.1-2.1M7.6 7.6 5.5 5.5" />
          </svg>
        </NavLink>
      </header>

      <main className="flex-1 px-4 pb-28">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/criaturas" element={<Navigate to="/" replace />} />
          <Route path="/criaturas/:speciesId" element={<CreatureDetailPage />} />
          <Route path="/inspector/:speciesId?" element={<InspectorPage />} />
          <Route path="/dinos" element={<LibraryPage />} />
          <Route path="/tameo/:speciesId?" element={<TamingPage />} />
          <Route path="/ajustes" element={<SettingsPage />} />
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
        className="fixed inset-x-0 bottom-0 z-10 border-t border-tek-deep/15 bg-surface-1/90 backdrop-blur-lg"
      >
        <div className="mx-auto flex max-w-3xl">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-tek' : 'text-bone-faint hover:text-bone-dim'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute -top-px h-0.5 w-10 rounded-full bg-gradient-to-r from-tek to-tek-deep" />
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
