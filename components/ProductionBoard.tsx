'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { AnimatePresence, Reorder } from 'framer-motion'
import { RefreshCw, Inbox, Clock, Plus, Search, Filter } from 'lucide-react'
import { WaiterRecord, OrderType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import { RecordRow } from '@/components/production/RecordRow'
import { BulkActions } from '@/components/production/BulkActions'
import { QuickAddModal } from '@/components/production/QuickAddModal'
import { MailWorkflow } from '@/components/production/MailWorkflow'
import { CompletedTab } from '@/components/production/CompletedTab'
import { ConfirmDialog } from '@/components/ConfirmDialog'

type TabType = 'active' | 'completed'

export function ProductionBoard() {
  const [records, setRecords] = useState<WaiterRecord[]>([])
  const [completedRecords, setCompletedRecords] = useState<WaiterRecord[]>([])
  const [mailQueueRecords, setMailQueueRecords] = useState<WaiterRecord[]>([])
  const [completedMailRecords, setCompletedMailRecords] = useState<WaiterRecord[]>([])
  const [mailHistoryRecords, setMailHistoryRecords] = useState<WaiterRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<TabType>('active')
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<OrderType | 'all'>('all')
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const { selectedIds, toggle, selectAll, clearAll, isAllSelected, pruneStale } = useBulkSelection()

  const fetchRecords = useCallback(async () => {
    try {
      const [activeRes, completedRes, mailQueueRes, completedMailRes, mailHistoryRes] = await Promise.all([
        fetch('/api/records?type=production'),
        fetch('/api/records?type=completed'),
        fetch('/api/records?type=mail_queue'),
        fetch('/api/records?type=completed_mail'),
        fetch('/api/records?type=mail_history')
      ])
      const [activeData, completedData, mailQueueData, completedMailData, mailHistoryData] = await Promise.all([
        activeRes.json(), completedRes.json(), mailQueueRes.json(), completedMailRes.json(), mailHistoryRes.json()
      ])

      setRecords(prev => {
        const idMap = new Map(prev.map((r, i) => [r.id, i]))
        return activeData.sort((a: WaiterRecord, b: WaiterRecord) => {
          if (idMap.has(a.id) && idMap.has(b.id)) {
            return idMap.get(a.id)! - idMap.get(b.id)!
          }
          return 0
        })
      })
      setCompletedRecords(completedData)
      setMailQueueRecords(mailQueueData)
      setCompletedMailRecords(completedMailData)
      setMailHistoryRecords(mailHistoryData)

      const activeIds = new Set<number>(activeData.map((r: WaiterRecord) => r.id))
      pruneStale(activeIds)
    } catch (error) {
      console.error('Failed to fetch records:', error)
      toast.error('Failed to fetch records')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
      setLastRefresh(new Date())
    }
  }, [pruneStale])

  // Polling with visibility awareness
  useEffect(() => {
    fetchRecords()
    let interval: NodeJS.Timeout

    const startPolling = () => {
      interval = setInterval(() => {
        if (!document.hidden) fetchRecords()
      }, 10000)
    }

    const handleVisibility = () => {
      if (!document.hidden) fetchRecords()
    }

    startPolling()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchRecords])

  const handleUpdate = useCallback(async (id: number, updates: Partial<WaiterRecord>) => {
    try {
      const response = await fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (response.ok) {
        fetchRecords()
      } else {
        toast.error('Failed to update record')
      }
    } catch {
      toast.error('Failed to update record')
    }
  }, [fetchRecords])

  const handleDelete = useCallback(async (id: number) => {
    setDeleteTarget(id)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (deleteTarget === null) return
    try {
      const response = await fetch(`/api/records/${deleteTarget}`, { method: 'DELETE' })
      if (response.ok) {
        fetchRecords()
        toast.success('Record deleted')
      }
    } catch {
      toast.error('Failed to delete record')
    } finally {
      setDeleteTarget(null)
    }
  }, [deleteTarget, fetchRecords])

  const handleMarkComplete = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })
      if (response.ok) {
        fetchRecords()
        toast.success('Order marked as complete')
      }
    } catch {
      toast.error('Failed to mark complete')
    }
  }, [fetchRecords])

  const handleBulkAction = useCallback(async (action: 'print' | 'ready') => {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds)
    toast.promise(
      Promise.all(ids.map(id => fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'print' ? { printed: true } : { ready: true }),
      }))),
      {
        loading: `Updating ${ids.length} records...`,
        success: () => {
          fetchRecords()
          clearAll()
          return `Updated ${ids.length} records`
        },
        error: 'Failed to process bulk action'
      }
    )
  }, [selectedIds, fetchRecords, clearAll])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    fetchRecords()
  }, [fetchRecords])

  const stats = useMemo(() => ({
    total: records.length,
    overdue: records.filter(r => new Date(r.due_time) < new Date()).length,
    completed: completedRecords.length,
    mailQueue: mailQueueRecords.length,
    completedMail: completedMailRecords.length,
    mailHistory: mailHistoryRecords.length
  }), [records, completedRecords, mailQueueRecords, completedMailRecords, mailHistoryRecords])

  const filteredRecords = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return records.filter(r => {
      const matchesSearch = !query ||
        r.first_name.toLowerCase().includes(query) ||
        r.last_name.toLowerCase().includes(query) ||
        (r.mrn && r.mrn.toLowerCase().includes(query))
      const matchesFilter = filterType === 'all' || r.order_type === filterType
      return matchesSearch && matchesFilter
    })
  }, [records, searchQuery, filterType])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Record"
        message="Are you sure you want to delete this record? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive
      />

      {/* Tab bar + controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex rounded-lg bg-gray-100 p-1" role="tablist" aria-label="Order tabs">
              <button
                onClick={() => setActiveTab('active')}
                role="tab"
                aria-selected={activeTab === 'active'}
                aria-controls="active-panel"
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Active Orders
                <span className={cn(
                  'ml-2 rounded-full px-2 py-0.5 text-xs',
                  activeTab === 'active' ? 'bg-teal-100 text-teal-800' : 'bg-gray-200 text-gray-600'
                )}>{stats.total}</span>
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                role="tab"
                aria-selected={activeTab === 'completed'}
                aria-controls="completed-panel"
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === 'completed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Completed
                <span className={cn(
                  'ml-2 rounded-full px-2 py-0.5 text-xs',
                  activeTab === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                )}>{stats.completed}</span>
              </button>
            </div>

            {activeTab === 'active' && stats.overdue > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800" role="status">
                {stats.overdue} Overdue
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeTab === 'active' && (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search name or MRN"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    aria-label="Search orders by name or MRN"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as OrderType | 'all')}
                    className="pl-8 pr-8 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 appearance-none bg-white"
                    aria-label="Filter by order type"
                  >
                    <option value="all">All Types</option>
                    <option value="waiter">Waiter</option>
                    <option value="acute">Acute</option>
                    <option value="urgent_mail">Urgent Mail</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-500 ml-2">
              <Clock className="h-4 w-4" />
              {lastRefresh.toLocaleTimeString()}
            </div>

            {activeTab === 'active' && (
              <button
                onClick={() => setShowQuickAdd(true)}
                className="btn-primary"
                aria-label="Quick add new order"
              >
                <Plus className="h-4 w-4" />
                Quick Add
              </button>
            )}

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn-secondary"
              aria-label="Refresh orders"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      <AnimatePresence>
        {selectedIds.size > 0 && activeTab === 'active' && (
          <BulkActions
            selectedCount={selectedIds.size}
            onBulkPrint={() => handleBulkAction('print')}
            onBulkReady={() => handleBulkAction('ready')}
          />
        )}
      </AnimatePresence>

      {/* Quick add */}
      {activeTab === 'active' && (
        <QuickAddModal isOpen={showQuickAdd} onClose={() => setShowQuickAdd(false)} onSuccess={fetchRecords} />
      )}

      {/* Tab panels */}
      {activeTab === 'active' ? (
        <div id="active-panel" role="tabpanel" aria-labelledby="active-tab">
          {filteredRecords.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50">
              <Inbox className="h-12 w-12 text-gray-400" />
              <p className="mt-4 text-lg font-medium text-gray-600">
                {records.length > 0 ? 'No matching orders' : 'No Active Orders'}
              </p>
              <p className="text-sm text-gray-400">
                {records.length > 0 ? 'Try changing your filters' : 'Click Quick Add to create a new order'}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="grid grid-cols-[auto_auto_1fr_auto_auto_auto_auto_auto_auto_auto] gap-2 border-b bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide items-center">
                <div className="w-8 flex justify-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected(filteredRecords.map(r => r.id))}
                    onChange={() => {
                      if (isAllSelected(filteredRecords.map(r => r.id))) clearAll()
                      else selectAll(filteredRecords.map(r => r.id))
                    }}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    aria-label="Select all orders"
                  />
                </div>
                <div className="w-8">Type</div>
                <div>Patient Name</div>
                <div className="w-12 text-center"># Rx</div>
                <div className="w-24 text-center">Due Time</div>
                <div className="w-20 text-center">Elapsed</div>
                <div className="w-12 text-center">Init</div>
                <div className="w-40">Comments</div>
                <div className="w-20 text-center">Status</div>
                <div className="w-10"></div>
              </div>

              <Reorder.Group axis="y" values={records} onReorder={setRecords} className="m-0 p-0 list-none">
                {filteredRecords.map((record) => (
                  <Reorder.Item key={record.id} value={record}>
                    <RecordRow
                      record={record}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      isSelected={selectedIds.has(record.id)}
                      onToggleSelect={() => toggle(record.id)}
                    />
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          )}

          <MailWorkflow
            mailQueue={mailQueueRecords}
            completedMail={completedMailRecords}
            mailHistory={mailHistoryRecords}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            stats={{ mailQueue: stats.mailQueue, completedMail: stats.completedMail, mailHistory: stats.mailHistory }}
          />
        </div>
      ) : (
        <div id="completed-panel" role="tabpanel" aria-labelledby="completed-tab">
          <CompletedTab records={completedRecords} onMarkComplete={handleMarkComplete} />
        </div>
      )}
    </div>
  )
}
