'use client'

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { WaiterRecord } from '@/lib/types'
import { cn, formatTime } from '@/lib/utils'
import { OrderTypeBadge } from '@/components/OrderTypeBadge'
import { EmptyState } from '@/components/EmptyState'

interface CompletedTabProps {
  records: WaiterRecord[]
  onMarkComplete: (id: number) => void
}

export const CompletedTab = memo(function CompletedTab({ records, onMarkComplete }: CompletedTabProps) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle}
        title="No Pickup Complete Orders"
        message="Orders finished at pickup will appear here"
        borderColor="border-green-300"
        bgColor="bg-green-50"
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-green-200 bg-green-50/30">
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-2 border-b border-green-200 bg-green-100/50 px-3 py-2 text-xs font-medium text-green-700 uppercase tracking-wide">
        <div className="w-8">Type</div>
        <div>Patient Name</div>
        <div className="w-12 text-center"># Rx</div>
        <div className="w-24 text-center">Ready At</div>
        <div className="w-12 text-center">Init</div>
        <div className="w-48">Comments</div>
        <div className="w-28 text-center">Action</div>
      </div>

      <AnimatePresence mode="popLayout">
        {records.map((record) => (
          <CompletedRecordRow key={record.id} record={record} onMarkComplete={onMarkComplete} />
        ))}
      </AnimatePresence>
    </div>
  )
})

const CompletedRecordRow = memo(function CompletedRecordRow({ record, onMarkComplete }: {
  record: WaiterRecord
  onMarkComplete: (id: number) => void
}) {
  const getTypeColor = () => {
    switch (record.order_type) {
      case 'waiter': return 'bg-green-500'
      case 'acute': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-2 border-b border-green-100 px-3 py-3 items-center hover:bg-green-100/50 transition-colors"
    >
      <div className="flex items-center gap-2 w-8">
        <div className={cn('w-1 h-10 rounded-full', getTypeColor())} />
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

      <div className="w-24 text-center text-sm text-gray-600">
        {record.ready_at ? formatTime(record.ready_at) : '-'}
      </div>

      <div className="w-12 text-center font-medium text-gray-700 uppercase text-base">
        {record.initials}
      </div>

      <div className="w-48 text-base text-gray-600 truncate">
        {record.comments || '-'}
      </div>

      <div className="w-28 text-center">
        <motion.button
          onClick={() => onMarkComplete(record.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          aria-label={`Complete order for ${record.first_name} ${record.last_name}`}
        >
          <CheckCircle className="h-4 w-4" />
          Complete
        </motion.button>
      </div>
    </motion.div>
  )
})
