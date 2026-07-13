/**
 * Pipeline de recetas: baja de ark.wiki.gg (CC BY-NC-SA, uso personal) las recetas
 * de kibbles y cocina + las listas de huevos por tamaño, y hornea src/data/recipes.json.
 * Uso: node scripts/build-recipes.mjs
 */
import { writeFileSync } from 'node:fs'

const API = 'https://ark.wiki.gg/api.php'
const UA = { 'User-Agent': 'DododexV2-personal/1.0 (app personal, contacto en repo)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function wikitext(page) {
  const res = await fetch(`${API}?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json&formatversion=2`, { headers: UA })
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${page}`)
  const json = await res.json()
  return json?.parse?.wikitext ?? null
}

/** infobox consumable → { image, ingredients[{q,n}] } */
function parseRecipe(w) {
  const get = (key) => w.match(new RegExp(`\\|\\s*${key}\\s*=\\s*([^\\n|]+)`, 'i'))?.[1].trim() ?? null
  const ingredients = []
  for (let i = 1; i <= 10; i++) {
    const n = get(`ingredient${i}`)
    if (!n) break
    const q = Number(get(`quantity${i}`) ?? 1) || 1
    ingredients.push({ q, n: n.replace(/\[\[|\]\]/g, '') })
  }
  return { image: get('image'), ingredients }
}

const KIBBLES = [
  { name: 'Basic Kibble', egg: 'Extra Small Egg' },
  { name: 'Simple Kibble', egg: 'Small Egg' },
  { name: 'Regular Kibble', egg: 'Medium Egg' },
  { name: 'Superior Kibble', egg: 'Large Egg' },
  { name: 'Exceptional Kibble', egg: 'Extra Large Egg' },
  { name: 'Extraordinary Kibble', egg: 'Special Egg' },
]
const COOKING = [
  'Focal Chili', 'Lazarus Chowder', 'Enduro Stew', 'Calien Soup', 'Fria Curry',
  'Shadow Steak Saute', 'Battle Tartare', 'Sweet Vegetable Cake', 'Broth of Enlightenment',
  'Medical Brew', 'Energy Brew', 'Mindwipe Tonic',
]

const recipes = []
for (const { name } of KIBBLES) {
  const w = await wikitext(name)
  recipes.push({ name, kind: 'kibble', ...parseRecipe(w) })
  console.log('✓', name)
  await sleep(1200)
}
for (const name of COOKING) {
  const w = await wikitext(name)
  recipes.push({ name, kind: 'cocina', ...parseRecipe(w) })
  console.log('✓', name)
  await sleep(1200)
}

const eggs = {}
for (const { name, egg } of KIBBLES) {
  const w = await wikitext(egg)
  const m = w.match(/\{\{ItemList\|([^}]+)\}\}/)
  eggs[name] = m ? m[1].split('|').map((x) => x.trim()).filter(Boolean) : []
  console.log('✓', egg, `(${eggs[name].length} huevos)`)
  await sleep(1200)
}

writeFileSync(
  'src/data/recipes.json',
  JSON.stringify({ source: 'ark.wiki.gg (CC BY-NC-SA 3.0)', generated: new Date().toISOString(), recipes, eggs }),
)
console.log(`OK → src/data/recipes.json (${recipes.length} recetas)`)
