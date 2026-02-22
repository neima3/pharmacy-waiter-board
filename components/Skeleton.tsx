'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1 }}
      className={cn('rounded-lg bg-gray-200', className)}
    />
  )
}

export function RecordCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 border-gray-200 bg-white p-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-6 w-16 ml-auto" />
          <Skeleton className="h-3 w-20 ml-auto" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t pt-4">
        <div className="flex gap-4">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </motion.div>
  )
}

export function PatientCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500/50 to-teal-600/50 p-8 shadow-2xl"
    >
      <Skeleton className="mb-4 h-12 w-12 rounded-full bg-white/20" />
      <Skeleton className="mb-4 h-10 w-36 bg-white/20" />
      <Skeleton className="mb-6 h-6 w-28 bg-white/20" />
      <Skeleton className="h-20 w-full rounded-xl bg-white/20" />
    </motion.div>
  )
}

export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  )
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

export function SettingsCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <Skeleton className="mb-4 h-6 w-32" />
      <div className="space-y-4">
        <FormFieldSkeleton />
        <FormFieldSkeleton />
        <FormFieldSkeleton />
      </div>
    </div>
  )
}
