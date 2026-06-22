import { Logo } from '@/components/Logo'

interface ImageWatermarkProps {
  compact?: boolean
}

// Centered over the photo at low opacity. Centering deters screenshot
// re-use better than a corner placement; opacity keeps the room readable.
export function ImageWatermark({ compact = false }: ImageWatermarkProps) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div
        className={
          compact
            ? 'flex items-center gap-1 rounded bg-background/40 border border-primary/30 text-primary px-2 py-0.5 opacity-60 backdrop-blur-sm'
            : 'flex items-center gap-2 rounded-md bg-background/40 border border-primary/30 text-primary px-3 py-1.5 opacity-60 backdrop-blur-sm'
        }
      >
        <Logo size={compact ? 16 : 24} />
        <span className={compact ? 'text-[11px] font-semibold tracking-luxury' : 'text-sm font-semibold tracking-luxury'}>
          WEALTHY PRIME
        </span>
      </div>
    </div>
  )
}
