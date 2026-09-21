import { Logo } from '@/components/Logo'

interface ImageWatermarkProps {
  compact?: boolean
}

export function ImageWatermark({ compact = false }: ImageWatermarkProps) {
  if (compact) {
    return (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Logo
          size={128}
          className="w-[62%] max-w-[190px] min-w-[56px] h-auto opacity-70 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
        />
      </div>
    )
  }

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
      <Logo
        size={320}
        className="w-[58%] max-w-[460px] min-w-[96px] h-auto opacity-75 drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)]"
      />
    </div>
  )
}
