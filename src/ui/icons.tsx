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

export function IconScan({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
      <path d="M7 12h10M12 8.5v7" />
    </svg>
  )
}

export function IconGear({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v3M12 18.2v3M21.2 12h-3M5.8 12h-3M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1M18.5 18.5l-2.1-2.1M7.6 7.6 5.5 5.5" />
    </svg>
  )
}

export function IconStar({ size = 20, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...stroke}
      fill={filled ? 'currentColor' : 'none'}
    >
      <path d="m12 3.2 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.4l5.9-.8z" />
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
