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

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, minWidth),
    })
  }, [open, minWidth])

  useClickOutside([triggerRef, menuRef], () => setOpen(false), open)

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  return { open, setOpen, query, setQuery, triggerRef, menuRef, position }
}
