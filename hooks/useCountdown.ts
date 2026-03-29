'use client'

import { useState, useEffect } from 'react'
import { getTimeRemaining, formatTimeRemaining, getUrgency, type UrgencyLevel } from '@/lib/time'

interface CountdownResult {
  display: string
  remaining: number
  minutes: number
  seconds: number
  isOverdue: boolean
  urgency: UrgencyLevel
  urgencyLabel: string
  urgencyColor: string
  urgencyBgClass: string
}

function compute(dueTime: string): CountdownResult {
  const time = getTimeRemaining(dueTime)
  const urgency = getUrgency(dueTime)
  return {
    display: formatTimeRemaining(dueTime),
    remaining: time.total,
    minutes: time.minutes,
    seconds: time.seconds,
    isOverdue: time.isOverdue,
    urgency: urgency.level,
    urgencyLabel: urgency.label,
    urgencyColor: urgency.color,
    urgencyBgClass: urgency.bgClass,
  }
}

export function useCountdown(dueTime: string): CountdownResult {
  const [result, setResult] = useState<CountdownResult>(() => compute(dueTime))

  useEffect(() => {
    const interval = setInterval(() => setResult(compute(dueTime)), 1000)
    return () => clearInterval(interval)
  }, [dueTime])

  return result
}
