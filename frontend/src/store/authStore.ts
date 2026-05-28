import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import type { AuthUser } from '@/types/Auth'

interface AuthState {
  token: string | null
  user: AuthUser | null
  isHydrated: boolean

  login: (token: string, user: AuthUser) => void
  logout: () => void
  setToken: (token: string) => void
  setHydrated: () => void
  requestAuthFromOtherTabs: () => void
  rehydrateUser: () => Promise<void>
}

let broadcastChannel: BroadcastChannel | null = null

function getBroadcastChannel(): BroadcastChannel {
  if (!broadcastChannel) {
    broadcastChannel = new BroadcastChannel('wealthy-prime-auth')
  }
  return broadcastChannel
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        token: null,
        user: null,
        isHydrated: false,

        login: (token, user) => {
          set({ token, user })
          getBroadcastChannel().postMessage({ type: 'AUTH_UPDATE', token, user })
        },

        logout: () => {
          set({ token: null, user: null })
          getBroadcastChannel().postMessage({ type: 'AUTH_LOGOUT' })
        },

        setToken: (token) => set({ token }),

        setHydrated: () => set({ isHydrated: true }),

        requestAuthFromOtherTabs: () => {
          const channel = getBroadcastChannel()
          channel.postMessage({ type: 'REQUEST_AUTH' })

          const handler = (event: MessageEvent) => {
            if (event.data?.type === 'AUTH_RESPONSE') {
              const { token, user } = event.data
              if (token && user && !get().token) {
                set({ token, user })
              }
              channel.removeEventListener('message', handler)
            }
          }
          channel.addEventListener('message', handler)
          setTimeout(() => channel.removeEventListener('message', handler), 2000)
        },

        rehydrateUser: async () => {
          const { token } = get()
          if (!token) return
          try {
            const { fetchClient } = await import('@/utils/axios')
            const res = await fetchClient.get<{ data: AuthUser }>('/auth/profile')
            set({ user: res.data.data })
          } catch {
            set({ token: null, user: null })
          }
        },
      }),
      {
        name: 'wealthy-prime',
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({ token: state.token, user: state.user }),
        onRehydrateStorage: () => (state) => {
          state?.setHydrated()
        },
      }
    ),
    { name: 'AuthStore' }
  )
)

// Handle cross-tab auth sync
if (typeof window !== 'undefined') {
  const channel = getBroadcastChannel()
  channel.addEventListener('message', (event) => {
    const store = useAuthStore.getState()
    if (event.data?.type === 'AUTH_UPDATE') {
      useAuthStore.setState({ token: event.data.token, user: event.data.user })
    } else if (event.data?.type === 'AUTH_LOGOUT') {
      useAuthStore.setState({ token: null, user: null })
    } else if (event.data?.type === 'REQUEST_AUTH') {
      if (store.token && store.user) {
        channel.postMessage({ type: 'AUTH_RESPONSE', token: store.token, user: store.user })
      }
    }
  })
}
