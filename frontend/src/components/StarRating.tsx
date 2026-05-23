import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: number
}

export function StarRating({ value, onChange, readonly = false, size = 20 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn('focus:outline-none', !readonly && 'cursor-pointer hover:scale-110 transition-transform')}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              'transition-colors',
              star <= value ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
            )}
          />
        </button>
      ))}
    </div>
  )
}
