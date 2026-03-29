'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Printer, CheckCircle } from 'lucide-react'

interface BulkActionsProps {
  selectedCount: number
  onBulkPrint: () => void
  onBulkReady: () => void
}

export const BulkActions = memo(function BulkActions({ selectedCount, onBulkPrint, onBulkReady }: BulkActionsProps) {
  if (selectedCount === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -20, height: 0 }}
      className="flex items-center justify-between rounded-lg bg-teal-50 border border-teal-200 px-4 py-3"
      role="toolbar"
      aria-label="Bulk actions"
    >
      <span className="text-sm font-medium text-teal-800">
        {selectedCount} record(s) selected
      </span>
      <div className="flex gap-2">
        <button
          onClick={onBulkPrint}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          aria-label={`Mark ${selectedCount} selected records as printed`}
        >
          <Printer className="h-4 w-4" />
          Mark Printed
        </button>
        <button
          onClick={onBulkReady}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
          aria-label={`Mark ${selectedCount} selected records as ready`}
        >
          <CheckCircle className="h-4 w-4" />
          Mark Ready
        </button>
      </div>
    </motion.div>
  )
})
