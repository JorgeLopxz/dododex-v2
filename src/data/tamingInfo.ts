/**
 * Método de tameo REAL por criatura (verificado en ark.wiki.gg), para las especies
 * cuyo tameo NO se representa con la calculadora de comida por afinidad estándar:
 * tames de huevo/cría, pasivos especiales (sangre, Element…) y mecánicas únicas.
 *
 * No inventamos cantidades: describimos el método correcto. Para el detalle fino,
 * el usuario tiene el Asistente IA y el enlace a la wiki.
 *
 * Se busca por nombre base (sin variantes Aberrant/Tek/Astral…).
 */
export type TamingMethod = 'egg' | 'passive' | 'special' | 'knockout'

export interface TamingInfo {
  method: TamingMethod
  /** descripción corta del método real */
  note: string
}

const TAMING_INFO: Record<string, TamingInfo> = {
  // ——— No se doman: se obtienen de huevo, cría o evolución ———
  Deinonychus: { method: 'egg', note: 'No se doma: roba un huevo fértil de un nido y críalo.' },
  'Rock Drake': { method: 'egg', note: 'No se doma: roba un huevo en el Abismo (Aberration) y críalo.' },
  Magmasaur: { method: 'egg', note: 'No se doma: roba un huevo en zonas de lava y críalo.' },
  'Fire Wyvern': { method: 'egg', note: 'No se doma: roba un huevo y cría a la cría con Leche de Wyvern.' },
  'Ice Wyvern': { method: 'egg', note: 'No se doma: roba un huevo y cría a la cría con Leche de Wyvern.' },
  'Lightning Wyvern': { method: 'egg', note: 'No se doma: roba un huevo y cría a la cría con Leche de Wyvern.' },
  'Poison Wyvern': { method: 'egg', note: 'No se doma: roba un huevo y cría a la cría con Leche de Wyvern.' },
  Gigantoraptor: { method: 'egg', note: 'No se doma: coge un huevo de un nido y críalo (los adultos son hostiles).' },
  Elderclaw: { method: 'egg', note: 'Los adultos no se doman: se obtiene criando o desde su forma joven.' },
  Solwyn: { method: 'special', note: 'No se doma: evoluciona a partir de un Malwyn.' },
  Malwyn: { method: 'special', note: 'No se doma: evoluciona a partir de otro wyvern lunar (Lost Colony).' },
  Rhyniognatha: { method: 'special', note: 'Tameo único: debe agarrar y drenar a una criatura grande viva mientras la alimentas.' },

  // ——— Pasivos especiales (comida no convencional) ———
  Bloodstalker: { method: 'passive', note: 'Pasivo: deja que te agarre y aliméntalo con Carne de Pescado cruda o Blood Pack mientras cuelgas.' },
  Ferox: { method: 'passive', note: 'Pasivo: dale Element — se transforma en su forma grande y agresiva.' },
  Desmodus: { method: 'passive', note: 'Pasivo: aliméntalo con Blood Packs (los obtienes drenando criaturas con el propio Desmodus).' },
  Pyromane: { method: 'special', note: 'Especial: mójalo con agua y dáñalo hasta poder montarlo; ya montado, absorbe las llamas de criaturas cercanas para completar el tameo.' },
  Andrewsarchus: { method: 'passive', note: 'Pasivo (no por noqueo): acércate y aliméntalo.' },
  Sinomacrops: { method: 'passive', note: 'Pasivo: acércate agachado y dale su comida.' },
  Cosmo: { method: 'passive', note: 'Pasivo (Steampunk).' },
  Burrowbuck: { method: 'passive', note: 'Pasivo: requiere sigilo y paciencia.' },
  Deinotherium: { method: 'passive', note: 'Pasivo: solo se puede tamear con el jugador a nivel 95 o superior.' },
  Cat: { method: 'passive', note: 'Pasivo: depende del temperamento de cada gato hacia ti.' },
  Armadoggo: { method: 'passive', note: 'Pasivo: suelta la comida de tu inventario para que la coma.' },
  Veilwyn: { method: 'passive', note: 'Pasivo: acércate agachado sin que te detecte.' },
  Gloon: { method: 'passive', note: 'Pasivo (Lost Colony).' },
  Ossidon: { method: 'passive', note: 'Pasivo: procedimiento largo, ten paciencia.' },
  Dinopithecus: { method: 'special', note: 'Mixto violento + pasivo.' },
  Astrocetus: { method: 'special', note: 'Especial: en el espacio, dispárale para montarlo y aliméntalo.' },
  Megaraptor: { method: 'special', note: 'Tameo único con un método propio (consulta el Asistente).' },
  Shastasaurus: { method: 'passive', note: 'Pasivo único.' },
  Dreadnoughtus: { method: 'special', note: 'Tameo único (Extinction).' },
  Amargasaurus: { method: 'special', note: 'Proceso de tameo muy particular.' },
  Dreadmare: { method: 'special', note: 'Requiere un ritual/pago previo para poder tamearlo.' },
  Oasisaur: { method: 'special', note: 'Requiere un Death Sac de una criatura y un método propio.' },
  Fasolasuchus: { method: 'special', note: 'Proceso de noqueo particular (hay que esperar a que se agote).' },
  'Giant Bee': { method: 'special', note: 'Doma a la Abeja Reina para conseguir la colmena.' },

  // ——— Noqueo sin datos de dieta en ASB (dieta descrita, cantidades no disponibles) ———
  Maeguana: { method: 'knockout', note: 'Noqueo. Omnívoro: prefiere Basic Kibble, luego carne o pescado. Torpor bajo, cae rápido.' },
  Bison: { method: 'knockout', note: 'Noqueo. Herbívoro: cultivos, verduras y bayas.' },
  Carcharodontosaurus: { method: 'special', note: 'Tameo particular: gana afinidad de las criaturas que mata cerca, no solo de la comida.' },
  Deinosuchus: { method: 'knockout', note: 'Noqueo. Carnívoro: carne y pescado; kibble para máxima efectividad.' },
  Cryolophosaurus: { method: 'knockout', note: 'Noqueo. Carnívoro.' },
  Acrocanthosaurus: { method: 'knockout', note: 'Noqueo. Carnívoro.' },
  Xiphactinus: { method: 'knockout', note: 'Noqueo (acuático). Carnívoro: pescado.' },
  'Yi Ling': { method: 'knockout', note: 'Noqueo. Carnívoro.' },
  'Grand Tortugar': { method: 'knockout', note: 'Noqueo. Herbívoro.' },
  Ceratosaurus: { method: 'knockout', note: 'Noqueo. Carnívoro.' },
  Helicoprion: { method: 'knockout', note: 'Noqueo (acuático). Carnívoro: pescado.' },
  Megalania: { method: 'knockout', note: 'Noqueo. Carnívoro.' },
  Archelon: { method: 'knockout', note: 'Noqueo (acuático). Herbívoro: come Archelon Algae.' },
  Megachelon: { method: 'passive', note: 'Pasivo: aliméntalo con Algas / kibble mientras nadas junto a él.' },
  Tropeognathus: { method: 'knockout', note: 'Noqueo (aéreo). Carnívoro: pescado.' },
  Kirayli: { method: 'passive', note: 'Pasivo (Astraeos).' },
  'Crystal Wyvern': { method: 'passive', note: 'Pasivo (a diferencia de los wyverns normales): aliméntalo con Cristal Primigenio (Primal Crystal).' },
}

const BASE_PREFIX = /^(Aberrant|Tek|Corrupted|Astral|Lightning|Fire|Ice|Poison|Blood|Ember|Tropical|Dire Polar|Polar|Lost|R-|X-)\s*/

/** Info de tameo curada para una especie, o null si usa la calculadora estándar. */
export function getTamingInfo(speciesName: string): TamingInfo | null {
  const clean = speciesName.replace(/\s*\(.*\)$/, '').trim()
  if (TAMING_INFO[clean]) return TAMING_INFO[clean]
  const base = clean.replace(BASE_PREFIX, '')
  // "Astral T-Rex" → "T-Rex"; normaliza a "Rex"
  const norm = base === 'T-Rex' ? 'Rex' : base
  return TAMING_INFO[norm] ?? null
}
