import { Logo } from '@/components/Logo'

interface ImageWatermarkProps {
  compact?: boolean
}

// Positioned bottom-left to avoid the image counter badge (bottom-right).
export function ImageWatermark({ compact = false }: ImageWatermarkProps) {
  return (
    <div
      className={
        compact
          ? 'pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded bg-background/60 border border-primary/30 text-primary px-1.5 py-0.5 backdrop-blur-sm'
          : 'pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-background/60 border border-primary/30 text-primary px-2 py-1 backdrop-blur-sm'
      }
    >
      <Logo size={compact ? 14 : 18} />
      <span className={compact ? 'text-[10px] font-medium tracking-luxury' : 'text-xs font-medium tracking-luxury'}>
        WEALTHY PRIME
      </span>
    </div>
  )
}
