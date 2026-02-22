'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Inbox, Clock } from 'lucide-react'
import { WaiterRecord } from '@/lib/types'
import { RecordCard } from './RecordCard'
import { cn } from '@/lib/utils'

export function ProductionBoard() {
  const [records, setRecords] = useState<WaiterRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchRecords = useCallback(async () => {
    try {
      const response = await fetch('/api/records?type=production')
      const data = await response.json()
      setRecords(data)
    } catch (error) {
      console.error('Failed to fetch records:', error)
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
      }
    } catch (error) {
      console.error('Failed to delete record:', error)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchRecords()
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  const waiterRecords = records.filter(r => r.order_type === 'waiter')
  const acuteRecords = records.filter(r => r.order_type === 'acute')
  const urgentRecords = records.filter(r => r.order_type === 'urgent_mail')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Production Board
          </h2>
          <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-800">
            {records.length} Active
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-secondary"
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50">
          <Inbox className="h-12 w-12 text-gray-400" />
          <p className="mt-4 text-lg font-medium text-gray-600">No Active Orders</p>
          <p className="text-sm text-gray-400">Orders will appear here when added from the Entry Board</p>
        </div>
      ) : (
        <div className="space-y-8">
          {waiterRecords.length > 0 && (
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <span className="h-3 w-3 rounded-full bg-green-500" />
                Waiter Orders ({waiterRecords.length})
              </h3>
              <div className="grid gap-4 lg:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {waiterRecords.map((record) => (
                    <RecordCard
                      key={record.id}
                      record={record}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {acuteRecords.length > 0 && (
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                Acute Orders ({acuteRecords.length})
              </h3>
              <div className="grid gap-4 lg:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {acuteRecords.map((record) => (
                    <RecordCard
                      key={record.id}
                      record={record}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {urgentRecords.length > 0 && (
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <span className="h-3 w-3 rounded-full bg-purple-500" />
                Urgent Mail Orders ({urgentRecords.length})
              </h3>
              <div className="grid gap-4 lg:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {urgentRecords.map((record) => (
                    <RecordCard
                      key={record.id}
                      record={record}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
