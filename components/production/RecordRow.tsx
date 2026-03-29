'use client'

import { useState, useEffect, useMemo, memo } from 'react'
import { Check, Trash2, Printer, CheckCircle, Edit3 } from 'lucide-react'
import { WaiterRecord } from '@/lib/types'
import { cn, formatTimeRemaining, getTimeRemaining, formatTime, getElapsedMinutes } from '@/lib/utils'
import { OrderTypeBadge } from '@/components/OrderTypeBadge'

interface RecordRowProps {
  record: WaiterRecord
  onUpdate: (id: number, updates: Partial<WaiterRecord>) => void
  onDelete: (id: number) => void
  isSelected: boolean
  onToggleSelect: () => void
}

export const RecordRow = memo(function RecordRow({ record, onUpdate, onDelete, isSelected, onToggleSelect }: RecordRowProps) {
  const [isEditingComments, setIsEditingComments] = useState(false)
  const [editedComments, setEditedComments] = useState(record.comments)
  const [countdown, setCountdown] = useState(formatTimeRemaining(record.due_time))
  const [timeInfo, setTimeInfo] = useState(getTimeRemaining(record.due_time))
  const [elapsed, setElapsed] = useState(getElapsedMinutes(record.created_at))

  const originalComments = useMemo(() => record.comments, [record.id, record.comments])
  const commentsEdited = editedComments !== originalComments && originalComments !== ''

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(formatTimeRemaining(record.due_time))
      setTimeInfo(getTimeRemaining(record.due_time))
      setElapsed(getElapsedMinutes(record.created_at))
    }, 1000)
    return () => clearInterval(interval)
  }, [record.due_time, record.created_at])

  const handleSaveComments = () => {
    onUpdate(record.id, { comments: editedComments })
    setIsEditingComments(false)
  }

  const getRowBackground = () => {
    if (isSelected) return 'bg-gradient-to-r from-teal-50 to-emerald-50 border-l-4 border-l-teal-500 shadow-md'
    if (timeInfo.isOverdue) return 'bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 border-l-4 border-l-red-500 shadow-sm'
    if (timeInfo.total < 300000) return 'bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border-l-4 border-l-orange-500 shadow-sm animate-pulse'
    if (timeInfo.total < 600000) return 'bg-gradient-to-r from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100 border-l-4 border-l-yellow-500 shadow-sm'
    return 'hover:from-gray-50 hover:to-slate-50 border-l-4 border-l-green-500'
  }

  const urgencyLabel = timeInfo.isOverdue ? 'Overdue' : timeInfo.total < 300000 ? 'Critical' : timeInfo.total < 600000 ? 'Due Soon' : null

  return (
    <div className={cn(
      'grid grid-cols-[auto_auto_1fr_auto_auto_auto_auto_auto_auto_auto] gap-2 border-b border-gray-100 px-3 py-3 items-center transition-colors cursor-grab active:cursor-grabbing',
      getRowBackground()
    )}>
      <div className="w-8 flex justify-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
          aria-label={`Select order for ${record.first_name} ${record.last_name}`}
        />
      </div>

      <div className="flex items-center gap-2 w-8">
        <OrderTypeBadge type={record.order_type} short />
      </div>

      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900 text-lg">
          {record.first_name} {record.last_name}
        </span>
        {record.mrn && (
          <span className="text-xs text-gray-500">({record.mrn})</span>
        )}
      </div>

      <div className="w-12 text-center font-medium text-gray-700 text-base">
        {record.num_prescriptions}
      </div>

      <div className="w-24 text-center">
        <div className={cn(
          'font-mono text-sm font-medium tabular-nums',
          timeInfo.isOverdue ? 'text-red-600' :
          timeInfo.total < 300000 ? 'text-orange-600' : 'text-gray-700'
        )} aria-label={`Time remaining: ${countdown}`}>
          {countdown}
        </div>
        <div className="text-xs text-gray-400">
          {formatTime(record.due_time)}
        </div>
        {urgencyLabel && (
          <span className={cn(
            'text-xs font-medium rounded px-1 py-0.5 mt-0.5 inline-block',
            timeInfo.isOverdue || timeInfo.total < 300000 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
          )} aria-label={urgencyLabel}>
            {urgencyLabel}
          </span>
        )}
      </div>

      <div className="w-20 text-center flex flex-col items-center">
        <span className="text-sm font-medium text-gray-600 tabular-nums">
          {elapsed}m
        </span>
      </div>

      <div className="w-12 text-center font-medium text-gray-700 uppercase text-base">
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
              className="input-field w-full py-0.5 text-base h-8"
              autoFocus
              aria-label="Edit comments"
            />
            <button onClick={handleSaveComments} className="p-1 text-green-600 hover:bg-green-100 rounded" aria-label="Save comments">
              <Check className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div
            className="flex items-center gap-1 cursor-pointer group w-full"
            onClick={() => setIsEditingComments(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingComments(true) }}
            aria-label={record.comments ? `Edit comment: ${record.comments}` : 'Add comment'}
          >
            <span className={cn('text-sm truncate max-w-[120px]', record.comments ? 'text-gray-700' : 'text-gray-400 italic')}>
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
            aria-label={`Mark ${record.first_name} ${record.last_name} as printed`}
          />
          <Printer className="h-3 w-3 text-gray-500" />
        </label>
        <label className="flex items-center gap-1 cursor-pointer" title="Ready">
          <input
            type="checkbox"
            checked={record.ready}
            onChange={() => onUpdate(record.id, { ready: true })}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            aria-label={`Mark ${record.first_name} ${record.last_name} as ready`}
          />
          <CheckCircle className="h-3 w-3 text-gray-500" />
        </label>
      </div>

      <div className="w-10 text-center">
        <button
          onClick={() => onDelete(record.id)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          aria-label={`Delete order for ${record.first_name} ${record.last_name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
})
