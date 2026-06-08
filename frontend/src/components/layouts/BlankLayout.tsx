import { CartDrawer } from '@/components/CartDrawer'

interface BlankLayoutProps {
  children: React.ReactNode
}

export function BlankLayout({ children }: BlankLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center">
      {children}
      <CartDrawer />
    </div>
  )
}
