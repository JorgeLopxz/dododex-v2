/** Iconografía propia en SVG (nada de emojis en la navegación/identidad). */

/** Marca ArkMaster: garra de 3 tajos con quiebros irregulares ("desgarro"). */
export function ClawMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
      className={`claw-mark ${className}`}
    >
      <g transform="rotate(-22 16 16)">
        <path d="M6 2 L9 8 L10.2 12.5 L8.6 20 L7.2 30 L5.4 19 L4 13.5 L5.2 7 Z" />
        <path d="M14.5 0 L18 7 L19.4 13.5 L17.4 22 L15.8 32 L13.4 21 L11.8 14.5 L13.2 6 Z" />
        <path d="M23.5 3 L26.4 8.5 L27.6 13 L26 20.5 L24.8 28.5 L22.8 19.5 L21.4 14 L22.6 8 Z" />
      </g>
    </svg>
  )
}

/** Alias retrocompatible: la marca antigua ahora es la garra ArkMaster. */
export const DinoFootprint = ClawMark

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

export function IconPot({ size = 22 }: { size?: number }) {
  // olla de cocina con vapor
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M4.5 10.5h15v6a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3zM2.8 10.5h18.4M8 10.5V9M16 10.5V9" />
      <path d="M9.5 3.5c-.8 1 .8 1.6 0 2.7M14.5 3.5c-.8 1 .8 1.6 0 2.7" />
    </svg>
  )
}

export function IconBrain({ size = 22 }: { size?: number }) {
  // chispa de IA: burbuja de chat con destello
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H13l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z" />
      <path d="M12 6.8 13 9l2.2 1-2.2 1-1 2.2-1-2.2-2.2-1L11 9z" />
    </svg>
  )
}

export function IconStar({
  size = 20,
  filled = false,
  className = '',
}: {
  size?: number
  filled?: boolean
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...stroke}
      fill={filled ? 'currentColor' : 'none'}
      className={className}
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
