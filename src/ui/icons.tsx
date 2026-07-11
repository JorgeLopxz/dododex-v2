/** Iconografía propia en SVG (nada de emojis en la navegación/identidad). */

export function DinoFootprint({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="embergrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-amber)" />
          <stop offset="1" stopColor="var(--color-amber-deep)" />
        </linearGradient>
      </defs>
      {/* almohadilla */}
      <ellipse cx="16" cy="21" rx="7.5" ry="6.5" fill="url(#embergrad)" />
      {/* dedos */}
      <ellipse cx="7.5" cy="11.5" rx="2.6" ry="5" transform="rotate(-24 7.5 11.5)" fill="url(#embergrad)" />
      <ellipse cx="16" cy="8.5" rx="2.7" ry="5.6" fill="url(#embergrad)" />
      <ellipse cx="24.5" cy="11.5" rx="2.6" ry="5" transform="rotate(24 24.5 11.5)" fill="url(#embergrad)" />
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

export function IconPick({ size = 22 }: { size?: number }) {
  // pico de minería: mango en diagonal + cabeza curva
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="m14 10-9.5 9.5M13 4.5c3.2-.6 6.4.7 8.2 3.1M13 4.5l1.6 1.6M21.2 7.6l-1.9 1.2M13.7 5.4c2.3-.2 4.5.7 5.8 2.6" />
    </svg>
  )
}
