import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import App from '@/App'
import '@/i18n'
import '@/index.css'

// Global safety net: after any successful mutation (POST/PUT/DELETE)
// invalidate every cached query so reads always reflect the latest state.
// Mounted queries refetch immediately; unmounted ones are marked stale.
const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
  mutationCache: new MutationCache({
    onSuccess: () => {
      queryClient.invalidateQueries()
    },
  }),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  </StrictMode>
)
