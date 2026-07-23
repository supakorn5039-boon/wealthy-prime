import { Logo } from '@/components/Logo'

interface ImageWatermarkProps {
  compact?: boolean
}

export function ImageWatermark({ compact = false }: ImageWatermarkProps) {
  if (compact) {
    return (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-1.5 rounded bg-background/40 border border-primary/30 text-primary px-2.5 py-1 opacity-70 backdrop-blur-sm">
          <Logo size={22} />
          <span className="text-[13px] font-semibold tracking-luxury">WEALTHY PRIME</span>
        </div>
      </div>
    )
  }

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3 text-primary opacity-75 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
        <Logo size={112} className="w-[22vw] max-w-[160px] min-w-[64px] h-auto" />
        <span className="text-[clamp(1.1rem,4.5vw,2.75rem)] font-bold tracking-luxury leading-none text-center">
          WEALTHY PRIME
        </span>
      </div>
    </div>
  )
}
