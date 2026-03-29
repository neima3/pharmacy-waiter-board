import { OrderType } from './types'

export type UrgencyLevel = 'on-time' | 'due-soon' | 'overdue' | 'critical'

export function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDOB(dob: string): string {
  const date = new Date(dob)
  return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

export function getTimeRemaining(dueTime: string): { total: number; minutes: number; seconds: number; isOverdue: boolean } {
  const total = Date.parse(dueTime) - Date.now()
  const isOverdue = total < 0
  const absTotal = Math.abs(total)
  const minutes = Math.floor((absTotal % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((absTotal % (1000 * 60)) / 1000)

  return { total, minutes, seconds, isOverdue }
}

export function formatTimeRemaining(dueTime: string): string {
  const { total, minutes, seconds, isOverdue } = getTimeRemaining(dueTime)
  if (isOverdue) {
    return `Overdue by ${minutes}m`
  }
  if (total < 60000) {
    return `${seconds}s`
  }
  return `${minutes}m ${seconds}s`
}

export function getElapsedMinutes(createdAt: string): number {
  return Math.floor((Date.now() - Date.parse(createdAt)) / 60000)
}

export function calculateDueTime(orderType: OrderType): string {
  const now = new Date()
  const minutes = orderType === 'waiter' ? 30 : 60
  now.setMinutes(now.getMinutes() + minutes)
  return now.toISOString()
}

export function getUrgency(dueTime: string): { level: UrgencyLevel; color: string; label: string; bgClass: string } {
  const remaining = Date.parse(dueTime) - Date.now()
  if (remaining < 0) return { level: 'critical', color: 'red', label: 'Overdue', bgClass: 'bg-red-100 text-red-700' }
  if (remaining < 300000) return { level: 'critical', color: 'red', label: 'Critical', bgClass: 'bg-red-100 text-red-700' }
  if (remaining < 600000) return { level: 'overdue', color: 'orange', label: 'Due Soon', bgClass: 'bg-orange-100 text-orange-700' }
  if (remaining < 900000) return { level: 'due-soon', color: 'yellow', label: 'Due Soon', bgClass: 'bg-yellow-100 text-yellow-700' }
  return { level: 'on-time', color: 'green', label: 'On Time', bgClass: 'bg-green-100 text-green-700' }
}

export function getProgressPercentage(dueTime: string, orderType: string): number {
  const totalTime = orderType === 'waiter' ? 30 * 60 * 1000 : 60 * 60 * 1000
  const remaining = Date.parse(dueTime) - Date.now()
  const elapsed = totalTime - remaining
  return Math.min(100, Math.max(0, (elapsed / totalTime) * 100))
}

export function getProgressColor(dueTime: string): string {
  const remaining = Date.parse(dueTime) - Date.now()
  if (remaining < 0 || remaining < 300000) return 'bg-red-500'
  if (remaining < 600000) return 'bg-orange-500'
  if (remaining < 900000) return 'bg-yellow-500'
  return 'bg-green-500'
}
