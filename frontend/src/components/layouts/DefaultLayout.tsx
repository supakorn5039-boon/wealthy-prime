import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { Footer } from '@/components/Footer'
import { CartDrawer } from '@/components/CartDrawer'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

interface DefaultLayoutProps {
  children: React.ReactNode
}

export function DefaultLayout({ children }: DefaultLayoutProps) {
  const { user } = useAuthStore()
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  return (
    <div className="min-h-screen flex bg-gray-50">
      {user && <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={toggleSidebar} />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
      <CartDrawer />
    </div>
  )
}
