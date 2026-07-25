import { type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { PopoverPosition } from '@/hooks/usePopover'

interface PopoverMenuProps {
  menuRef: RefObject<HTMLDivElement | null>
  position: PopoverPosition | null
  query: string
  onQueryChange: (q: string) => void
  container?: HTMLElement | null
  children: ReactNode
}

export function PopoverMenu({ menuRef, position, query, onQueryChange, container, children }: PopoverMenuProps) {
  const { t } = useTranslation()
  if (!position) return null
  const targetContainer = container || document.body
  return createPortal(
    <div
      ref={menuRef}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 1200,
        pointerEvents: 'auto',
      }}
      className="max-h-80 overflow-hidden rounded-md border border-border bg-popover shadow-lg flex flex-col"
    >
      <div className="p-2 border-b border-border/60">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t('common.search')}
            className="h-8 w-full rounded border border-input bg-background pl-7 pr-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>
      <div className="overflow-y-auto p-1">{children}</div>
    </div>,
    targetContainer,
  )
}
