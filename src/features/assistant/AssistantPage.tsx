import { useEffect, useRef, useState } from 'react'
import { useSettings } from '../../store/settings'
import { buildChatRequest, type ChatMsg as Msg } from './gemini'

const CHAT_KEY = 'dododex-v2-chat'

/**
 * Asistente IA: chat experto en ARK con Gemini. Por defecto pregunta al worker de
 * Cloudflare (worker/), que guarda la clave; si el usuario tiene la suya, va directo.
 */
export function AssistantPage() {
  const { geminiKey, setGeminiKey, gameVersion } = useSettings()
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
      const { url, init } = buildChatRequest(history, gameVersion, geminiKey)
      const res = await fetch(url, init)
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

  /* ——— Chat ——— */
  return (
    <section aria-label="Asistente IA" className="mx-auto flex max-w-lg flex-col space-y-3">
      <div className="flex items-end justify-between gap-2 border-b-2 border-bone pb-2">
        <div>
          <p className="kicker">El Experto · Expedición ARK</p>
          <h2 className="display text-2xl font-semibold">Correspondencia</h2>
          <p className="text-xs italic text-bone-faint">
            Gemini · {geminiKey ? 'tu clave' : 'listo para usar'}
          </p>
        </div>
        <div className="flex gap-1.5">
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} className="btn-ghost px-2.5 py-1 text-xs">Limpiar</button>
          )}
          {geminiKey && (
            <button onClick={() => setGeminiKey('')} className="btn-ghost px-2.5 py-1 text-xs" title="Usar el servidor de ArkMaster">Clave predet.</button>
          )}
        </div>
      </div>

      <div className="min-h-64 space-y-3">
        {messages.length === 0 && (
          <div className="panel p-4 text-sm text-bone-dim">
            <p className="kicker mb-2">Sugerencias</p>
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
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div
              key={i}
              className="ml-auto max-w-[88%] whitespace-pre-wrap border border-verdigris-deep bg-verdigris p-3.5 text-sm leading-relaxed text-surface-0"
              style={{ boxShadow: '2px 3px 0 rgba(44,40,32,0.18)' }}
            >
              {m.text}
            </div>
          ) : (
            <div key={i} className="panel mr-auto max-w-[88%] whitespace-pre-wrap p-3.5 text-sm leading-relaxed text-bone-dim">
              {m.text}
              <p className="mono mt-2.5 text-[10px] uppercase tracking-[0.14em] text-amber-deep">— El Experto, Expedición ARK</p>
            </div>
          ),
        )}
        {busy && <p className="animate-pulse text-center text-xs italic text-bone-faint">El experto está pensando…</p>}
        {error && (
          <p className="border border-danger/40 bg-surface-1/60 px-3 py-2 text-xs text-danger">
            <strong className="mono uppercase tracking-wide">Error · </strong>{error}
          </p>
        )}
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
