'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Printer, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Edit3, 
  Save, 
  X,
  Pill
} from 'lucide-react'
import { WaiterRecord } from '@/lib/types'
import { cn, formatTimeRemaining, getTimeRemaining, getElapsedMinutes, getOrderTypeLabel, formatTime, formatDOB } from '@/lib/utils'

interface RecordCardProps {
  record: WaiterRecord
  onUpdate: (id: number, updates: Partial<WaiterRecord>) => void
  onDelete: (id: number) => void
}

export function RecordCard({ record, onUpdate, onDelete }: RecordCardProps) {
  const [isEditingComments, setIsEditingComments] = useState(false)
  const [editedComments, setEditedComments] = useState(record.comments)
  const [countdown, setCountdown] = useState(formatTimeRemaining(record.due_time))
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const timeInfo = getTimeRemaining(record.due_time)
      setCountdown(formatTimeRemaining(record.due_time))
      setIsUrgent(timeInfo.total < 300000 || timeInfo.isOverdue)
    }, 1000)

    return () => clearInterval(interval)
  }, [record.due_time])

  const handleSaveComments = () => {
    onUpdate(record.id, { comments: editedComments })
    setIsEditingComments(false)
  }

  const handlePrintedChange = () => {
    onUpdate(record.id, { printed: !record.printed })
  }

  const handleReadyChange = () => {
    onUpdate(record.id, { ready: true })
  }

  const cardClasses = cn(
    'rounded-xl border-2 p-4 transition-all duration-300',
    record.order_type === 'waiter' && 'order-waiter',
    record.order_type === 'acute' && 'order-acute',
    record.order_type === 'urgent_mail' && 'order-urgent',
    isUrgent && 'ring-2 ring-red-400 ring-offset-2',
    record.printed && 'opacity-75'
  )

  const badgeClasses = cn(
    'status-badge',
    record.order_type === 'waiter' && 'badge-waiter',
    record.order_type === 'acute' && 'badge-acute',
    record.order_type === 'urgent_mail' && 'badge-urgent'
  )

  const elapsedMinutes = getElapsedMinutes(record.created_at)
  const timeInfo = getTimeRemaining(record.due_time)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cardClasses}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {record.first_name} {record.last_name}
            </h3>
            <span className={badgeClasses}>
              {getOrderTypeLabel(record.order_type)}
            </span>
            {record.printed && (
              <span className="status-badge bg-gray-100 text-gray-600">
                <Printer className="mr-1 h-3 w-3" />
                Printed
              </span>
            )}
          </div>
          
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
            <span>MRN: <strong>{record.mrn}</strong></span>
            <span>DOB: <strong>{formatDOB(record.dob)}</strong></span>
            <span className="flex items-center gap-1">
              <Pill className="h-4 w-4" />
              <strong>{record.num_prescriptions}</strong> Rx
            </span>
            <span>By: <strong>{record.initials}</strong></span>
          </div>
        </div>

        <div className="text-right">
          <div className={cn(
            'text-lg font-bold',
            timeInfo.isOverdue ? 'countdown-overdue' : isUrgent ? 'countdown-urgent' : 'text-gray-900'
          )}>
            {countdown}
          </div>
          <div className="text-xs text-gray-500">
            Due: {formatTime(record.due_time)}
          </div>
          <div className="mt-1 text-xs text-gray-400">
            In system: {elapsedMinutes}m
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Comments:</span>
          {isEditingComments ? (
            <div className="flex flex-1 items-center gap-2">
              <input
                type="text"
                value={editedComments}
                onChange={(e) => setEditedComments(e.target.value)}
                className="input-field flex-1 py-1"
                autoFocus
              />
              <button
                onClick={handleSaveComments}
                className="rounded-lg bg-green-500 p-1.5 text-white hover:bg-green-600"
              >
                <Save className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setEditedComments(record.comments)
                  setIsEditingComments(false)
                }}
                className="rounded-lg bg-gray-500 p-1.5 text-white hover:bg-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <span
              className="cursor-pointer hover:text-gray-900"
              onClick={() => setIsEditingComments(true)}
            >
              {record.comments || <span className="italic text-gray-400">Add comment...</span>}
              <Edit3 className="ml-1 inline h-3 w-3" />
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={record.printed}
              onChange={handlePrintedChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Printed</span>
          </label>
          
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={record.ready}
              onChange={handleReadyChange}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm font-medium text-gray-700">Ready</span>
          </label>
        </div>

        <button
          onClick={() => onDelete(record.id)}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}
