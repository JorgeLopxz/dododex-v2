import { ClawMark } from './icons'

/** Separador de sección: garra + etiqueta mono + regla punteada que llena el resto. */
export function SectionRule({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div className={`mb-2 flex items-center gap-2 ${className}`}>
      <ClawMark size={13} className="shrink-0 text-amber" />
      <span className="kicker shrink-0">{label}</span>
      <span className="h-0 flex-1 border-b border-dashed border-bone-faint" aria-hidden="true" />
    </div>
  )
}
