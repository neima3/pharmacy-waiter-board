'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
  borderColor?: string
  bgColor?: string
}

export const EmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  className,
  borderColor = 'border-gray-300',
  bgColor = 'bg-gray-50',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed',
        borderColor,
        bgColor,
        className
      )}
    >
      <Icon className="h-12 w-12 text-gray-400" />
      <p className="mt-4 text-lg font-medium text-gray-600">{title}</p>
      <p className="text-sm text-gray-400">{message}</p>
      {action && (
        <motion.button
          onClick={action.onClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  )
})
