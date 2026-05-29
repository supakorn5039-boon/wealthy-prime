import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Size = '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'

const SIZE_CLASS: Record<Size, string> = {
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
}

interface PageContainerProps {
  children: ReactNode
  size?: Size
  className?: string
}

export function PageContainer({ children, size = '5xl', className }: PageContainerProps) {
  return <div className={cn(SIZE_CLASS[size], 'mx-auto', className)}>{children}</div>
}
