'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RefreshCw, Inbox, Clock, Search, Filter, 
  CheckSquare, Square, Trash2, Printer, 
  CheckCircle, X, ChevronDown
} from 'lucide-react'
import { WaiterRecord } from '@/lib/types'
import { RecordCard } from './RecordCard'
import { RecordCardSkeleton } from './Skeleton'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type FilterType = 'all' | 'waiter' | 'acute' | 'urgent_mail'
type SortBy = 'due_time' | 'created_at' | 'name'

export function ProductionBoard() {
  const [records, setRecords] = useState<WaiterRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortBy>('due_time')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  const fetchRecords = useCallback(async () => {
    try {
      const response = await fetch('/api/records?type=production')
      const data = await response.json()
      setRecords(data)
    } catch (error) {
      console.error('Failed to fetch records:', error)
      toast.error('Failed to fetch records')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
      setLastRefresh(new Date())
    }
  }, [])

  useEffect(() => {
    fetchRecords()
    const interval = setInterval(fetchRecords, 10000)
    return () => clearInterval(interval)
  }, [fetchRecords])

  const handleUpdate = async (id: number, updates: Partial<WaiterRecord>) => {
    try {
      const response = await fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      
      if (response.ok) {
        fetchRecords()
        toast.success('Record updated')
      }
    } catch (error) {
      console.error('Failed to update record:', error)
      toast.error('Failed to update record')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    
    try {
      const response = await fetch(`/api/records/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setRecords(records.filter(r => r.id !== id))
        setSelectedIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
        toast.success('Record deleted')
      }
    } catch (error) {
      console.error('Failed to delete record:', error)
      toast.error('Failed to delete record')
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchRecords()
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const selectAll = () => {
    if (selectedIds.size === filteredRecords.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredRecords.map(r => r.id)))
    }
  }

  const bulkMarkPrinted = async () => {
    const updates = Array.from(selectedIds).map(id => 
      fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printed: true }),
      })
    )
    await Promise.all(updates)
    setSelectedIds(new Set())
    fetchRecords()
    toast.success(`${selectedIds.size} records marked as printed`)
  }

  const bulkMarkReady = async () => {
    const updates = Array.from(selectedIds).map(id => 
      fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ready: true }),
      })
    )
    await Promise.all(updates)
    setSelectedIds(new Set())
    fetchRecords()
    toast.success(`${selectedIds.size} records marked as ready`)
  }

  const bulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} records?`)) return
    
    const deletions = Array.from(selectedIds).map(id => 
      fetch(`/api/records/${id}`, { method: 'DELETE' })
    )
    await Promise.all(deletions)
    setSelectedIds(new Set())
    fetchRecords()
    toast.success(`${selectedIds.size} records deleted`)
  }

  const filteredRecords = useMemo(() => {
    let filtered = [...records]
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => 
        r.first_name.toLowerCase().includes(query) ||
        r.last_name.toLowerCase().includes(query) ||
        r.mrn.toLowerCase().includes(query) ||
        r.initials.toLowerCase().includes(query)
      )
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.order_type === filterType)
    }
    
    filtered.sort((a, b) => {
      if (sortBy === 'due_time') {
        return new Date(a.due_time).getTime() - new Date(b.due_time).getTime()
      } else if (sortBy === 'created_at') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else {
        return a.last_name.localeCompare(b.last_name)
      }
    })
    
    return filtered
  }, [records, searchQuery, filterType, sortBy])

  const waiterRecords = filteredRecords.filter(r => r.order_type === 'waiter')
  const acuteRecords = filteredRecords.filter(r => r.order_type === 'acute')
  const urgentRecords = filteredRecords.filter(r => r.order_type === 'urgent_mail')

  const stats = useMemo(() => ({
    total: records.length,
    waiter: records.filter(r => r.order_type === 'waiter').length,
    acute: records.filter(r => r.order_type === 'acute').length,
    urgent: records.filter(r => r.order_type === 'urgent_mail').length,
    overdue: records.filter(r => new Date(r.due_time) < new Date()).length,
  }), [records])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <RecordCardSkeleton />
          <RecordCardSkeleton />
          <RecordCardSkeleton />
          <RecordCardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Production Board
            </h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-800">
                {stats.total} Active
              </span>
              {stats.overdue > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800"
                >
                  {stats.overdue} Overdue
                </motion.span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </div>
            <motion.button
              onClick={handleRefresh}
              disabled={isRefreshing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-secondary"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              Refresh
            </motion.button>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, MRN, or initials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'btn-secondary',
                showFilters && 'bg-gray-100'
              )}
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className={cn('h-4 w-4 transition-transform', showFilters && 'rotate-180')} />
            </motion.button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex flex-wrap items-center gap-4 border-t pt-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Type:</span>
                  <div className="flex gap-1">
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'waiter', label: 'Waiter', color: 'bg-green-100 text-green-800' },
                      { value: 'acute', label: 'Acute', color: 'bg-blue-100 text-blue-800' },
                      { value: 'urgent_mail', label: 'Urgent', color: 'bg-purple-100 text-purple-800' },
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setFilterType(type.value as FilterType)}
                        className={cn(
                          'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                          filterType === type.value
                            ? type.color || 'bg-gray-100 text-gray-800'
                            : 'text-gray-500 hover:bg-gray-50'
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="input-field py-1.5"
                  >
                    <option value="due_time">Due Time</option>
                    <option value="created_at">Recently Added</option>
                    <option value="name">Name</option>
                  </select>
                </div>

                {(searchQuery || filterType !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setFilterType('all')
                    }}
                    className="text-sm text-teal-600 hover:text-teal-700"
                  >
                    Clear filters
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between rounded-xl bg-teal-50 px-4 py-3"
          >
            <span className="text-sm font-medium text-teal-800">
              {selectedIds.size} selected
            </span>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={bulkMarkPrinted}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Printer className="h-4 w-4" />
                Mark Printed
              </motion.button>
              <motion.button
                onClick={bulkMarkReady}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                Mark Ready
              </motion.button>
              <motion.button
                onClick={bulkDelete}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </motion.button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="rounded-lg p-1.5 text-teal-600 hover:bg-teal-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {filteredRecords.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50"
        >
          <Inbox className="h-12 w-12 text-gray-400" />
          <p className="mt-4 text-lg font-medium text-gray-600">
            {searchQuery || filterType !== 'all' ? 'No matching orders' : 'No Active Orders'}
          </p>
          <p className="text-sm text-gray-400">
            {searchQuery || filterType !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Orders will appear here when added from the Entry Board'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {waiterRecords.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                  Waiter Orders ({waiterRecords.length})
                </h3>
                <button
                  onClick={() => {
                    const waiterIds = waiterRecords.map(r => r.id)
                    if (waiterIds.every(id => selectedIds.has(id))) {
                      setSelectedIds(prev => {
                        const newSet = new Set(prev)
                        waiterIds.forEach(id => newSet.delete(id))
                        return newSet
                      })
                    } else {
                      setSelectedIds(prev => {
                        const newSet = new Set(prev)
                        waiterIds.forEach(id => newSet.add(id))
                        return newSet
                      })
                    }
                  }}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                >
                  {waiterRecords.every(r => selectedIds.has(r.id)) ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  Select all
                </button>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {waiterRecords.map((record) => (
                    <RecordCard
                      key={record.id}
                      record={record}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      isSelected={selectedIds.has(record.id)}
                      onSelect={() => toggleSelect(record.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {acuteRecords.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <span className="h-3 w-3 rounded-full bg-blue-500" />
                  Acute Orders ({acuteRecords.length})
                </h3>
                <button
                  onClick={() => {
                    const acuteIds = acuteRecords.map(r => r.id)
                    if (acuteIds.every(id => selectedIds.has(id))) {
                      setSelectedIds(prev => {
                        const newSet = new Set(prev)
                        acuteIds.forEach(id => newSet.delete(id))
                        return newSet
                      })
                    } else {
                      setSelectedIds(prev => {
                        const newSet = new Set(prev)
                        acuteIds.forEach(id => newSet.add(id))
                        return newSet
                      })
                    }
                  }}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                >
                  {acuteRecords.every(r => selectedIds.has(r.id)) ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  Select all
                </button>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {acuteRecords.map((record) => (
                    <RecordCard
                      key={record.id}
                      record={record}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      isSelected={selectedIds.has(record.id)}
                      onSelect={() => toggleSelect(record.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {urgentRecords.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <span className="h-3 w-3 rounded-full bg-purple-500" />
                  Urgent Mail Orders ({urgentRecords.length})
                </h3>
                <button
                  onClick={() => {
                    const urgentIds = urgentRecords.map(r => r.id)
                    if (urgentIds.every(id => selectedIds.has(id))) {
                      setSelectedIds(prev => {
                        const newSet = new Set(prev)
                        urgentIds.forEach(id => newSet.delete(id))
                        return newSet
                      })
                    } else {
                      setSelectedIds(prev => {
                        const newSet = new Set(prev)
                        urgentIds.forEach(id => newSet.add(id))
                        return newSet
                      })
                    }
                  }}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                >
                  {urgentRecords.every(r => selectedIds.has(r.id)) ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  Select all
                </button>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {urgentRecords.map((record) => (
                    <RecordCard
                      key={record.id}
                      record={record}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      isSelected={selectedIds.has(record.id)}
                      onSelect={() => toggleSelect(record.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
