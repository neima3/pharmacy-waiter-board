'use client'

import { useState, useEffect, useMemo, memo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Printer, CheckCircle, Edit3, Check, X, Clock, Pill, MessageSquare, ArrowRight } from 'lucide-react'
import { WaiterRecord } from '@/lib/types'
import { cn, formatTimeRemaining, getTimeRemaining, formatTime, getElapsedMinutes } from '@/lib/utils'
import { OrderTypeBadge } from '@/components/OrderTypeBadge'

interface KanbanViewProps {
  records: WaiterRecord[]
  onUpdate: (id: number, updates: Partial<WaiterRecord>) => void
  onDelete: (id: number) => void
  selectedIds: Set<number>
  onToggleSelect: (id: number) => void
  largeDisplay?: boolean
}

export function KanbanView({ records, onUpdate, onDelete, selectedIds, onToggleSelect, largeDisplay = false }: KanbanViewProps) {
  const columns = useMemo(() => {
    const newOrders = records.filter(r => !r.printed && !r.ready)
    const printed = records.filter(r => r.printed && !r.ready)
    const ready = records.filter(r => r.ready)
    return { newOrders, printed, ready }
  }, [records])

  const sz = largeDisplay ? { title: 'text-xl', count: 'text-lg' } : { title: 'text-base', count: 'text-sm' }

  return (
    <div className={cn('grid grid-cols-3', largeDisplay ? 'gap-6' : 'gap-4')}>
      {/* New Orders Column */}
      <KanbanColumn
        title="Intake"
        count={columns.newOrders.length}
        color="blue"
        records={columns.newOrders}
        onUpdate={onUpdate}
        onDelete={onDelete}
        selectedIds={selectedIds}
        onToggleSelect={onToggleSelect}
        largeDisplay={largeDisplay}
        actionLabel="Print"
        actionIcon={<Printer className={cn(largeDisplay ? 'h-5 w-5' : 'h-4 w-4')} />}
        onAction={(id) => onUpdate(id, { printed: true })}
        actionColor="bg-blue-600 hover:bg-blue-700 text-white"
      />

      {/* Printed Column */}
      <KanbanColumn
        title="Production"
        count={columns.printed.length}
        color="amber"
        records={columns.printed}
        onUpdate={onUpdate}
        onDelete={onDelete}
        selectedIds={selectedIds}
        onToggleSelect={onToggleSelect}
        largeDisplay={largeDisplay}
        actionLabel="Ready"
        actionIcon={<CheckCircle className={cn(largeDisplay ? 'h-5 w-5' : 'h-4 w-4')} />}
        onAction={(id) => onUpdate(id, { ready: true })}
        actionColor="bg-green-600 hover:bg-green-700 text-white"
      />

      {/* Ready Column */}
      <KanbanColumn
        title="Ready"
        count={columns.ready.length}
        color="green"
        records={columns.ready}
        onUpdate={onUpdate}
        onDelete={onDelete}
        selectedIds={selectedIds}
        onToggleSelect={onToggleSelect}
        largeDisplay={largeDisplay}
        actionLabel="Complete"
        actionIcon={<CheckCircle className={cn(largeDisplay ? 'h-5 w-5' : 'h-4 w-4')} />}
        onAction={(id) => onUpdate(id, { completed: true })}
        actionColor="bg-teal-600 hover:bg-teal-700 text-white"
      />
    </div>
  )
}

const colorConfig = {
  blue: { header: 'from-blue-500 to-blue-600', bg: 'bg-blue-50/50', border: 'border-blue-200', dot: 'bg-blue-500' },
  amber: { header: 'from-amber-500 to-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-200', dot: 'bg-amber-500' },
  green: { header: 'from-green-500 to-green-600', bg: 'bg-green-50/50', border: 'border-green-200', dot: 'bg-green-500' },
}

