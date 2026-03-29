'use client'

import { useState, useCallback } from 'react'

interface UseBulkSelectionResult {
  selectedIds: Set<number>
  toggle: (id: number) => void
  selectAll: (ids: number[]) => void
  clearAll: () => void
  isAllSelected: (ids: number[]) => boolean
  pruneStale: (activeIds: Set<number>) => void
}

export function useBulkSelection(): UseBulkSelectionResult {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const toggle = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback((ids: number[]) => {
    setSelectedIds(new Set(ids))
  }, [])

  const clearAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isAllSelected = useCallback((ids: number[]) => {
    return ids.length > 0 && ids.every(id => selectedIds.has(id))
  }, [selectedIds])

  const pruneStale = useCallback((activeIds: Set<number>) => {
    setSelectedIds(prev => {
      const next = new Set<number>()
      prev.forEach(id => { if (activeIds.has(id)) next.add(id) })
      return next
    })
  }, [])

  return { selectedIds, toggle, selectAll, clearAll, isAllSelected, pruneStale }
}
