import { lazy } from 'react'

export default function lazyWithReload<P extends object>(
  factory: () => Promise<{ default: React.ComponentType<P> }>
) {
  return lazy(() =>
    factory().catch((err: unknown) => {
      const isChunkError =
        err instanceof Error &&
        (err.message.includes('Failed to fetch dynamically imported module') ||
          err.message.includes('ChunkLoadError') ||
          err.name === 'ChunkLoadError')

      if (isChunkError) {
        window.location.reload()
        return new Promise<never>(() => {})
      }
      return Promise.reject(err)
    })
  )
}
