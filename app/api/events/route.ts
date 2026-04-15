import { NextRequest } from 'next/server'
import { getLatestWorkflowEventId, getWorkflowEventsSince, initializeDatabase, syncExpiredWorkflowEvents } from '@/lib/db'
import { formatWorkflowEventFrame, type WorkflowEventType } from '@/lib/workflow-events'

export const dynamic = 'force-dynamic'

const EVENT_POLL_INTERVAL_MS = 1000
const HEARTBEAT_INTERVAL_MS = 15000
const CANONICAL_EVENT_TYPES: WorkflowEventType[] = ['create', 'update', 'advance', 'archive', 'expiration']

export interface EventsRouteDependencies {
  initializeDatabase: typeof initializeDatabase
  getLatestWorkflowEventId: typeof getLatestWorkflowEventId
  getWorkflowEventsSince: typeof getWorkflowEventsSince
  syncExpiredWorkflowEvents: typeof syncExpiredWorkflowEvents
}

export const eventsRouteDependencies: EventsRouteDependencies = {
  initializeDatabase,
  getLatestWorkflowEventId,
  getWorkflowEventsSince,
  syncExpiredWorkflowEvents,
}

function parseCursor(value: string | null): number {
  if (!value) return 0
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0
}

export async function getEventsResponse(
  request: NextRequest,
  deps: EventsRouteDependencies = eventsRouteDependencies,
) {
  await deps.initializeDatabase()

  const encoder = new TextEncoder()
  const requestedCursor = request.headers.get('last-event-id') ?? request.nextUrl.searchParams.get('cursor')
  let cursor = requestedCursor ? parseCursor(requestedCursor) : await deps.getLatestWorkflowEventId()
  let closed = false
  let inFlight = false
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    start(controller) {
      const push = (chunk: string) => controller.enqueue(encoder.encode(chunk))

      const flushEvents = async () => {
        if (closed || inFlight) return
        inFlight = true
        try {
          await deps.syncExpiredWorkflowEvents()
          const events = await deps.getWorkflowEventsSince(cursor)
          for (const event of events) {
            if (!CANONICAL_EVENT_TYPES.includes(event.payload.type)) continue
            cursor = event.id
            push(formatWorkflowEventFrame(event.payload))
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown SSE error'
          push(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`)
        } finally {
          inFlight = false
        }
      }

      void flushEvents()

      heartbeatTimer = setInterval(() => {
        if (!closed) {
          push(`: heartbeat ${new Date().toISOString()}\n\n`)
        }
      }, HEARTBEAT_INTERVAL_MS)

      pollTimer = setInterval(() => {
        void flushEvents()
      }, EVENT_POLL_INTERVAL_MS)

      request.signal.addEventListener('abort', () => {
        closed = true
        if (heartbeatTimer) clearInterval(heartbeatTimer)
        if (pollTimer) clearInterval(pollTimer)
        controller.close()
      })
    },
    cancel() {
      closed = true
      if (heartbeatTimer) clearInterval(heartbeatTimer)
      if (pollTimer) clearInterval(pollTimer)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

export async function GET(request: NextRequest) {
  return getEventsResponse(request)
}
