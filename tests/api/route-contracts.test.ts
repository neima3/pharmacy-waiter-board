import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'

import { getOperationsReportResponse } from '../../lib/reporting-operations-route'
import { postIntakeResponse } from '../../app/api/intake/route'
import { putRecordResponse } from '../../app/api/records/[id]/route'
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

function makeNextRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

test('GET /api/reports/operations keeps the report snapshot contract stable', async () => {
  const response = await getOperationsReportResponse(
    {
      initializeDatabase: async () => undefined,
      syncExpiredWorkflowEvents: async () => [],
      getAllRecords: async () => [
        makeRecord(1, {
          ready: true,
          ready_at: '2026-04-15T11:15:00.000Z',
        }),
        makeRecord(2, {
          completed: true,
          ready: true,
          ready_at: '2026-04-15T11:25:00.000Z',
        }),
        makeRecord(3, {
          order_type: 'mail',
          moved_to_mail: true,
          moved_to_mail_at: '2026-04-15T11:40:00.000Z',
        }),
        makeRecord(4, {
          mailed: true,
          mailed_at: '2026-04-15T11:55:00.000Z',
        }),
      ],
    },
    new Date('2026-04-15T12:00:00.000Z'),
  )

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Cache-Control'), 'no-store, no-cache, must-revalidate')

  const payload = await response.json() as {
    generated_at: string
    total_records: number
    ready_to_pickup_latency_minutes: number | null
    mail_conversion: { eligible_records: number; mailed_records: number; rate: number | null }
  }

  assert.equal(payload.total_records, 4)
  assert.equal(payload.ready_to_pickup_latency_minutes, 45)
  assert.deepEqual(payload.mail_conversion, {
    eligible_records: 1,
    mailed_records: 0,
    rate: 0,
  })
})

test('POST /api/intake replays a completed idempotency key without creating a duplicate record', async () => {
  const createdRecords: WaiterRecord[] = []
  const completedEvents: Array<{ id: number; result: unknown }> = []

  const repo = {
    initializeDatabase: async () => undefined,
    getExternalIntakeEvent: async (_sourceApp: string, idempotencyKey: string) => {
      if (idempotencyKey === 'evt-1' && createdRecords.length > 0) {
        return {
          id: 10,
          source_app: 'PharmCall',
          idempotency_key: 'evt-1',
          source_record_id: 88,
          source_event_type: 'create' as const,
          status: 'completed' as const,
          record_id: 21,
          response_status: 201,
          request_payload: '{}',
          response_payload: JSON.stringify({
            ...createdRecords[0],
            queue_enrichment: {
              medication_summary: { count: 2, display: '2 Rx' },
              promised_time: { iso: '2026-04-15T12:15:00.000Z', relative: 'Due in 15m', minutes_remaining: 15 },
              delivery_mode: { code: 'waiter', label: 'Patient pickup' },
              priority_breakdown: { order_type: 'waiter', workflow_state: 'ready', tier: 'due-soon', is_overdue: false, due_in_minutes: 15 },
              communication_state: { workflow_state: 'ready', label: 'Ready for pickup', flags: { printed: false, ready: true, completed: false, moved_to_mail: false, mailed: false } },
            },
          }),
          error_message: null,
          created_at: '2026-04-15T11:01:00.000Z',
          completed_at: '2026-04-15T11:02:00.000Z',
        }
      }
      return null
    },
    claimExternalIntakeEvent: async () => ({
      id: 11,
      source_app: 'PharmCall',
      idempotency_key: 'evt-1',
      source_record_id: 88,
      source_event_type: 'create' as const,
      status: 'processing' as const,
      record_id: null,
      response_status: null,
      request_payload: '{}',
      response_payload: null,
      error_message: null,
      created_at: '2026-04-15T11:03:00.000Z',
      completed_at: null,
    }),
    completeExternalIntakeEvent: async (id: number, result: unknown) => {
      completedEvents.push({ id, result })
    },
    failExternalIntakeEvent: async () => {
      throw new Error('should not fail a successful intake')
    },
    getRecordBySourceIdentity: async () => null,
    createRecord: async () => {
      const record = makeRecord(21, {
        source_app: 'PharmCall',
        source_record_id: 88,
        ready: true,
        ready_at: '2026-04-15T11:50:00.000Z',
      })
      createdRecords.push(record)
      return record
    },
    updateRecord: async () => {
      throw new Error('should not update a new intake record')
    },
  }

  const firstResponse = await postIntakeResponse(
    makeNextRequest('/api/intake', {
      idempotency_key: 'evt-1',
      event_type: 'create',
      source_app: 'PharmCall',
      source_record_id: 88,
      mrn: 'MRN-10088',
      patient_name: 'Nina Patel',
      first_name: 'Nina',
      last_name: 'Patel',
      dob: '1994-01-02',
      num_prescriptions: 2,
      comments: 'Call when ready',
      initials: 'NP',
      order_type: 'waiter',
    }),
    repo,
  )

  assert.equal(firstResponse.status, 201)
  const firstPayload = await firstResponse.json() as { id: number; queue_enrichment: { communication_state: { workflow_state: string } } }
  assert.equal(firstPayload.id, 21)
  assert.equal(firstPayload.queue_enrichment.communication_state.workflow_state, 'ready')
  assert.equal(completedEvents.length, 1)

  const replayResponse = await postIntakeResponse(
    makeNextRequest('/api/intake', {
      idempotency_key: 'evt-1',
      event_type: 'create',
      source_app: 'PharmCall',
      source_record_id: 88,
      mrn: 'MRN-10088',
      patient_name: 'Nina Patel',
      first_name: 'Nina',
      last_name: 'Patel',
      dob: '1994-01-02',
      num_prescriptions: 2,
      comments: 'Call when ready',
      initials: 'NP',
      order_type: 'waiter',
    }),
    repo,
  )

  assert.equal(replayResponse.status, 201)
  const replayPayload = await replayResponse.json() as { id: number }
  assert.equal(replayPayload.id, 21)
  assert.equal(createdRecords.length, 1)
  assert.equal(completedEvents.length, 1)
})

