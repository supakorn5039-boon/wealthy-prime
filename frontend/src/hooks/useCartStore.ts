import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem } from '@/types/Booking'

interface CartState {
  items: CartItem[]
  isOpen: boolean

  addItem: (item: CartItem) => void
  removeItem: (propertyId: number) => void
  updateDate: (propertyId: number, date: Date | null) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      addItem: (item) =>
        set((state) => {
          const exists = state.items.some((i) => i.propertyId === item.propertyId)
          if (exists) return state
          return { items: [...state.items, item] }
        }),

      removeItem: (propertyId) =>
        set((state) => ({ items: state.items.filter((i) => i.propertyId !== propertyId) })),

      updateDate: (propertyId, date) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.propertyId === propertyId ? { ...i, appointmentDate: date } : i
          ),
        })),

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),

      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'wealthy-prime-cart',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ items: state.items }),

      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.items = state.items.map((i) => ({
          ...i,
          appointmentDate:
            typeof i.appointmentDate === 'string' ? new Date(i.appointmentDate) : i.appointmentDate,
        }))
      },
    }
  )
)
