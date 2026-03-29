import { memo } from 'react'
import { cn } from '@/lib/utils'
import { OrderType } from '@/lib/types'

const config: Record<OrderType, { label: string; short: string; classes: string }> = {
  waiter: { label: 'WAITER', short: 'W', classes: 'bg-green-100 text-green-700' },
  acute: { label: 'ACUTE', short: 'A', classes: 'bg-blue-100 text-blue-700' },
  urgent_mail: { label: 'URGENT MAIL', short: 'U', classes: 'bg-purple-100 text-purple-700' },
  mail: { label: 'MAIL', short: 'M', classes: 'bg-orange-100 text-orange-700' },
}

interface Props {
  type: OrderType
  short?: boolean
  className?: string
}

export const OrderTypeBadge = memo(function OrderTypeBadge({ type, short = false, className }: Props) {
  const c = config[type] || config.waiter
  return (
    <span
      className={cn('rounded px-1.5 py-0.5 text-xs font-bold', c.classes, className)}
      aria-label={`Order type: ${c.label}`}
    >
      {short ? c.short : c.label}
    </span>
  )
})
