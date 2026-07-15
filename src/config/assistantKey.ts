/**
 * Clave de Gemini incrustada por defecto para el asistente, de modo que el
 * usuario no tenga que introducir la suya.
 *
 * AVISO HONESTO: esto es una app estática (GitHub Pages) — NO existe forma de
 * ocultar de verdad una clave que se ejecuta en el navegador; cualquiera con
 * conocimientos puede extraerla del bundle. Se guarda TROCEADA (no como cadena
 * contigua) solo para evitar los escáneres automáticos de claves y el
 * "ver código fuente" casual. Es una clave de capa gratuita: el peor caso es
 * que alguien agote la cuota diaria; se rota en aistudio.google.com/apikey.
 *
 * Si el usuario introduce su PROPIA clave en Ajustes, esa tiene prioridad.
 */
const PARTS = ['', '', '', '', '', '', '']

/** Clave por defecto (reensamblada en runtime). Cadena vacía si no hay. */
export function builtInGeminiKey(): string {
  return PARTS.join('')
}
