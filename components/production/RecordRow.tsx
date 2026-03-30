'use client'

import { useState, useEffect, useMemo, memo, useRef } from 'react'
import { motion } from 'framer-motion'
import { Check, Trash2, Printer, CheckCircle, Edit3, X, Clock, Pill, MessageSquare } from 'lucide-react'
import { WaiterRecord } from '@/lib/types'
import { cn, formatTimeRemaining, getTimeRemaining, formatTime, getElapsedMinutes } from '@/lib/utils'
import { OrderTypeBadge } from '@/components/OrderTypeBadge'

interface RecordRowProps {
  record: WaiterRecord
  onUpdate: (id: number, updates: Partial<WaiterRecord>) => void
  onDelete: (id: number) => void
  isSelected?: boolean
  onToggleSelect?: () => void
  largeDisplay?: boolean
}

export const RecordRow = memo(function RecordRow({ record, onUpdate, onDelete, isSelected = false, onToggleSelect, largeDisplay = false }: RecordRowProps) {
  const [isEditingComments, setIsEditingComments] = useState(false)
  const [editedComments, setEditedComments] = useState(record.comments)
  const [countdown, setCountdown] = useState(formatTimeRemaining(record.due_time))
  const [timeInfo, setTimeInfo] = useState(getTimeRemaining(record.due_time))
  const [elapsed, setElapsed] = useState(getElapsedMinutes(record.created_at))
  const [showFullComment, setShowFullComment] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditedComments(record.comments)
  }, [record.comments])

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(formatTimeRemaining(record.due_time))
      setTimeInfo(getTimeRemaining(record.due_time))
      setElapsed(getElapsedMinutes(record.created_at))
    }, 1000)
    return () => clearInterval(interval)
  }, [record.due_time, record.created_at])

  useEffect(() => {
    if (isEditingComments && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length)
    }
  }, [isEditingComments])

  const handleSaveComments = () => {
    onUpdate(record.id, { comments: editedComments })
    setIsEditingComments(false)
  }

  const urgencyConfig = useMemo(() => {
    if (timeInfo.isOverdue) return { bg: 'bg-red-50 border-l-red-500', ring: 'ring-red-200', badge: 'bg-red-100 text-red-800', label: 'OVERDUE', pulse: true }
    if (timeInfo.total < 300000) return { bg: 'bg-orange-50 border-l-orange-500', ring: 'ring-orange-200', badge: 'bg-orange-100 text-orange-800', label: 'CRITICAL', pulse: true }
    if (timeInfo.total < 600000) return { bg: 'bg-yellow-50 border-l-yellow-500', ring: 'ring-yellow-200', badge: 'bg-yellow-100 text-yellow-800', label: 'DUE SOON', pulse: false }
    if (timeInfo.total < 900000) return { bg: 'bg-amber-50/50 border-l-amber-400', ring: '', badge: 'bg-amber-100 text-amber-700', label: 'DUE SOON', pulse: false }
    return { bg: 'bg-white border-l-green-500', ring: '', badge: 'bg-green-100 text-green-700', label: 'ON TIME', pulse: false }
  }, [timeInfo])

  const isLongComment = record.comments && record.comments.length > 100
  const displayComment = (!showFullComment && isLongComment) ? record.comments.slice(0, 100) + '...' : record.comments

  const sz = largeDisplay ? {
    name: 'text-2xl', info: 'text-lg', countdown: 'text-2xl', badge: 'text-sm px-2.5 py-1', action: 'h-6 w-6', actionBtn: 'px-4 py-2.5 text-base', comment: 'text-lg', pad: 'px-6 py-5', gap: 'gap-4',
  } : {
    name: 'text-xl', info: 'text-base', countdown: 'text-lg', badge: 'text-xs px-2 py-0.5', action: 'h-5 w-5', actionBtn: 'px-3 py-2 text-sm', comment: 'text-base', pad: 'px-4 py-4', gap: 'gap-3',
  }

  return (
    <div className={cn(
      'border-b border-l-4 transition-all',
      urgencyConfig.bg,
      isSelected && 'ring-2 ring-teal-400 bg-teal-50/80',
      urgencyConfig.pulse && 'animate-pulse',
      sz.pad
    )}>
      {/* Row 1: Main info */}
      <div className={cn('flex items-center justify-between', sz.gap)}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer flex-shrink-0"
              aria-label={`Select order for ${record.first_name} ${record.last_name}`}
            />
          )}
          <OrderTypeBadge type={record.order_type} short className={sz.badge} />
          <span className={cn('font-bold text-gray-900 truncate', sz.name)}>
            {record.first_name} {record.last_name}
          </span>
          {record.mrn && (
            <span className={cn('text-gray-400 flex-shrink-0', largeDisplay ? 'text-base' : 'text-sm')}>
              {record.mrn}
            </span>
          )}
          <div className={cn('flex items-center gap-1.5 text-gray-500 flex-shrink-0', sz.info)}>
            <Pill className={cn('flex-shrink-0', largeDisplay ? 'h-5 w-5' : 'h-4 w-4')} />
            <span className="font-semibold">{record.num_prescriptions}</span>
            <span className="text-gray-400">Rx</span>
          </div>
          <span className={cn('font-semibold text-gray-500 uppercase flex-shrink-0', largeDisplay ? 'text-base' : 'text-sm')}>
            {record.initials}
          </span>
          {record.printed && (
            <span className={cn('inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 font-semibold flex-shrink-0', sz.badge)}>
              <Printer className="h-3 w-3" /> Printed
            </span>
          )}
        </div>

        {/* Right side: countdown + actions */}
        <div className={cn('flex items-center flex-shrink-0', largeDisplay ? 'gap-5' : 'gap-4')}>
          <div className="text-right">
            <div className={cn(
              'font-mono font-bold tabular-nums',
              sz.countdown,
              timeInfo.isOverdue || timeInfo.total < 300000 ? 'text-red-600' :
              timeInfo.total < 600000 ? 'text-orange-600' :
              timeInfo.total < 900000 ? 'text-yellow-600' : 'text-green-600'
            )}>
              {countdown}
            </div>
            <div className={cn('text-gray-400 tabular-nums', largeDisplay ? 'text-sm' : 'text-xs')}>
              Due {formatTime(record.due_time)}
            </div>
          </div>

          <span className={cn('rounded-full font-bold', urgencyConfig.badge, sz.badge)}>
            {urgencyConfig.label}
          </span>

          <div className={cn('flex items-center gap-1 text-gray-400', largeDisplay ? 'text-base' : 'text-sm')}>
            <Clock className={cn(largeDisplay ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
            <span className="tabular-nums font-medium">{elapsed}m</span>
          </div>

          <div className={cn('flex items-center', largeDisplay ? 'gap-2' : 'gap-1.5')}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onUpdate(record.id, { printed: !record.printed })}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg font-semibold transition-colors',
                sz.actionBtn,
                record.printed
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              )}
              aria-label={`Mark as ${record.printed ? 'not printed' : 'printed'}`}
            >
              <Printer className={sz.action} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onUpdate(record.id, { ready: true })}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg font-semibold transition-colors',
                sz.actionBtn,
                'bg-green-600 text-white hover:bg-green-700'
              )}
              aria-label={`Mark ${record.first_name} ${record.last_name} as ready`}
            >
              <CheckCircle className={sz.action} />
              <span>Ready</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDelete(record.id)}
              className={cn(
                'rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors',
                largeDisplay ? 'p-2.5' : 'p-2'
              )}
              aria-label={`Delete order for ${record.first_name} ${record.last_name}`}
            >
              <Trash2 className={sz.action} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Row 2: Comments — always visible */}
      <div className={cn('mt-2', onToggleSelect ? (largeDisplay ? 'ml-11' : 'ml-8') : '')}>
        {isEditingComments ? (
          <div className="flex items-start gap-2">
            <MessageSquare className={cn('mt-1.5 text-teal-500 flex-shrink-0', largeDisplay ? 'h-5 w-5' : 'h-4 w-4')} />
            <textarea
              ref={textareaRef}
              value={editedComments}
              onChange={e => setEditedComments(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveComments() }
                if (e.key === 'Escape') { setEditedComments(record.comments); setIsEditingComments(false) }
              }}
              className={cn('input-field flex-1 resize-none', largeDisplay ? 'text-lg py-2' : 'text-base py-1.5')}
              rows={2}
              placeholder="Add a comment..."
              aria-label="Edit comments"
            />
            <div className="flex flex-col gap-1">
              <button onClick={handleSaveComments} className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg" aria-label="Save">
                <Check className={cn(largeDisplay ? 'h-5 w-5' : 'h-4 w-4')} />
              </button>
              <button onClick={() => { setEditedComments(record.comments); setIsEditingComments(false) }} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg" aria-label="Cancel">
                <X className={cn(largeDisplay ? 'h-5 w-5' : 'h-4 w-4')} />
              </button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'flex items-start gap-2 cursor-pointer group rounded-lg transition-colors',
              record.comments ? 'hover:bg-white/60 p-1 -m-1' : 'p-1 -m-1 hover:bg-white/60'
            )}
            onClick={() => setIsEditingComments(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingComments(true) }}
          >
            <MessageSquare className={cn(
              'mt-0.5 flex-shrink-0 transition-colors',
              largeDisplay ? 'h-5 w-5' : 'h-4 w-4',
              record.comments ? 'text-teal-500' : 'text-gray-300 group-hover:text-teal-400'
            )} />
            {record.comments ? (
              <div className="flex-1">
                <p className={cn('text-gray-700 leading-relaxed', sz.comment)}>
                  {displayComment}
                </p>
                {isLongComment && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowFullComment(!showFullComment) }}
                    className="text-teal-600 hover:text-teal-700 text-sm font-medium mt-0.5"
                  >
                    {showFullComment ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            ) : (
              <span className={cn('text-gray-400 italic group-hover:text-teal-500 transition-colors', sz.comment)}>
                Click to add comment...
              </span>
            )}
            <Edit3 className={cn('flex-shrink-0 text-gray-300 group-hover:text-teal-400 transition-colors mt-0.5', largeDisplay ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
          </div>
        )}
      </div>
    </div>
  )
})
