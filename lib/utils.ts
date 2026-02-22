import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { OrderType } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskName(firstName: string, lastName: string): string {
  const maskedFirst = firstName.length > 2 
    ? firstName.substring(0, 2) + '*'.repeat(firstName.length - 2)
    : firstName
  const maskedLast = lastName.length > 3 
    ? lastName.substring(0, 3) + '*'.repeat(lastName.length - 3)
    : lastName
  return `${maskedFirst} ${maskedLast}`
}

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

export function getOrderTypeLabel(orderType: string): string {
  switch (orderType) {
    case 'waiter':
      return 'WAITER'
    case 'acute':
      return 'ACUTE'
    case 'urgent_mail':
      return 'URGENT MAIL'
    default:
      return orderType.toUpperCase()
  }
}
