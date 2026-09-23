/**
 * Petición a Gemini del asistente. La comparten la web (cuando el usuario usa su
 * propia clave) y el worker de Cloudflare (worker/), que guarda la clave por defecto.
 */

export const GEMINI_MODEL = 'gemini-2.5-flash'
export const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
/** Worker de worker/ desplegado en Cloudflare */
export const ASSISTANT_PROXY_URL = 'https://arkmaster-ai.dawn-dust-950a.workers.dev'
export const MAX_TURNS = 16

export type GameVersion = 'asa' | 'ase'

export interface ChatMsg {
  role: 'user' | 'model'
  text: string
}

export function buildSystem(gameVersion: GameVersion) {
  const gameName = gameVersion === 'asa' ? 'ARK: Survival Ascended (ASA)' : 'ARK: Survival Evolved (ASE)'
  return `Eres el asistente experto de DODODEX V2, una app companion de ${gameName}.
Eres un jugador veterano de ARK: dominas tameos, cría y mutaciones, kibbles, mapas, cuevas, artefactos,
jefes, estrategias PvE/PvP y comandos de consola. Contesta SIEMPRE en español, de forma directa y práctica,
con cantidades y pasos concretos. Responde según ${gameVersion === 'asa' ? 'ASA vanilla oficial' : 'ASE vanilla oficial'}.
Si no estás seguro de un dato exacto, dilo honestamente. Respuestas compactas: nada de relleno.`
}

export function buildGeminiBody(history: ChatMsg[], gameVersion: GameVersion) {
  return {
    system_instruction: { parts: [{ text: buildSystem(gameVersion) }] },
    contents: history.slice(-MAX_TURNS).map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    // gemini-2.5 gasta "thinking" DENTRO de maxOutputTokens → presupuesto amplio
    // y razonamiento apagado para que la respuesta nunca llegue cortada
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 8192,
      thinkingConfig: { thinkingBudget: 0 },
    },
  }
}

/** Con clave propia se habla directo con Gemini; si no, con el worker, que pone la suya. */
export function buildChatRequest(
  history: ChatMsg[],
  gameVersion: GameVersion,
  ownKey: string,
): { url: string; init: RequestInit } {
  const recent = history.slice(-MAX_TURNS)
  if (ownKey) {
    return {
      url: GEMINI_URL,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': ownKey },
        body: JSON.stringify(buildGeminiBody(recent, gameVersion)),
      },
    }
  }
  return {
    url: `${ASSISTANT_PROXY_URL}/chat`,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameVersion, messages: recent }),
    },
  }
}