function KanbanColumn({ title, count, color, records, onUpdate, onDelete, selectedIds, onToggleSelect, largeDisplay, actionLabel, actionIcon, onAction, actionColor }: {
  title: string
  count: number
  color: 'blue' | 'amber' | 'green'
  records: WaiterRecord[]
  onUpdate: (id: number, updates: Partial<WaiterRecord>) => void
  onDelete: (id: number) => void
  selectedIds: Set<number>
  onToggleSelect: (id: number) => void
  largeDisplay?: boolean
  actionLabel: string
  actionIcon: React.ReactNode
  onAction: (id: number) => void
  actionColor: string
}) {
  const c = colorConfig[color]

  return (
    <div className={cn('rounded-2xl border overflow-hidden flex flex-col', c.border, c.bg)}>
      {/* Column header */}
      <div className={cn('bg-gradient-to-r text-white flex items-center justify-between', c.header, largeDisplay ? 'px-5 py-4' : 'px-4 py-3')}>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-white/50" />
          <h3 className={cn('font-bold', largeDisplay ? 'text-xl' : 'text-base')}>{title}</h3>
        </div>
        <span className={cn('rounded-full bg-white/20 font-bold', largeDisplay ? 'text-lg px-3 py-1' : 'text-sm px-2.5 py-0.5')}>
          {count}
        </span>
      </div>

      {/* Cards */}
      <div className={cn('flex-1 overflow-y-auto min-h-[200px] max-h-[70vh]', largeDisplay ? 'p-4 space-y-4' : 'p-3 space-y-3')}>
        <AnimatePresence mode="popLayout">
          {records.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-32 text-gray-400"
            >
              <p className={cn('font-medium', largeDisplay ? 'text-lg' : 'text-sm')}>No orders</p>
            </motion.div>
          ) : (
            records.map(record => (
              <KanbanCard
                key={record.id}
                record={record}
                onUpdate={onUpdate}
                onDelete={onDelete}
                isSelected={selectedIds.has(record.id)}
                onToggleSelect={() => onToggleSelect(record.id)}
                largeDisplay={largeDisplay}
                actionLabel={actionLabel}
                actionIcon={actionIcon}
                onAction={() => onAction(record.id)}
                actionColor={actionColor}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

const KanbanCard = memo(function KanbanCard({
  record, onUpdate, onDelete, isSelected, onToggleSelect, largeDisplay, actionLabel, actionIcon, onAction, actionColor
}: {
  record: WaiterRecord
  onUpdate: (id: number, updates: Partial<WaiterRecord>) => void
  onDelete: (id: number) => void
  isSelected: boolean
  onToggleSelect: () => void
  largeDisplay?: boolean
  actionLabel: string
  actionIcon: React.ReactNode
  onAction: () => void
  actionColor: string
}) {
  const [countdown, setCountdown] = useState(formatTimeRemaining(record.due_time))
  const [timeInfo, setTimeInfo] = useState(getTimeRemaining(record.due_time))
  const [isEditingComments, setIsEditingComments] = useState(false)
  const [editedComments, setEditedComments] = useState(record.comments)
  const [showFullComment, setShowFullComment] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { setEditedComments(record.comments) }, [record.comments])

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(formatTimeRemaining(record.due_time))
      setTimeInfo(getTimeRemaining(record.due_time))
    }, 1000)
    return () => clearInterval(interval)
  }, [record.due_time])

  useEffect(() => {
    if (isEditingComments && textareaRef.current) textareaRef.current.focus()
  }, [isEditingComments])

  const handleSaveComments = () => {
    onUpdate(record.id, { comments: editedComments })
    setIsEditingComments(false)
  }

  const countdownColor = timeInfo.isOverdue || timeInfo.total < 300000 ? 'text-red-600' :
    timeInfo.total < 600000 ? 'text-orange-600' :
    timeInfo.total < 900000 ? 'text-yellow-600' : 'text-green-600'

  const isLongComment = record.comments && record.comments.length > 100
  const displayComment = (!showFullComment && isLongComment) ? record.comments.slice(0, 100) + '...' : record.comments

  const sz = largeDisplay ? {
    name: 'text-xl', info: 'text-base', countdown: 'text-xl', comment: 'text-base', btn: 'text-base px-4 py-2.5', icon: 'h-5 w-5', pad: 'p-4',
  } : {
    name: 'text-base', info: 'text-sm', countdown: 'text-base', comment: 'text-sm', btn: 'text-sm px-3 py-2', icon: 'h-4 w-4', pad: 'p-3',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={cn(
        'rounded-xl bg-white border border-gray-200 shadow-sm transition-all',
        isSelected && 'ring-2 ring-teal-400',
        (timeInfo.isOverdue || timeInfo.total < 300000) && 'border-red-300 shadow-red-100'
      )}
    >
      <div className={sz.pad}>
        {/* Name + type */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer flex-shrink-0"
            />
            <h4 className={cn('font-bold text-gray-900 truncate', sz.name)}>
              {record.first_name} {record.last_name}
            </h4>
            <OrderTypeBadge type={record.order_type} short className="flex-shrink-0" />
          </div>
          <button
            onClick={() => onDelete(record.id)}
            className="p-1 text-gray-300 hover:text-red-600 rounded transition-colors flex-shrink-0"
          >
            <Trash2 className={cn(largeDisplay ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
          </button>
        </div>

        {/* Info row */}
        <div className={cn('flex items-center gap-3 text-gray-500 mt-1.5', sz.info)}>
          <span className="flex items-center gap-1"><Pill className="h-3.5 w-3.5" /> <strong>{record.num_prescriptions}</strong></span>
          <span className="uppercase font-semibold">{record.initials}</span>
          <span className={cn('font-mono font-bold tabular-nums ml-auto', sz.countdown, countdownColor)}>{countdown}</span>
        </div>

        {/* Comments */}
        {isEditingComments ? (
          <div className="flex items-start gap-1.5 mt-2">
            <textarea
              ref={textareaRef}
              value={editedComments}
              onChange={e => setEditedComments(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveComments() }
                if (e.key === 'Escape') { setEditedComments(record.comments); setIsEditingComments(false) }
              }}
              className={cn('input-field flex-1 resize-none py-1.5', sz.comment)}
              rows={2}
              placeholder="Add a comment..."
            />
            <div className="flex flex-col gap-0.5">
              <button onClick={handleSaveComments} className="p-1 text-green-600 hover:bg-green-100 rounded"><Check className="h-3.5 w-3.5" /></button>
              <button onClick={() => { setEditedComments(record.comments); setIsEditingComments(false) }} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ) : record.comments ? (
          <div
            className="mt-2 flex items-start gap-1.5 cursor-pointer group rounded p-1 -m-1 hover:bg-gray-50 transition-colors"
            onClick={() => setIsEditingComments(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingComments(true) }}
          >
            <MessageSquare className="h-3.5 w-3.5 mt-0.5 text-teal-500 flex-shrink-0" />
            <div className="flex-1">
              <p className={cn('text-gray-600 leading-relaxed', sz.comment)}>{displayComment}</p>
              {isLongComment && (
                <button onClick={(e) => { e.stopPropagation(); setShowFullComment(!showFullComment) }} className="text-teal-600 text-xs font-medium mt-0.5">
                  {showFullComment ? 'Less' : 'More'}
                </button>
              )}
            </div>
            <Edit3 className="h-3 w-3 flex-shrink-0 text-gray-300 group-hover:text-teal-400 mt-0.5" />
          </div>
        ) : (
          <div
            className="mt-2 text-gray-400 italic cursor-pointer hover:text-teal-500 transition-colors text-sm"
            onClick={() => setIsEditingComments(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingComments(true) }}
          >
            + Add comment
          </div>
        )}

        {/* Action button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className={cn('w-full mt-3 inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors shadow-sm', sz.btn, actionColor)}
        >
          {actionIcon}
          {actionLabel}
          <ArrowRight className={cn(largeDisplay ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
        </motion.button>
      </div>
    </motion.div>
  )
})
