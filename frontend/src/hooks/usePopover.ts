import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'

export interface PopoverPosition {
  top: number
  left: number
  width: number
}

export function usePopover(minWidth = 220) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<PopoverPosition | null>(null)

  const updatePosition = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, minWidth),
    })
  }

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
  }, [open, minWidth])

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useClickOutside([triggerRef, menuRef], () => setOpen(false), open)

  return { open, setOpen, query, setQuery, triggerRef, menuRef, position }
}
