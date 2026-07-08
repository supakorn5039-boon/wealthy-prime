import { useEffect, useRef, type RefObject } from 'react'

type ElementRef = RefObject<HTMLElement | null>

export function useClickOutside(
  refs: ElementRef | ElementRef[],
  handler: () => void,
  active = true,
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler
  const refsRef = useRef<ElementRef[]>([])
  refsRef.current = Array.isArray(refs) ? refs : [refs]

  useEffect(() => {
    if (!active) return
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      for (const r of refsRef.current) {
        if (r.current?.contains(target)) return
      }
      handlerRef.current()
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [active])
}
