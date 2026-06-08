import logoUrl from '@/assets/logo.png'
import { cn } from '@/lib/utils'

type LogoProps = {
  size?: number
  className?: string
  alt?: string
}

export function Logo({ size = 40, className, alt = 'Wealthy Prime Estate' }: LogoProps) {
  return (
    <img
      src={logoUrl}
      alt={alt}
      width={size}
      height={size}
      decoding="async"
      className={cn('shrink-0 rounded-full object-contain', className)}
    />
  )
}
