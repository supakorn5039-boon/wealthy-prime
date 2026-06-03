import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { Footer } from '@/components/Footer'
import { CartDrawer } from '@/components/CartDrawer'
import { useAuthStore } from '@/store/authStore'

interface DefaultLayoutProps {
  children: React.ReactNode
}

export function DefaultLayout({ children }: DefaultLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth >= 1024
  })
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen flex bg-gray-50">
      {user && <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
      <CartDrawer />
    </div>
  )
}
