/** Iconografía propia en SVG (nada de emojis en la navegación/identidad). */

export function DinoFootprint({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="tekgrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-tek)" />
          <stop offset="1" stopColor="var(--color-tek-deep)" />
        </linearGradient>
      </defs>
      {/* almohadilla */}
      <ellipse cx="16" cy="21" rx="7.5" ry="6.5" fill="url(#tekgrad)" />
      {/* dedos */}
      <ellipse cx="7.5" cy="11.5" rx="2.6" ry="5" transform="rotate(-24 7.5 11.5)" fill="url(#tekgrad)" />
      <ellipse cx="16" cy="8.5" rx="2.7" ry="5.6" fill="url(#tekgrad)" />
      <ellipse cx="24.5" cy="11.5" rx="2.6" ry="5" transform="rotate(24 24.5 11.5)" fill="url(#tekgrad)" />
    </svg>
  )
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export function IconHome({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9h5v-5h3v5h5v-9" />
    </svg>
  )
}

export function IconDino({ size = 22 }: { size?: number }) {
  // silueta simplificada de cabeza de raptor
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M4 15.5c0-5 3.5-8.5 8-8.5 3 0 5 1.2 6.5 3.2L21 12l-2.5 1-1 3.5c-3 2-8 2.2-11 .5" />
      <path d="M13.5 12.2h.01" strokeWidth="2.6" />
      <path d="M15 16.5c-1.2.6-2.6.9-4 .9" />
    </svg>
  )
}

export function IconScan({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
      <path d="M7 12h10M12 8.5v7" />
    </svg>
  )
}

export function IconLibrary({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M5 4.5h4.5a2 2 0 0 1 2 2V19a1.8 1.8 0 0 0-1.8-1.5H5zM19 4.5h-4.5a2 2 0 0 0-2 2V19a1.8 1.8 0 0 1 1.8-1.5H19z" />
    </svg>
  )
}
