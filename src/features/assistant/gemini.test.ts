import { describe, expect, it } from 'vitest'
import { ASSISTANT_PROXY_URL, GEMINI_MODEL, buildChatRequest, buildGeminiBody, type ChatMsg } from './gemini'

const MSGS: ChatMsg[] = Array.from({ length: 18 }, (_, i) => ({ role: i % 2 ? 'model' : 'user', text: `m${i}` }))

describe('buildChatRequest', () => {
  it('sin clave propia pregunta al worker, sin ninguna clave en la petición', () => {
    const { url, init } = buildChatRequest(MSGS, 'asa', '')
    expect(url).toBe(`${ASSISTANT_PROXY_URL}/chat`)
    expect(JSON.parse(init.body as string)).toEqual({ gameVersion: 'asa', messages: MSGS.slice(-16) })
    expect(new Headers(init.headers).get('x-goog-api-key')).toBeNull()
  })

  it('con clave propia llama a Gemini directamente con la clave en cabecera', () => {
    const { url, init } = buildChatRequest(MSGS, 'ase', 'mi-clave')
    expect(url).toBe(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`)
    expect(new Headers(init.headers).get('x-goog-api-key')).toBe('mi-clave')
    expect(JSON.parse(init.body as string)).toEqual(buildGeminiBody(MSGS, 'ase'))
  })
})
