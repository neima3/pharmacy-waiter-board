import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskName(firstName: string, lastName: string): string {
  let maskedFirst: string
  if (firstName.length <= 2) {
    maskedFirst = firstName
  } else {
    maskedFirst = firstName.substring(0, 2) + '***'
  }

  let maskedLast: string
  if (lastName.length <= 3) {
    maskedLast = lastName.substring(0, 2) + '*'
  } else {
    maskedLast = lastName.substring(0, 3) + '***'
  }

  return `${maskedFirst} ${maskedLast}`
}

export function getOrderTypeLabel(orderType: string): string {
  switch (orderType) {
    case 'waiter':
      return 'WAITER'
    case 'acute':
      return 'ACUTE'
    case 'urgent_mail':
      return 'URGENT MAIL'
    case 'mail':
      return 'MAIL'
    default:
      return orderType.toUpperCase()
  }
}

export function parseFlexibleDate(input: string): string | null {
  if (!input) return null
  const cleaned = input.trim().replace(/\s+/g, '')

  if (/^\d{6}$/.test(cleaned)) {
    const mm = cleaned.slice(0, 2)
    const dd = cleaned.slice(2, 4)
    const yy = cleaned.slice(4, 6)
    const year = parseInt(yy) > 50 ? `19${yy}` : `20${yy}`
    return `${year}-${mm}-${dd}`
  }
  if (/^\d{8}$/.test(cleaned)) {
    const mm = cleaned.slice(0, 2)
    const dd = cleaned.slice(2, 4)
    const yyyy = cleaned.slice(4, 8)
    return `${yyyy}-${mm}-${dd}`
  }

  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (slashMatch) {
    const [, m, d, y] = slashMatch
    const mm = m.padStart(2, '0')
    const dd = d.padStart(2, '0')
    const year = y.length === 2 ? (parseInt(y) > 50 ? `19${y}` : `20${y}`) : y
    return `${year}-${mm}-${dd}`
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned
  }

  return null
}

// Re-exports from time.ts for backward compatibility
export { getTimeRemaining, formatTimeRemaining, getElapsedMinutes, formatTime, formatDateTime, formatDOB, calculateDueTime, getUrgency, getProgressPercentage, getProgressColor } from './time'
export type { UrgencyLevel } from './time'
