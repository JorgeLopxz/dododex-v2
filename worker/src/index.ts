/**
 * Worker de Cloudflare del asistente de ArkMaster: guarda la clave de Gemini como
 * secreto (GEMINI_KEY) para que nunca viaje en el código de la web.
 *
 * Despliegue, desde esta carpeta (worker/):
 *   npx wrangler login
 *   npx wrangler secret put GEMINI_KEY
 *   npx wrangler deploy
 */
import { GEMINI_URL, MAX_TURNS, buildGeminiBody, type ChatMsg, type GameVersion } from '../../src/features/assistant/gemini'

const ALLOWED_ORIGINS = ['https://jorgelopxz.github.io', 'http://localhost:5173']
const MAX_TEXT = 4000

export interface Env {
  GEMINI_KEY: string
  /** Rate limiter de Cloudflare por IP (wrangler.toml → [[ratelimits]]) */
  LIMITER?: { limit(opts: { key: string }): Promise<{ success: boolean }> }
}

type Upstream = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

function cors(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

/** Errores con la misma forma que los de Gemini: la web los lee igual */
function fail(status: number, message: string, headers: Record<string, string>) {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}

function parseChat(body: unknown): { gameVersion: GameVersion; messages: ChatMsg[] } | null {
  if (typeof body !== 'object' || body === null) return null
  const { gameVersion, messages } = body as { gameVersion?: unknown; messages?: unknown }
  if (gameVersion !== 'asa' && gameVersion !== 'ase') return null
  if (!Array.isArray(messages) || messages.length === 0) return null
  const recent = messages.slice(-MAX_TURNS)
  const valid = recent.every(
    (m) => (m?.role === 'user' || m?.role === 'model') && typeof m.text === 'string' && m.text.length <= MAX_TEXT,
  )
  if (!valid || recent[recent.length - 1].role !== 'user') return null
  return { gameVersion, messages: recent.map((m) => ({ role: m.role, text: m.text })) }
}

export async function handleRequest(
  request: Request,
  env: Env,
  upstream: Upstream = (input, init) => fetch(input, init),
): Promise<Response> {
  const origin = request.headers.get('Origin') ?? ''
  if (!ALLOWED_ORIGINS.includes(origin)) return fail(403, 'Origen no permitido', {})
  const headers = cors(origin)

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  if (request.method !== 'POST' || new URL(request.url).pathname !== '/chat') return fail(404, 'No encontrado', headers)

  if (env.LIMITER) {
    const { success } = await env.LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') ?? 'anon' })
    if (!success) return fail(429, 'Demasiadas preguntas seguidas: espera un minuto', headers)
  }

  const chat = parseChat(await request.json().catch(() => null))
  if (!chat) return fail(400, 'Petición no válida', headers)
  if (!env.GEMINI_KEY) return fail(503, 'El asistente no tiene clave configurada', headers)

  try {
    const res = await upstream(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_KEY },
      body: JSON.stringify(buildGeminiBody(chat.messages, chat.gameVersion)),
    })
    return new Response(res.body, { status: res.status, headers: { ...headers, 'Content-Type': 'application/json' } })
  } catch {
    return fail(502, 'No se pudo contactar con Gemini', headers)
  }
}

export default {
  fetch: (request: Request, env: Env) => handleRequest(request, env),
}
