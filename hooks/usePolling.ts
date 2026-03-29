'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UsePollingOptions {
  interval: number
  enabled?: boolean
}

interface UsePollingResult<T> {
  data: T | null
  error: string | null
  isLoading: boolean
  refresh: () => Promise<void>
}

export function usePolling<T>(url: string, options: UsePollingOptions): UsePollingResult<T> {
  const { interval, enabled = true } = options
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isVisibleRef = useRef(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error || `Request failed (${res.status})`)
        return
      }

      const json = await res.json()
      setData(json as T)
      setError(null)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Request timed out')
      } else {
        setError(err instanceof Error ? err.message : 'Network error')
      }
    } finally {
      setIsLoading(false)
    }
  }, [url])

  useEffect(() => {
    if (!enabled) return

    fetchData()

    const startPolling = () => {
      intervalRef.current = setInterval(() => {
        if (isVisibleRef.current) fetchData()
      }, interval)
    }

    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden
      if (!document.hidden) {
        fetchData()
      }
    }

    startPolling()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchData, interval, enabled])

  return { data, error, isLoading, refresh: fetchData }
}
