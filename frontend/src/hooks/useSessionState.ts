import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

export function useSessionState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      return
    }
  }, [key, value])

  return [value, setValue]
}
