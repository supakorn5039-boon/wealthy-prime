import { Crown } from 'lucide-react'

interface ImageWatermarkProps {
  // Compact variant uses smaller padding / icon / text — good for card thumbnails.
  compact?: boolean
}

// Brand watermark overlay positioned at the bottom-left of a property image.
// Visually matches the Sidebar/Navbar brand: amber Crown icon + "Wealthy Prime".
// Avoids the bottom-right area which is used for the image counter badge.
export function ImageWatermark({ compact = false }: ImageWatermarkProps) {
  return (
    <div
      className={
        compact
          ? 'pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/45 text-white px-1.5 py-0.5 backdrop-blur-sm'
          : 'pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-black/45 text-white px-2 py-1 backdrop-blur-sm'
      }
    >
      <Crown className={compact ? 'h-3 w-3 text-amber-400 shrink-0' : 'h-4 w-4 text-amber-400 shrink-0'} />
      <span className={compact ? 'text-[10px] font-medium tracking-wide' : 'text-xs font-medium tracking-wide'}>
        Wealthy Prime
      </span>
    </div>
  )
}
