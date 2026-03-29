'use client'

import { memo } from 'react'
import { useCountdown } from '@/hooks/useCountdown'
import { cn } from '@/lib/utils'

interface TimeDisplayProps {
  dueTime: string
  showUrgencyBadge?: boolean
  showDueTime?: boolean
  className?: string
}

export const TimeDisplay = memo(function TimeDisplay({
  dueTime,
  showUrgencyBadge = false,
  showDueTime = false,
  className,
}: TimeDisplayProps) {
  const countdown = useCountdown(dueTime)

  const colorClass = countdown.urgencyColor === 'red'
    ? 'text-red-600'
    : countdown.urgencyColor === 'orange'
    ? 'text-orange-600'
    : countdown.urgencyColor === 'yellow'
    ? 'text-yellow-600'
    : 'text-green-600'

  return (
    <div className={cn('flex flex-col items-end gap-1', className)}>
      <div className="flex items-center gap-2">
        <span
          className={cn('font-mono text-sm font-medium tabular-nums', colorClass)}
          aria-label={`Time remaining: ${countdown.display}`}
        >
          {countdown.display}
        </span>
        {showUrgencyBadge && (
          <span
            className={cn('rounded px-1.5 py-0.5 text-xs font-medium', countdown.urgencyBgClass)}
            aria-label={countdown.urgencyLabel}
          >
            {countdown.urgencyLabel}
          </span>
        )}
      </div>
      {showDueTime && (
        <span className="text-xs text-gray-400">
          Due: {new Date(dueTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  )
})
