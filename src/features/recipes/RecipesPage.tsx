import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import recipesJson from '../../data/recipes.json'
import { getSpecies, getTamingFoods } from '../../data'
import { CreatureImage, ItemImage } from '../../ui/GameImage'
import { useSettings } from '../../store/settings'

interface Recipe {
  name: string
  kind: 'kibble' | 'cocina'
  image: string | null
  ingredients: { q: number; n: string }[]
}
const DATA = recipesJson as { recipes: Recipe[]; eggs: Record<string, string[]> }

export const recipeSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

/** Colores como los del propio kibble in-game */
const KIBBLE_COLORS: Record<string, string> = {
  'Basic Kibble': '#8d9aa5',
  'Simple Kibble': '#5fbf6e',
  'Regular Kibble': '#4d9fd6',
  'Superior Kibble': '#b28cf0',
  'Exceptional Kibble': '#e8c14e',
  'Extraordinary Kibble': '#4dd7e8',
}

/** Lista + detalle de recetas (kibbles y cocina) con iconos reales del juego. */
export function RecipesPage() {
  const { slug } = useParams()
  const recipe = slug ? DATA.recipes.find((r) => recipeSlug(r.name) === slug) : undefined
  if (slug) {
    return recipe ? (
      <RecipeDetail recipe={recipe} />
    ) : (
      <p className="panel p-6 text-center text-bone-dim">
        Receta no encontrada. <Link to="/recetas" className="text-amber underline">Ver todas</Link>
      </p>
    )
  }

  const kibbles = DATA.recipes.filter((r) => r.kind === 'kibble')
  const cooking = DATA.recipes.filter((r) => r.kind === 'cocina')
  return (
    <section aria-label="Recetas" className="space-y-6">
      <div>
        <h2 className="display text-2xl font-bold">Recetas</h2>
        <p className="text-sm text-bone-dim">Kibbles y cocina — todo lo que se hace en la olla.</p>
      </div>
      {[['Kibbles', kibbles] as const, ['Cocina', cooking] as const].map(([title, list]) => (
        <div key={title}>
          <h3 className="display mb-3 text-sm font-semibold uppercase tracking-widest text-bone-faint">{title}</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {list.map((r) => (
              <li key={r.name}>
                <Link
                  to={`/recetas/${recipeSlug(r.name)}`}
                  className="panel panel-hover flex items-center gap-3 p-3"
                  style={KIBBLE_COLORS[r.name] ? { borderColor: `color-mix(in srgb, ${KIBBLE_COLORS[r.name]} 45%, transparent)` } : undefined}
                >
                  <ItemImage name={r.name} size={34} fallback="🍲" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold" style={{ color: KIBBLE_COLORS[r.name] }}>{r.name}</span>
                    <span className="block truncate text-[11px] text-bone-faint">
                      {r.ingredients.map((i) => i.n.split(',')[0]).join(' · ')}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="text-[11px] text-bone-faint">
        Recetas: <a href="https://ark.wiki.gg" target="_blank" rel="noreferrer" className="underline">ark.wiki.gg</a> (CC BY-NC-SA 3.0).
        Todas se cocinan en olla o cocina industrial.
      </p>
    </section>
  )
}

function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const navigate = useNavigate()
  const eggs = DATA.eggs[recipe.name]
  const { gameVersion } = useSettings()

  /** criaturas cuyo kibble preferido (afinidad completa) es este */
  const preferredBy = useMemo(() => {
    if (recipe.kind !== 'kibble') return []
    return getSpecies(gameVersion).filter(
      (s) => getTamingFoods(s.name)?.find((f) => f.name.endsWith('Kibble'))?.name === recipe.name,
    )
  }, [recipe, gameVersion])

  return (
    <section aria-label={`Receta de ${recipe.name}`} className="space-y-4">
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/recetas'))}
          aria-label="Volver"
          className="btn-ghost px-2.5 py-1.5 text-lg leading-none"
        >
          ←
        </button>
        <ItemImage name={recipe.name} size={44} fallback="🍲" />
        <div>
          <h2 className="display text-2xl font-bold leading-tight" style={{ color: KIBBLE_COLORS[recipe.name] }}>
            {recipe.name}
          </h2>
          <p className="text-xs text-bone-faint">Olla de cocina / Cocina industrial</p>
        </div>
      </div>

      {/* Ingredientes */}
      <div className="panel p-4">
        <p className="display mb-3 text-xs font-semibold uppercase tracking-widest text-amber">Ingredientes</p>
        <ul className="grid gap-2">
          {recipe.ingredients.map((ing) => {
            const first = ing.n.split(',')[0].trim()
            const linked = DATA.recipes.find((r) => r.name === first)
            const row = (
              <span className="flex items-center gap-2.5">
                <ItemImage name={first} size={28} />
                <span className="text-sm">
                  <strong className="display">×{ing.q}</strong>{' '}
                  <span className={linked ? 'underline' : ''}>{ing.n}</span>
                </span>
              </span>
            )
            return (
              <li key={ing.n}>
                {linked ? (
                  <Link to={`/recetas/${recipeSlug(linked.name)}`} className="block rounded-lg px-1 py-0.5 hover:bg-surface-2/50">
                    {row}
                  </Link>
                ) : (
                  row
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {/* Huevos válidos (kibbles) */}
      {eggs && eggs.length > 0 && (
        <div className="panel p-4">
          <p className="display mb-3 text-xs font-semibold uppercase tracking-widest text-amber">
            Huevos válidos ({eggs.length})
          </p>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm text-bone-dim sm:grid-cols-3">
            {eggs.map((e) => (
              <li key={e} className="flex items-center gap-1.5">
                <ItemImage name={e} size={22} fallback="🥚" />
                <span className="truncate">{e.replace(/ Egg$/, '')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preferido por */}
      {preferredBy.length > 0 && (
        <div className="panel p-4">
          <p className="display mb-3 text-xs font-semibold uppercase tracking-widest text-amber">
            Preferido por ({preferredBy.length})
          </p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {preferredBy.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/criaturas/${encodeURIComponent(s.id)}?tab=tameo`}
                  className="flex items-center gap-2 rounded-lg border border-surface-3/60 bg-surface-0/40 px-2 py-1.5 hover:border-amber-dark"
                >
                  <CreatureImage name={s.name} size={30} />
                  <span className="truncate text-xs font-medium">{s.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
