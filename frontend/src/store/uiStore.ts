import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

const initialSidebarOpen = typeof window !== 'undefined' && window.innerWidth >= 1024

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: initialSidebarOpen,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
