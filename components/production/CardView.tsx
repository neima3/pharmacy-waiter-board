'use client'

import { useState, useEffect, useMemo, memo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Printer, CheckCircle, Edit3, Check, X, Clock, Pill, MessageSquare, User } from 'lucide-react'
import { WaiterRecord } from '@/lib/types'
import { cn, formatTimeRemaining, getTimeRemaining, formatTime, getElapsedMinutes } from '@/lib/utils'
import { OrderTypeBadge } from '@/components/OrderTypeBadge'

interface CardViewProps {
  records: WaiterRecord[]
  onUpdate: (id: number, updates: Partial<WaiterRecord>) => void
  onDelete: (id: number) => void
  selectedIds: Set<number>
  onToggleSelect: (id: number) => void
  largeDisplay?: boolean
}

export function CardView({ records, onUpdate, onDelete, selectedIds, onToggleSelect, largeDisplay = false }: CardViewProps) {
  return (
    <div className={cn(
      'grid gap-4',
      largeDisplay ? 'grid-cols-1 lg:grid-cols-2 gap-6' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
    )}>
      <AnimatePresence mode="popLayout">
        {records.map(record => (
          <RecordCard
            key={record.id}
            record={record}
            onUpdate={onUpdate}
            onDelete={onDelete}
            isSelected={selectedIds.has(record.id)}
            onToggleSelect={() => onToggleSelect(record.id)}
            largeDisplay={largeDisplay}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

const RecordCard = memo(function RecordCard({
  record, onUpdate, onDelete, isSelected, onToggleSelect, largeDisplay = false
}: {
  record: WaiterRecord
  onUpdate: (id: number, updates: Partial<WaiterRecord>) => void
  onDelete: (id: number) => void
  isSelected: boolean
  onToggleSelect: () => void
  largeDisplay?: boolean
}) {
  const [countdown, setCountdown] = useState(formatTimeRemaining(record.due_time))
  const [timeInfo, setTimeInfo] = useState(getTimeRemaining(record.due_time))
  const [elapsed, setElapsed] = useState(getElapsedMinutes(record.created_at))
  const [isEditingComments, setIsEditingComments] = useState(false)
  const [editedComments, setEditedComments] = useState(record.comments)
  const [showFullComment, setShowFullComment] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { setEditedComments(record.comments) }, [record.comments])

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
    }
  }, [isEditingComments])

  const handleSaveComments = () => {
    onUpdate(record.id, { comments: editedComments })
    setIsEditingComments(false)
  }

  const urgency = useMemo(() => {
    if (timeInfo.isOverdue) return { border: 'border-red-400', glow: 'shadow-red-100', badge: 'bg-red-600 text-white', label: 'OVERDUE', countdownColor: 'text-red-600' }
    if (timeInfo.total < 300000) return { border: 'border-orange-400', glow: 'shadow-orange-100', badge: 'bg-orange-500 text-white', label: 'CRITICAL', countdownColor: 'text-orange-600' }
    if (timeInfo.total < 600000) return { border: 'border-yellow-400', glow: 'shadow-yellow-100', badge: 'bg-yellow-500 text-white', label: 'DUE SOON', countdownColor: 'text-yellow-600' }
    if (timeInfo.total < 900000) return { border: 'border-amber-300', glow: '', badge: 'bg-amber-100 text-amber-800', label: 'DUE SOON', countdownColor: 'text-amber-600' }
    return { border: 'border-green-300', glow: '', badge: 'bg-green-100 text-green-800', label: 'ON TIME', countdownColor: 'text-green-600' }
  }, [timeInfo])

  const isLongComment = record.comments && record.comments.length > 100
  const displayComment = (!showFullComment && isLongComment) ? record.comments.slice(0, 100) + '...' : record.comments

  const progressPercent = useMemo(() => {
    const totalMs = record.order_type === 'waiter' ? 30 * 60 * 1000 : 60 * 60 * 1000
    const elapsedMs = totalMs - timeInfo.total
    return Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100))
  }, [timeInfo, record.order_type])

  const progressColor = timeInfo.isOverdue || timeInfo.total < 300000 ? 'bg-red-500' :
    timeInfo.total < 600000 ? 'bg-orange-500' :
    timeInfo.total < 900000 ? 'bg-yellow-500' : 'bg-green-500'

  const sz = largeDisplay ? {
    name: 'text-3xl', countdown: 'text-4xl', info: 'text-lg', badge: 'text-sm px-3 py-1', comment: 'text-lg', actionBtn: 'px-5 py-3 text-lg', actionIcon: 'h-6 w-6', pad: 'p-6',
  } : {
    name: 'text-xl', countdown: 'text-2xl', info: 'text-base', badge: 'text-xs px-2 py-0.5', comment: 'text-base', actionBtn: 'px-4 py-2.5 text-sm', actionIcon: 'h-5 w-5', pad: 'p-5',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'rounded-2xl border-2 bg-white shadow-lg transition-all',
        urgency.border, urgency.glow,
        isSelected && 'ring-2 ring-teal-400 ring-offset-2',
        (timeInfo.isOverdue || timeInfo.total < 300000) && 'animate-pulse'
      )}
    >
      {/* Progress bar */}
      <div className="h-1.5 rounded-t-2xl bg-gray-100 overflow-hidden">
        <motion.div
          className={cn('h-full rounded-t-2xl', progressColor)}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className={sz.pad}>
        {/* Header: select + name + badge + delete */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer flex-shrink-0 mt-1"
              aria-label={`Select ${record.first_name} ${record.last_name}`}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={cn('font-bold text-gray-900 truncate', sz.name)}>
                  {record.first_name} {record.last_name}
                </h3>
                <OrderTypeBadge type={record.order_type} className={sz.badge} />
                {record.printed && (
                  <span className={cn('inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 font-semibold', sz.badge)}>
                    <Printer className="h-3 w-3" /> Printed
                  </span>
                )}
              </div>
              <div className={cn('flex items-center gap-3 text-gray-500 mt-1', largeDisplay ? 'text-base' : 'text-sm')}>
                {record.mrn && <span>{record.mrn}</span>}
                <span className="flex items-center gap-1"><Pill className="h-3.5 w-3.5" /> <strong>{record.num_prescriptions}</strong> Rx</span>
                <span>By <strong className="uppercase">{record.initials}</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onDelete(record.id)}
            className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            aria-label={`Delete order for ${record.first_name} ${record.last_name}`}
          >
            <Trash2 className={sz.actionIcon} />
          </button>
        </div>

        {/* Countdown — the hero element */}
        <div className={cn('mt-4 flex items-center justify-between rounded-xl bg-gray-50 border', largeDisplay ? 'px-5 py-4' : 'px-4 py-3')}>
          <div>
            <div className={cn('font-mono font-black tabular-nums', sz.countdown, urgency.countdownColor)}>
              {countdown}
            </div>
            <div className={cn('text-gray-400', largeDisplay ? 'text-sm' : 'text-xs')}>
              Due {formatTime(record.due_time)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn('rounded-full font-bold', urgency.badge, sz.badge)}>
              {urgency.label}
            </span>
            <div className={cn('flex items-center gap-1 text-gray-400', largeDisplay ? 'text-base' : 'text-sm')}>
              <Clock className="h-4 w-4" />
              <span className="tabular-nums">{elapsed}m</span>
            </div>
          </div>
        </div>

        {/* Comments — always visible */}
        <div className="mt-3">
          {isEditingComments ? (
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 mt-2 text-teal-500 flex-shrink-0" />
              <textarea
                ref={textareaRef}
                value={editedComments}
                onChange={e => setEditedComments(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveComments() }
                  if (e.key === 'Escape') { setEditedComments(record.comments); setIsEditingComments(false) }
                }}
                className={cn('input-field flex-1 resize-none', sz.comment)}
                rows={2}
                placeholder="Add a comment..."
              />
              <div className="flex flex-col gap-1">
                <button onClick={handleSaveComments} className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg"><Check className="h-4 w-4" /></button>
                <button onClick={() => { setEditedComments(record.comments); setIsEditingComments(false) }} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4" /></button>
              </div>
            </div>
          ) : (
            <div
              className="flex items-start gap-2 cursor-pointer group rounded-lg p-1.5 -m-1.5 hover:bg-gray-50 transition-colors"
              onClick={() => setIsEditingComments(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingComments(true) }}
            >
              <MessageSquare className={cn('h-4 w-4 mt-0.5 flex-shrink-0 transition-colors', record.comments ? 'text-teal-500' : 'text-gray-300 group-hover:text-teal-400')} />
              {record.comments ? (
                <div className="flex-1">
                  <p className={cn('text-gray-700 leading-relaxed', sz.comment)}>{displayComment}</p>
                  {isLongComment && (
                    <button onClick={(e) => { e.stopPropagation(); setShowFullComment(!showFullComment) }} className="text-teal-600 hover:text-teal-700 text-sm font-medium mt-0.5">
                      {showFullComment ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
              ) : (
                <span className={cn('text-gray-400 italic group-hover:text-teal-500', sz.comment)}>Click to add comment...</span>
              )}
              <Edit3 className="h-3.5 w-3.5 flex-shrink-0 text-gray-300 group-hover:text-teal-400 mt-0.5" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={cn('mt-4 flex items-center gap-2', largeDisplay ? 'gap-3' : 'gap-2')}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onUpdate(record.id, { printed: !record.printed })}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors',
              sz.actionBtn,
              record.printed
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
            )}
          >
            <Printer className={sz.actionIcon} />
            {record.printed ? 'Printed' : 'Print'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onUpdate(record.id, { ready: true })}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-2 rounded-xl font-bold text-white transition-colors',
              sz.actionBtn,
              'bg-green-600 hover:bg-green-700 shadow-sm'
            )}
          >
            <CheckCircle className={sz.actionIcon} />
            Ready
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
})
