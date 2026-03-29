'use client'

import { useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Send, ChevronDown, ChevronUp, Trash2, CheckCircle } from 'lucide-react'
import { WaiterRecord } from '@/lib/types'
import { cn, formatTime, formatDOB } from '@/lib/utils'
import { OrderTypeBadge } from '@/components/OrderTypeBadge'

interface MailWorkflowProps {
  mailQueue: WaiterRecord[]
  completedMail: WaiterRecord[]
  mailHistory: WaiterRecord[]
  onUpdate: (id: number, updates: Partial<WaiterRecord>) => void
  onDelete: (id: number) => void
  stats: { mailQueue: number; completedMail: number; mailHistory: number }
}

export const MailWorkflow = memo(function MailWorkflow({
  mailQueue,
  completedMail,
  mailHistory,
  onUpdate,
  onDelete,
  stats,
}: MailWorkflowProps) {
  const [showMailHistory, setShowMailHistory] = useState(false)

  return (
    <>
      {mailQueue.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Mail Queue</h3>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {stats.mailQueue}
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-blue-200 bg-blue-50/50">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 border-b border-blue-200 bg-blue-100/50 px-4 py-2 text-xs font-medium text-blue-700 uppercase tracking-wide">
              <div>Patient Name</div>
              <div className="w-28">DOB</div>
              <div className="w-48">Comments</div>
              <div className="w-24 text-center">Time</div>
              <div className="w-32 text-center">Action</div>
            </div>
            <AnimatePresence mode="popLayout">
              {mailQueue.map((record) => (
                <MailQueueRow key={record.id} record={record} onUpdate={onUpdate} onDelete={onDelete} />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {completedMail.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Send className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Completed Mail</h3>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {stats.completedMail}
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-green-200 bg-green-50/50">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 border-b border-green-200 bg-green-100/50 px-4 py-2 text-xs font-medium text-green-700 uppercase tracking-wide">
              <div>Patient Name</div>
              <div className="w-28">DOB</div>
              <div className="w-48">Comments</div>
              <div className="w-24 text-center">Ready At</div>
              <div className="w-32 text-center">Action</div>
            </div>
            <AnimatePresence mode="popLayout">
              {completedMail.map((record) => (
                <CompletedMailRow key={record.id} record={record} onUpdate={onUpdate} onDelete={onDelete} />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {mailHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <button
            onClick={() => setShowMailHistory(!showMailHistory)}
            className="flex items-center gap-2 mb-3 text-gray-600 hover:text-gray-900 transition-colors"
            aria-expanded={showMailHistory}
            aria-label="Toggle mail history"
          >
            {showMailHistory ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            <h3 className="text-lg font-semibold">Mail History</h3>
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
              {stats.mailHistory}
            </span>
          </button>
          {showMailHistory && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 border-b border-gray-200 bg-gray-100/50 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <div>Patient Name</div>
                <div className="w-28">Order Type</div>
                <div className="w-28 text-center">Time Entered</div>
                <div className="w-28 text-center">Time Mailed</div>
              </div>
              <AnimatePresence mode="popLayout">
                {mailHistory.map((record) => (
                  <MailHistoryRow key={record.id} record={record} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}
    </>
  )
})

const MailQueueRow = memo(function MailQueueRow({ record, onUpdate, onDelete }: {
  record: WaiterRecord
  onUpdate: (id: number, updates: Partial<WaiterRecord>) => void
  onDelete: (id: number) => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 border-b border-blue-100 px-4 py-3 items-center hover:bg-blue-100/50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900 text-lg">
          {record.first_name} {record.last_name}
        </span>
        <OrderTypeBadge type="mail" short />
      </div>
      <div className="w-28 text-base text-gray-600">
        {record.dob ? formatDOB(record.dob) : '-'}
      </div>
      <div className="w-48 text-base text-gray-600 truncate">
        {record.comments || '-'}
      </div>
      <div className="w-24 text-center text-sm text-gray-500">
        {formatTime(record.created_at)}
      </div>
      <div className="w-32 flex items-center justify-center gap-2">
        <motion.button
          onClick={() => onUpdate(record.id, { moved_to_mail: true })}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          aria-label={`Mark ${record.first_name} ${record.last_name} as moved to mail`}
        >
          <Send className="h-4 w-4" />
          Moved
        </motion.button>
        <button
          onClick={() => onDelete(record.id)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          aria-label={`Delete ${record.first_name} ${record.last_name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
})

const CompletedMailRow = memo(function CompletedMailRow({ record, onUpdate, onDelete }: {
  record: WaiterRecord
  onUpdate: (id: number, updates: Partial<WaiterRecord>) => void
  onDelete: (id: number) => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 border-b border-green-100 px-4 py-3 items-center hover:bg-green-100/50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900 text-lg">
          {record.first_name} {record.last_name}
        </span>
        <OrderTypeBadge type={record.order_type} short />
      </div>
      <div className="w-28 text-base text-gray-600">
        {record.dob ? formatDOB(record.dob) : '-'}
      </div>
      <div className="w-48 text-base text-gray-600 truncate">
        {record.comments || '-'}
      </div>
      <div className="w-24 text-center text-sm text-gray-500">
        {formatTime(record.moved_to_mail_at || record.ready_at || record.created_at)}
      </div>
      <div className="w-32 flex items-center justify-center gap-2">
        <motion.button
          onClick={() => onUpdate(record.id, { mailed: true })}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          aria-label={`Mark ${record.first_name} ${record.last_name} as mailed`}
        >
          <CheckCircle className="h-4 w-4" />
          Mailed
        </motion.button>
        <button
          onClick={() => onDelete(record.id)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          aria-label={`Delete ${record.first_name} ${record.last_name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
})

const MailHistoryRow = memo(function MailHistoryRow({ record }: { record: WaiterRecord }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="grid grid-cols-[1fr_auto_auto_auto] gap-2 border-b border-gray-100 px-4 py-2 items-center text-gray-500"
    >
      <div className="font-medium text-gray-600">
        {record.first_name} {record.last_name}
      </div>
      <div className="w-28 text-sm">
        <OrderTypeBadge type={record.order_type} />
      </div>
      <div className="w-28 text-center text-sm">
        {formatTime(record.created_at)}
      </div>
      <div className="w-28 text-center text-sm">
        {record.mailed_at ? formatTime(record.mailed_at) : '-'}
      </div>
    </motion.div>
  )
})
