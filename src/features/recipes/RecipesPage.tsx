import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import recipesJson from '../../data/recipes.json'
import { getSpecies, getTamingFoods } from '../../data'
import { CreatureImage, ItemImage } from '../../ui/GameImage'
import { SectionRule } from '../../ui/SectionRule'
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
      <p className="panel p-6 text-center italic text-bone-dim">
        Receta no encontrada. <Link to="/recetas" className="not-italic text-amber underline">Ver todas</Link>
      </p>
    )
  }

  const kibbles = DATA.recipes.filter((r) => r.kind === 'kibble')
  const cooking = DATA.recipes.filter((r) => r.kind === 'cocina')
  return (
    <section aria-label="Recetas" className="space-y-6">
      <div className="border-b-2 border-bone pb-2">
        <p className="kicker">Recetario de campo</p>
        <h2 className="display text-2xl font-semibold">Recetas</h2>
        <p className="text-sm italic text-bone-dim">Kibbles y cocina — todo lo que se hace en la olla.</p>
      </div>
      {[['Kibbles', kibbles] as const, ['Cocina', cooking] as const].map(([title, list]) => (
        <div key={title}>
          <SectionRule label={title} />
          <ul className="grid gap-2 sm:grid-cols-2">
            {list.map((r) => (
              <li key={r.name}>
                <Link
                  to={`/recetas/${recipeSlug(r.name)}`}
                  className="panel panel-hover flex items-center gap-3 border-t-[3px] p-3"
                  style={{ borderTopColor: KIBBLE_COLORS[r.name] ?? 'var(--color-surface-3)' }}
                >
                  <ItemImage name={r.name} size={34} fallback="🍲" />
                  <span className="min-w-0 flex-1">
                    <span className="display block truncate font-semibold" style={{ color: KIBBLE_COLORS[r.name] }}>{r.name}</span>
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
      <p className="text-[11px] italic text-bone-faint">
        Recetas: <a href="https://ark.wiki.gg" target="_blank" rel="noreferrer" className="not-italic underline">ark.wiki.gg</a> (CC BY-NC-SA 3.0).
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
          <h2 className="display text-2xl font-semibold leading-tight" style={{ color: KIBBLE_COLORS[recipe.name] }}>
            {recipe.name}
          </h2>
          <p className="kicker">Olla de cocina / Cocina industrial</p>
        </div>
      </div>

      {/* Ingredientes */}
      <div className="panel p-4">
        <p className="kicker mb-3">Ingredientes</p>
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
                  <Link to={`/recetas/${recipeSlug(linked.name)}`} className="block px-1 py-0.5 hover:bg-surface-1/60">
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
          <p className="kicker mb-3">Huevos válidos ({eggs.length})</p>
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
          <p className="kicker mb-3">Preferido por ({preferredBy.length})</p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {preferredBy.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/criaturas/${encodeURIComponent(s.id)}?tab=tameo`}
                  className="flex items-center gap-2 border border-surface-3 bg-surface-1/40 px-2 py-1.5 hover:border-amber"
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
