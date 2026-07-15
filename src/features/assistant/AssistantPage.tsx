import { useEffect, useRef, useState } from 'react'
import { useSettings } from '../../store/settings'
import { builtInGeminiKey } from '../../config/assistantKey'

const MODEL = 'gemini-2.5-flash'
function buildSystem(gameVersion: 'asa' | 'ase') {
  const gameName = gameVersion === 'asa' ? 'ARK: Survival Ascended (ASA)' : 'ARK: Survival Evolved (ASE)'
  return `Eres el asistente experto de DODODEX V2, una app companion de ${gameName}.
Eres un jugador veterano de ARK: dominas tameos, cría y mutaciones, kibbles, mapas, cuevas, artefactos,
jefes, estrategias PvE/PvP y comandos de consola. Contesta SIEMPRE en español, de forma directa y práctica,
con cantidades y pasos concretos. Responde según ${gameVersion === 'asa' ? 'ASA vanilla oficial' : 'ASE vanilla oficial'}.
Si no estás seguro de un dato exacto, dilo honestamente. Respuestas compactas: nada de relleno.`
}

interface Msg {
  role: 'user' | 'model'
  text: string
}

const CHAT_KEY = 'dododex-v2-chat'

/** Asistente IA: chat experto en ARK usando la API de Gemini con la clave del usuario. */
export function AssistantPage() {
  const { geminiKey, setGeminiKey, gameVersion } = useSettings()
  // la clave del usuario tiene prioridad; si no, la incrustada por defecto
  const activeKey = geminiKey || builtInGeminiKey()
  const [keyDraft, setKeyDraft] = useState('')
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(CHAT_KEY) ?? '[]')
    } catch {
      return []
    }
  })
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-40)))
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setError('')
    const history = [...messages, { role: 'user', text } as Msg]
    setMessages(history)
    setBusy(true)
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(activeKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: buildSystem(gameVersion) }] },
            contents: history.slice(-16).map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
            // gemini-2.5 gasta "thinking" DENTRO de maxOutputTokens → presupuesto amplio
            // y razonamiento apagado para que la respuesta nunca llegue cortada
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 8192,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        },
      )
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error?.message ?? `HTTP ${res.status}`)
      }
      const cand = json?.candidates?.[0]
      let reply: string = cand?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
      if (!reply) throw new Error('Respuesta vacía del modelo')
      if (cand?.finishReason === 'MAX_TOKENS') reply += '\n\n[…respuesta recortada por límite — pídeme que continúe]'
      setMessages((m) => [...m, { role: 'model', text: reply }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      setMessages((m) => m.slice(0, -1))
      setInput(text)
    } finally {
      setBusy(false)
    }
  }

  /* ——— Sin ninguna clave disponible (no debería pasar: hay una por defecto) ——— */
  if (!activeKey) {
    return (
      <section aria-label="Asistente IA" className="mx-auto max-w-lg space-y-4">
        <div>
          <h2 className="display text-2xl font-bold">🧠 Asistente ARK</h2>
          <p className="text-sm text-bone-dim">Introduce una clave de Gemini para empezar.</p>
        </div>
        <div className="panel space-y-3 p-5 text-sm text-bone-dim">
          <p>
            Consigue una gratis en{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-amber underline">
              aistudio.google.com/apikey
            </a>{' '}
            y pégala aquí:
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="AIza…"
              aria-label="Clave de API de Gemini"
              className="input-field flex-1"
            />
            <button onClick={() => keyDraft.trim() && setGeminiKey(keyDraft)} className="btn-primary">
              Guardar
            </button>
          </div>
        </div>
      </section>
    )
  }

  /* ——— Chat ——— */
  return (
    <section aria-label="Asistente IA" className="mx-auto flex max-w-lg flex-col space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="display text-2xl font-bold">🧠 Asistente ARK</h2>
          <p className="text-xs text-bone-faint">
            Gemini · {geminiKey ? 'tu clave' : 'listo para usar'}
          </p>
        </div>
        <div className="flex gap-1.5">
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} className="btn-ghost px-2.5 py-1 text-xs">Limpiar</button>
          )}
          {geminiKey && (
            <button onClick={() => setGeminiKey('')} className="btn-ghost px-2.5 py-1 text-xs" title="Usar clave por defecto">🔑</button>
          )}
        </div>
      </div>

      <div className="min-h-64 space-y-3">
        {messages.length === 0 && (
          <div className="panel p-4 text-sm text-bone-dim">
            <p className="mb-2">Pregúntame lo que sea de ARK. Por ejemplo:</p>
            <ul className="space-y-1.5">
              {['¿Cómo consigo el artefacto del Devorador en The Island?', '¿Mejor criatura para farmear polímero orgánico?', '¿Cómo funcionan las mutaciones al criar?'].map((q) => (
                <li key={q}>
                  <button onClick={() => setInput(q)} className="text-left text-amber underline decoration-amber-dark hover:text-bone">
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`panel max-w-[88%] whitespace-pre-wrap p-3.5 text-sm leading-relaxed ${
              m.role === 'user' ? 'ml-auto border-amber-dark/50 text-bone' : 'mr-auto text-bone-dim'
            }`}
          >
            {m.text}
          </div>
        ))}
        {busy && <p className="animate-pulse text-center text-xs text-bone-faint">El experto está pensando…</p>}
        {error && <p className="rounded-lg border border-danger/40 bg-surface-0/60 px-3 py-2 text-xs text-danger">⚠️ {error}</p>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        className="sticky bottom-24 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregunta sobre ARK…"
          aria-label="Mensaje para el asistente"
          className="input-field flex-1"
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn-primary">
          ➤
        </button>
      </form>
    </section>
  )
}
