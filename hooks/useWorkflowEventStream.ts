'use client'

import { useEffect, useRef } from 'react'
import { type WorkflowEventPayload, type WorkflowEventType } from '@/lib/workflow-events'

const CANONICAL_EVENT_TYPES: WorkflowEventType[] = ['create', 'update', 'advance', 'archive', 'expiration']

export function useWorkflowEventStream(
  onEvent: (event: WorkflowEventPayload) => void,
  enabled = true,
) {
  const onEventRef = useRef(onEvent)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || typeof EventSource === 'undefined') return

    const source = new EventSource('/api/events')

    const handleEvent = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as WorkflowEventPayload
        if (payload && CANONICAL_EVENT_TYPES.includes(payload.type)) {
          onEventRef.current(payload)
        }
      } catch {
        // Ignore malformed payloads and let the stream recover on the next event.
      }
    }

    for (const type of CANONICAL_EVENT_TYPES) {
      source.addEventListener(type, handleEvent as EventListener)
    }

    return () => {
      for (const type of CANONICAL_EVENT_TYPES) {
        source.removeEventListener(type, handleEvent as EventListener)
      }
      source.close()
    }
  }, [enabled])
}
