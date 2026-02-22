'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Printer, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Edit3, 
  Save, 
  X,
  Pill,
  CheckSquare,
  Square
} from 'lucide-react'
import { WaiterRecord } from '@/lib/types'
import { cn, formatTimeRemaining, getTimeRemaining, getElapsedMinutes, getOrderTypeLabel, formatTime, formatDOB } from '@/lib/utils'

interface RecordCardProps {
  record: WaiterRecord
  onUpdate: (id: number, updates: Partial<WaiterRecord>) => void
  onDelete: (id: number) => void
  isSelected?: boolean
  onSelect?: () => void
}

export function RecordCard({ record, onUpdate, onDelete, isSelected = false, onSelect }: RecordCardProps) {
  const [isEditingComments, setIsEditingComments] = useState(false)
  const [editedComments, setEditedComments] = useState(record.comments)
  const [countdown, setCountdown] = useState(formatTimeRemaining(record.due_time))
  const [timeInfo, setTimeInfo] = useState(getTimeRemaining(record.due_time))

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

  const handlePrintedChange = () => {
    onUpdate(record.id, { printed: !record.printed })
  }

  const handleReadyChange = () => {
    onUpdate(record.id, { ready: true })
  }

  const urgencyColor = useMemo(() => {
    if (timeInfo.isOverdue) return 'red'
    if (timeInfo.total < 300000) return 'red'
    if (timeInfo.total < 600000) return 'orange'
    if (timeInfo.total < 900000) return 'yellow'
    return 'green'
  }, [timeInfo])

  const urgencyClasses: Record<string, string> = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    orange: 'text-orange-600',
    red: 'countdown-overdue'
  }

  const progressPercentage = useMemo(() => {
    const totalTime = record.order_type === 'waiter' ? 30 * 60 * 1000 : 60 * 60 * 1000
    const elapsed = totalTime - timeInfo.total
    return Math.min(100, Math.max(0, (elapsed / totalTime) * 100))
  }, [timeInfo, record.order_type])

  const progressColor = useMemo(() => {
    if (timeInfo.isOverdue) return 'bg-red-500'
    if (timeInfo.total < 300000) return 'bg-red-500'
    if (timeInfo.total < 600000) return 'bg-orange-500'
    if (timeInfo.total < 900000) return 'bg-yellow-500'
    return 'bg-green-500'
  }, [timeInfo])

  const cardClasses = cn(
    'rounded-xl border-2 p-4 transition-all duration-300 relative',
    record.order_type === 'waiter' && 'order-waiter',
    record.order_type === 'acute' && 'order-acute',
    record.order_type === 'urgent_mail' && 'order-urgent',
    timeInfo.isOverdue && 'ring-2 ring-red-400 ring-offset-2',
    record.printed && 'opacity-75',
    isSelected && 'ring-2 ring-teal-500 ring-offset-2 bg-teal-50/50'
  )

  const badgeClasses = cn(
    'status-badge',
    record.order_type === 'waiter' && 'badge-waiter',
    record.order_type === 'acute' && 'badge-acute',
    record.order_type === 'urgent_mail' && 'badge-urgent'
  )

  const elapsedMinutes = getElapsedMinutes(record.created_at)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cardClasses}
    >
      <div className="absolute top-2 left-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden -mx-4 px-4">
        <motion.div
          className={`h-full ${progressColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="flex items-start justify-between pt-2">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {onSelect && (
              <button
                onClick={onSelect}
                className="text-gray-400 hover:text-teal-600 transition-colors"
              >
                {isSelected ? (
                  <CheckSquare className="h-5 w-5" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
              </button>
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              {record.first_name} {record.last_name}
            </h3>
            <span className={badgeClasses}>
              {getOrderTypeLabel(record.order_type)}
            </span>
            {record.printed && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="status-badge bg-gray-100 text-gray-600"
              >
                <Printer className="mr-1 h-3 w-3" />
                Printed
              </motion.span>
            )}
            {record.ready && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="status-badge bg-green-100 text-green-600"
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Ready
              </motion.span>
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
          <motion.div
            key={countdown}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className={cn(
              'text-lg font-bold tabular-nums',
              urgencyClasses[urgencyColor]
            )}
          >
            {countdown}
          </motion.div>
          <div className="text-xs text-gray-500">
            Due: {formatTime(record.due_time)}
          </div>
          <div className="mt-1 flex items-center justify-end gap-1 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            In system: {elapsedMinutes}m
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Comments:</span>
          {isEditingComments ? (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-1 items-center gap-2"
            >
              <input
                type="text"
                value={editedComments}
                onChange={(e) => setEditedComments(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveComments()
                  if (e.key === 'Escape') {
                    setEditedComments(record.comments)
                    setIsEditingComments(false)
                  }
                }}
                className="input-field flex-1 py-1"
                autoFocus
              />
              <motion.button
                onClick={handleSaveComments}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="rounded-lg bg-green-500 p-1.5 text-white hover:bg-green-600"
              >
                <Save className="h-4 w-4" />
              </motion.button>
              <motion.button
                onClick={() => {
                  setEditedComments(record.comments)
                  setIsEditingComments(false)
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="rounded-lg bg-gray-500 p-1.5 text-white hover:bg-gray-600"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.span
              className="cursor-pointer hover:text-gray-900 flex items-center"
              onClick={() => setIsEditingComments(true)}
              whileHover={{ x: 2 }}
            >
              {record.comments || <span className="italic text-gray-400">Add comment...</span>}
              <Edit3 className="ml-1 h-3 w-3" />
            </motion.span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 group">
            <input
              type="checkbox"
              checked={record.printed}
              onChange={handlePrintedChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Printed</span>
          </label>
          
          <label className="flex cursor-pointer items-center gap-2 group">
            <input
              type="checkbox"
              checked={record.ready}
              onChange={handleReadyChange}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors">Ready</span>
          </label>
        </div>

        <motion.button
          onClick={() => onDelete(record.id)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}
