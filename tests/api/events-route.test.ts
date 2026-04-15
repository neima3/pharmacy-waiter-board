import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'

import { getEventsResponse } from '../../app/api/events/route'
import type { WorkflowEventRow } from '../../lib/db'
import { buildWorkflowEventPayload } from '../../lib/workflow-events'
import type { WaiterRecord } from '../../lib/types'

function makeRecord(id: number, overrides: Partial<WaiterRecord> = {}): WaiterRecord {
  return {
    id,
    patient_id: overrides.patient_id ?? null,
    mrn: overrides.mrn ?? `MRN-${id}`,
    patient_name: overrides.patient_name ?? `Patient ${id}`,
    first_name: overrides.first_name ?? `First${id}`,
    last_name: overrides.last_name ?? `Last${id}`,
    dob: overrides.dob ?? '1990-01-01',
    num_prescriptions: overrides.num_prescriptions ?? 1,
    comments: overrides.comments ?? '',
    initials: overrides.initials ?? 'AB',
    order_type: overrides.order_type ?? 'waiter',
    due_time: overrides.due_time ?? '2026-04-15T12:00:00.000Z',
    created_at: overrides.created_at ?? '2026-04-15T11:00:00.000Z',
    active_location_id: overrides.active_location_id ?? 'main-pharmacy',
    active_location_name: overrides.active_location_name ?? 'Main Pharmacy',
    source_app: overrides.source_app ?? 'PharmacyWaiterBoard',
    source_record_id: overrides.source_record_id ?? 17,
    printed: overrides.printed ?? false,
    ready: overrides.ready ?? false,
    ready_at: overrides.ready_at ?? null,
    completed: overrides.completed ?? false,
    moved_to_mail: overrides.moved_to_mail ?? false,
    moved_to_mail_at: overrides.moved_to_mail_at ?? null,
    mailed: overrides.mailed ?? false,
    mailed_at: overrides.mailed_at ?? null,
  }
}

function buildWorkflowEventRow(overrides: Partial<WorkflowEventRow> = {}): WorkflowEventRow {
  const record = overrides.payload?.record ?? makeRecord(17, {
    ready: true,
    ready_at: '2026-04-15T11:16:00.000Z',
  })

  const payload = overrides.payload ?? buildWorkflowEventPayload({
    id: overrides.id ?? 19,
    type: 'advance',
    record,
    previousRecord: makeRecord(record.id, {
      ready: false,
      ready_at: null,
    }),
    occurredAt: '2026-04-15T11:17:00.000Z',
    actorInitials: 'NP',
  })

  return {
    id: overrides.id ?? 19,
    event_type: overrides.event_type ?? 'advance',
    event_key: overrides.event_key ?? 'advance:17',
    record_id: overrides.record_id ?? 17,
    payload,
    created_at: overrides.created_at ?? '2026-04-15T11:17:00.000Z',
  }
}

test('GET /api/events streams canonical SSE frames with stable headers', async () => {
  const abortController = new AbortController()
  const events = [buildWorkflowEventRow()]

  const response = await getEventsResponse(
    new NextRequest('http://localhost/api/events', {
      signal: abortController.signal,
    }),
    {
      initializeDatabase: async () => undefined,
      getLatestWorkflowEventId: async () => 18,
      getWorkflowEventsSince: async () => events,
      syncExpiredWorkflowEvents: async () => [],
    },
  )

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Content-Type'), 'text/event-stream; charset=utf-8')
  assert.equal(response.headers.get('Cache-Control'), 'no-cache, no-transform')
  assert.equal(response.headers.get('Connection'), 'keep-alive')
  assert.equal(response.headers.get('X-Accel-Buffering'), 'no')

  const reader = response.body?.getReader()
  assert.ok(reader, 'expected an SSE response body')

  const { value, done } = await reader.read()
  assert.equal(done, false)
  assert.ok(value)

  const chunk = new TextDecoder().decode(value)
  assert.match(chunk, /^id: 19$/m)
  assert.match(chunk, /^event: advance$/m)
  assert.match(chunk, /^data: /m)
  assert.match(chunk, /"workflowState":"ready"/)
  assert.match(chunk, /"actorInitials":"NP"/)

  abortController.abort()
  await reader.cancel().catch(() => undefined)
})
