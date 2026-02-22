'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RefreshCw, Inbox, Clock, Plus, X, Check, Trash2, Printer, CheckCircle, Edit3
} from 'lucide-react'
import { WaiterRecord, OrderType } from '@/lib/types'
import { cn, formatTimeRemaining, getTimeRemaining, getOrderTypeLabel, formatTime } from '@/lib/utils'
import { toast } from 'sonner'

type TabType = 'active' | 'completed'

const orderTypeOptions: { value: OrderType; label: string; color: string }[] = [
  { value: 'waiter', label: 'W', color: 'green' },
  { value: 'acute', label: 'A', color: 'blue' },
  { value: 'urgent_mail', label: 'U', color: 'purple' },
]

export function ProductionBoard() {
  const [records, setRecords] = useState<WaiterRecord[]>([])
  const [completedRecords, setCompletedRecords] = useState<WaiterRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<TabType>('active')
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  
  const [quickAddForm, setQuickAddForm] = useState({
    first_name: '',
    last_name: '',
    mrn: '',
    num_prescriptions: 1,
    initials: '',
    order_type: 'waiter' as OrderType,
    comments: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchRecords = useCallback(async () => {
    try {
      const [activeRes, completedRes] = await Promise.all([
        fetch('/api/records?type=production'),
        fetch('/api/records?type=completed')
      ])
      const activeData = await activeRes.json()
      const completedData = await completedRes.json()
      setRecords(activeData)
      setCompletedRecords(completedData)
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
        fetchRecords()
        toast.success('Record deleted')
      }
    } catch (error) {
      console.error('Failed to delete record:', error)
      toast.error('Failed to delete record')
    }
  }

  const handleMarkComplete = async (id: number) => {
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
    } catch (error) {
      console.error('Failed to mark complete:', error)
      toast.error('Failed to mark complete')
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchRecords()
  }

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!quickAddForm.first_name.trim() || !quickAddForm.last_name.trim() || !quickAddForm.initials.trim()) {
      toast.error('First name, last name, and initials are required')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quickAddForm),
      })
      
      if (response.ok) {
        toast.success('Record created')
        setQuickAddForm({
          first_name: '',
          last_name: '',
          mrn: '',
          num_prescriptions: 1,
          initials: '',
          order_type: 'waiter',
          comments: ''
        })
        setShowQuickAdd(false)
        fetchRecords()
      } else {
        toast.error('Failed to create record')
      }
    } catch (error) {
      console.error('Failed to create record:', error)
      toast.error('Failed to create record')
    } finally {
      setIsSubmitting(false)
    }
  }

  const stats = useMemo(() => ({
    total: records.length,
    overdue: records.filter(r => new Date(r.due_time) < new Date()).length,
    completed: completedRecords.length
  }), [records, completedRecords])

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
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setActiveTab('active')}
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === 'active'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Active Orders
                <span className={cn(
                  'ml-2 rounded-full px-2 py-0.5 text-xs',
                  activeTab === 'active' ? 'bg-teal-100 text-teal-800' : 'bg-gray-200 text-gray-600'
                )}>
                  {stats.total}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === 'completed'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Completed
                <span className={cn(
                  'ml-2 rounded-full px-2 py-0.5 text-xs',
                  activeTab === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                )}>
                  {stats.completed}
                </span>
              </button>
            </div>
            
            {activeTab === 'active' && stats.overdue > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800"
              >
                {stats.overdue} Overdue
              </motion.span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              {lastRefresh.toLocaleTimeString()}
            </div>
            
            {activeTab === 'active' && (
              <motion.button
                onClick={() => setShowQuickAdd(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary"
              >
                <Plus className="h-4 w-4" />
                Quick Add
              </motion.button>
            )}
            
            <motion.button
              onClick={handleRefresh}
              disabled={isRefreshing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-secondary"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </motion.button>
          </div>
        </div>
      </div>

      {activeTab === 'active' && showQuickAdd && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleQuickAddSubmit}
          className="rounded-xl border-2 border-teal-200 bg-teal-50/50 p-4"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="First Name"
                value={quickAddForm.first_name}
                onChange={e => setQuickAddForm(prev => ({ ...prev, first_name: e.target.value }))}
                className="input-field w-32 py-1.5 text-sm"
                autoFocus
              />
              <input
                type="text"
                placeholder="Last Name"
                value={quickAddForm.last_name}
                onChange={e => setQuickAddForm(prev => ({ ...prev, last_name: e.target.value }))}
                className="input-field w-32 py-1.5 text-sm"
              />
              <input
                type="text"
                placeholder="MRN (opt)"
                value={quickAddForm.mrn}
                onChange={e => setQuickAddForm(prev => ({ ...prev, mrn: e.target.value }))}
                className="input-field w-28 py-1.5 text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600"># Rx:</span>
              <input
                type="number"
                min={1}
                value={quickAddForm.num_prescriptions}
                onChange={e => setQuickAddForm(prev => ({ ...prev, num_prescriptions: parseInt(e.target.value) || 1 }))}
                className="input-field w-16 py-1.5 text-sm text-center"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Initials"
                value={quickAddForm.initials}
                onChange={e => setQuickAddForm(prev => ({ ...prev, initials: e.target.value.toUpperCase().slice(0, 3) }))}
                className="input-field w-20 py-1.5 text-sm uppercase"
                maxLength={3}
              />
            </div>
            
            <div className="flex items-center gap-1">
              {orderTypeOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setQuickAddForm(prev => ({ ...prev, order_type: opt.value }))}
                  className={cn(
                    'rounded px-2 py-1 text-xs font-bold transition-colors',
                    quickAddForm.order_type === opt.value
                      ? opt.color === 'green' ? 'bg-green-500 text-white'
                        : opt.color === 'blue' ? 'bg-blue-500 text-white'
                        : 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            <input
              type="text"
              placeholder="Comments..."
              value={quickAddForm.comments}
              onChange={e => setQuickAddForm(prev => ({ ...prev, comments: e.target.value }))}
              className="input-field flex-1 min-w-[150px] py-1.5 text-sm"
            />
            
            <div className="flex items-center gap-2 ml-auto">
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary py-1.5"
              >
                {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Add
              </motion.button>
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.form>
      )}

      {activeTab === 'active' ? (
        records.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50"
          >
            <Inbox className="h-12 w-12 text-gray-400" />
            <p className="mt-4 text-lg font-medium text-gray-600">No Active Orders</p>
            <p className="text-sm text-gray-400">Click Quick Add to create a new order</p>
          </motion.div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto] gap-2 border-b bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div className="w-8">Type</div>
              <div>Patient Name</div>
              <div className="w-12 text-center"># Rx</div>
              <div className="w-24 text-center">Due Time</div>
              <div className="w-12 text-center">Init</div>
              <div className="w-40">Comments</div>
              <div className="w-20 text-center">Status</div>
              <div className="w-10"></div>
            </div>
            
            <AnimatePresence mode="popLayout">
              {records.map((record) => (
                <RecordRow
                  key={record.id}
                  record={record}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )
      ) : (
        completedRecords.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-green-300 bg-green-50"
          >
            <CheckCircle className="h-12 w-12 text-green-400" />
            <p className="mt-4 text-lg font-medium text-green-700">No Completed Orders</p>
            <p className="text-sm text-green-600">Orders ready for pickup will appear here</p>
          </motion.div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-green-200 bg-green-50/30">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-2 border-b border-green-200 bg-green-100/50 px-3 py-2 text-xs font-medium text-green-700 uppercase tracking-wide">
              <div className="w-8">Type</div>
              <div>Patient Name</div>
              <div className="w-12 text-center"># Rx</div>
              <div className="w-24 text-center">Ready At</div>
              <div className="w-12 text-center">Init</div>
              <div className="w-40">Comments</div>
              <div className="w-28 text-center">Action</div>
            </div>
            
            <AnimatePresence mode="popLayout">
              {completedRecords.map((record) => (
                <CompletedRecordRow
                  key={record.id}
                  record={record}
                  onMarkComplete={handleMarkComplete}
                />
              ))}
            </AnimatePresence>
          </div>
        )
      )}
    </div>
  )
}

interface RecordRowProps {
  record: WaiterRecord
  onUpdate: (id: number, updates: Partial<WaiterRecord>) => void
  onDelete: (id: number) => void
}

function RecordRow({ record, onUpdate, onDelete }: RecordRowProps) {
  const [isEditingComments, setIsEditingComments] = useState(false)
  const [editedComments, setEditedComments] = useState(record.comments)
  const [countdown, setCountdown] = useState(formatTimeRemaining(record.due_time))
  const [timeInfo, setTimeInfo] = useState(getTimeRemaining(record.due_time))
  
  const originalComments = useMemo(() => record.comments, [record.id])
  const commentsEdited = editedComments !== originalComments && originalComments !== ''

  useEffect(() => {
    const interval = setInterval(() => {
      const info = getTimeRemaining(record.due_time)
      setCountdown(formatTimeRemaining(record.due_time))
      setTimeInfo(info)
    }, 1000)
    return () => clearInterval(interval)
  }, [record.due_time])

  const handleSaveComments = () => {
    onUpdate(record.id, { comments: editedComments })
    setIsEditingComments(false)
  }

  const getRowBackground = () => {
    if (timeInfo.isOverdue) return 'bg-red-50 hover:bg-red-100'
    if (timeInfo.total < 300000) return 'bg-orange-50 hover:bg-orange-100'
    if (timeInfo.total < 600000) return 'bg-yellow-50 hover:bg-yellow-100'
    return 'hover:bg-gray-50'
  }

  const getTypeColor = () => {
    switch (record.order_type) {
      case 'waiter': return 'bg-green-500'
      case 'acute': return 'bg-blue-500'
      case 'urgent_mail': return 'bg-purple-500'
    }
  }

  const getTypeBadge = () => {
    switch (record.order_type) {
      case 'waiter': return 'bg-green-100 text-green-700'
      case 'acute': return 'bg-blue-100 text-blue-700'
      case 'urgent_mail': return 'bg-purple-100 text-purple-700'
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        'grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto] gap-2 border-b border-gray-100 px-3 py-2.5 items-center transition-colors',
        getRowBackground()
      )}
    >
      <div className="flex items-center gap-2 w-8">
        <div className={cn('w-1 h-8 rounded-full', getTypeColor())} />
        <span className={cn('rounded px-1.5 py-0.5 text-xs font-bold', getTypeBadge())}>
          {record.order_type === 'waiter' ? 'W' : record.order_type === 'acute' ? 'A' : 'U'}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900 text-base">
          {record.first_name} {record.last_name}
        </span>
        {record.mrn && (
          <span className="text-xs text-gray-500">({record.mrn})</span>
        )}
      </div>
      
      <div className="w-12 text-center font-medium text-gray-700">
        {record.num_prescriptions}
      </div>
      
      <div className="w-24 text-center">
        <div className={cn(
          'font-mono text-sm font-medium tabular-nums',
          timeInfo.isOverdue ? 'text-red-600' : 
          timeInfo.total < 300000 ? 'text-orange-600' : 'text-gray-700'
        )}>
          {countdown}
        </div>
        <div className="text-xs text-gray-400">
          {formatTime(record.due_time)}
        </div>
      </div>
      
      <div className="w-12 text-center font-medium text-gray-700 uppercase">
        {record.initials}
      </div>
      
      <div className="w-40 flex items-center gap-1">
        {isEditingComments ? (
          <div className="flex items-center gap-1 w-full">
            <input
              type="text"
              value={editedComments}
              onChange={e => setEditedComments(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveComments()
                if (e.key === 'Escape') {
                  setEditedComments(record.comments)
                  setIsEditingComments(false)
                }
              }}
              className="input-field w-full py-0.5 text-sm"
              autoFocus
            />
            <button onClick={handleSaveComments} className="p-1 text-green-600 hover:bg-green-100 rounded">
              <Check className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div 
            className="flex items-center gap-1 cursor-pointer group w-full"
            onClick={() => setIsEditingComments(true)}
          >
            <span className={cn('text-sm truncate', record.comments ? 'text-gray-700' : 'text-gray-400 italic')}>
              {record.comments || 'Add...'}
            </span>
            {commentsEdited && (
              <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="Edited" />
            )}
            <Edit3 className="h-3 w-3 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
          </div>
        )}
      </div>
      
      <div className="w-20 flex items-center justify-center gap-2">
        <label className="flex items-center gap-1 cursor-pointer" title="Printed">
          <input
            type="checkbox"
            checked={record.printed}
            onChange={() => onUpdate(record.id, { printed: !record.printed })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Printer className="h-3 w-3 text-gray-500" />
        </label>
        <label className="flex items-center gap-1 cursor-pointer" title="Ready">
          <input
            type="checkbox"
            checked={record.ready}
            onChange={() => onUpdate(record.id, { ready: true })}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <CheckCircle className="h-3 w-3 text-gray-500" />
        </label>
      </div>
      
      <div className="w-10 text-center">
        <button
          onClick={() => onDelete(record.id)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

interface CompletedRecordRowProps {
  record: WaiterRecord
  onMarkComplete: (id: number) => void
}

function CompletedRecordRow({ record, onMarkComplete }: CompletedRecordRowProps) {
  const getTypeColor = () => {
    switch (record.order_type) {
      case 'waiter': return 'bg-green-500'
      case 'acute': return 'bg-blue-500'
      case 'urgent_mail': return 'bg-purple-500'
    }
  }

  const getTypeBadge = () => {
    switch (record.order_type) {
      case 'waiter': return 'bg-green-100 text-green-700'
      case 'acute': return 'bg-blue-100 text-blue-700'
      case 'urgent_mail': return 'bg-purple-100 text-purple-700'
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-2 border-b border-green-100 px-3 py-2.5 items-center hover:bg-green-100/50 transition-colors"
    >
      <div className="flex items-center gap-2 w-8">
        <div className={cn('w-1 h-8 rounded-full', getTypeColor())} />
        <span className={cn('rounded px-1.5 py-0.5 text-xs font-bold', getTypeBadge())}>
          {record.order_type === 'waiter' ? 'W' : record.order_type === 'acute' ? 'A' : 'U'}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900 text-base">
          {record.first_name} {record.last_name}
        </span>
        {record.mrn && (
          <span className="text-xs text-gray-500">({record.mrn})</span>
        )}
      </div>
      
      <div className="w-12 text-center font-medium text-gray-700">
        {record.num_prescriptions}
      </div>
      
      <div className="w-24 text-center text-sm text-gray-600">
        {record.ready_at ? formatTime(record.ready_at) : '-'}
      </div>
      
      <div className="w-12 text-center font-medium text-gray-700 uppercase">
        {record.initials}
      </div>
      
      <div className="w-40 text-sm text-gray-600 truncate">
        {record.comments || '-'}
      </div>
      
      <div className="w-28 text-center">
        <motion.button
          onClick={() => onMarkComplete(record.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
        >
          <CheckCircle className="h-4 w-4" />
          Complete
        </motion.button>
      </div>
    </motion.div>
  )
}