test('PUT /api/records/[id] applies ready, pickup, and mail workflow transitions through the public contract', async () => {
  const updates: Array<Record<string, unknown>> = []

  const record = makeRecord(31, {
    printed: false,
    ready: false,
    completed: false,
    moved_to_mail: false,
    mailed: false,
  })

  const deps = {
    initializeDatabase: async () => undefined,
    getRecord: async () => record,
    updateRecord: async (_id: number, patch: Record<string, unknown>, _initials?: string, _action?: string) => {
      updates.push(patch)
      const nextRecord = {
        ...record,
        ...patch,
      } as WaiterRecord
      return nextRecord
    },
    deleteRecord: async () => true,
  }

  const cases: Array<{
    workflow_state: 'ready' | 'pickup_complete' | 'moved_to_mail' | 'mailed'
    expected: Partial<Record<keyof WaiterRecord, boolean>>
    label: string
  }> = [
    {
      workflow_state: 'ready',
      expected: { ready: true },
      label: 'Ready for pickup',
    },
    {
      workflow_state: 'pickup_complete',
      expected: { completed: true },
      label: 'Pickup complete',
    },
    {
      workflow_state: 'moved_to_mail',
      expected: { moved_to_mail: true, completed: false, mailed: false },
      label: 'Moved to mail',
    },
    {
      workflow_state: 'mailed',
      expected: { mailed: true, completed: false },
      label: 'Mailed',
    },
  ]

  for (const testCase of cases) {
    const response = await putRecordResponse(
      new NextRequest('http://localhost/api/records/31', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_state: testCase.workflow_state }),
      }),
      { params: Promise.resolve({ id: '31' }) },
      deps,
    )

    assert.equal(response.status, 200)
    const payload = await response.json() as {
      queue_enrichment: { communication_state: { workflow_state: string; label: string } }
    }

    assert.equal(payload.queue_enrichment.communication_state.workflow_state, testCase.workflow_state)
    assert.equal(payload.queue_enrichment.communication_state.label, testCase.label)
    assert.equal(updates.at(-1)?.ready ?? false, testCase.expected.ready ?? false)
    assert.equal(updates.at(-1)?.completed ?? false, testCase.expected.completed ?? false)
    assert.equal(updates.at(-1)?.moved_to_mail ?? false, testCase.expected.moved_to_mail ?? false)
    assert.equal(updates.at(-1)?.mailed ?? false, testCase.expected.mailed ?? false)
  }
})
