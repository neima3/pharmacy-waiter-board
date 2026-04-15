import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildOperationsReportSnapshot,
  isOperationsRecordLike,
  isOperationsReportSnapshot,
} from '../../lib/reporting-operations'
import { getOperationsReportResponse } from '../../lib/reporting-operations-route'
import type { WaiterRecord } from '../../lib/types'

function makeRecord(id: number, overrides: Partial<WaiterRecord> & { no_show?: boolean | number | string | null } = {}): WaiterRecord & { no_show?: boolean | number | string | null } {
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
    source_record_id: overrides.source_record_id ?? null,
    printed: overrides.printed ?? false,
    ready: overrides.ready ?? false,
    ready_at: overrides.ready_at ?? null,
    completed: overrides.completed ?? false,
    moved_to_mail: overrides.moved_to_mail ?? false,
    moved_to_mail_at: overrides.moved_to_mail_at ?? null,
    mailed: overrides.mailed ?? false,
    mailed_at: overrides.mailed_at ?? null,
    no_show: overrides.no_show ?? null,
  }
}

test('isOperationsRecordLike accepts objects with the queue fields used by the report', () => {
  assert.equal(
    isOperationsRecordLike({
      id: 1,
      mrn: 'MRN-1',
      patient_name: 'Patient 1',
      first_name: 'First',
      last_name: 'Last',
      order_type: 'waiter',
      due_time: '2026-04-15T12:00:00.000Z',
      created_at: '2026-04-15T11:00:00.000Z',
      ready: false,
      completed: false,
      moved_to_mail: false,
      mailed: false,
    }),
    true,
  )
  assert.equal(isOperationsRecordLike(null), false)
  assert.equal(isOperationsRecordLike({ id: 'bad' }), false)
})

test('buildOperationsReportSnapshot calculates the queue operations KPIs from persisted records', () => {
  const snapshot = buildOperationsReportSnapshot(
    [
      makeRecord(1, {
        due_time: '2026-04-15T11:45:00.000Z',
        created_at: '2026-04-15T11:00:00.000Z',
        ready: true,
        ready_at: '2026-04-15T11:15:00.000Z',
      }),
      makeRecord(2, {
        due_time: '2026-04-15T12:10:00.000Z',
        created_at: '2026-04-15T11:10:00.000Z',
        ready: true,
        ready_at: '2026-04-15T11:30:00.000Z',
        no_show: true,
      }),
      makeRecord(3, {
        order_type: 'urgent_mail',
        due_time: '2026-04-15T11:25:00.000Z',
        created_at: '2026-04-15T10:50:00.000Z',
        printed: true,
        moved_to_mail: true,
        moved_to_mail_at: '2026-04-15T11:40:00.000Z',
      }),
      makeRecord(4, {
        order_type: 'mail',
        due_time: '2026-04-15T11:00:00.000Z',
        created_at: '2026-04-15T10:40:00.000Z',
        mailed: true,
        mailed_at: '2026-04-15T11:55:00.000Z',
      }),
      makeRecord(5, {
        due_time: '2026-04-15T12:30:00.000Z',
        created_at: '2026-04-15T11:30:00.000Z',
      }),
    ],
    new Date('2026-04-15T12:00:00.000Z'),
  )

  assert.equal(snapshot.generated_at, '2026-04-15T12:00:00.000Z')
  assert.equal(snapshot.total_records, 5)
  assert.equal(snapshot.average_wait_minutes, 17.5)
  assert.equal(snapshot.ready_to_pickup_latency_minutes, 37.5)
  assert.deepEqual(snapshot.mail_conversion, {
    eligible_records: 2,
    mailed_records: 1,
    rate: 50,
  })
  assert.equal(snapshot.overdue_queue_count, 2)
  assert.equal(snapshot.no_show_count, 1)
})

test('getOperationsReportResponse returns the route contract with cache-control disabled', async () => {
  const response = await getOperationsReportResponse(
    {
      initializeDatabase: async () => undefined,
      syncExpiredWorkflowEvents: async () => [],
      getAllRecords: async () => [
        makeRecord(1, {
          due_time: '2026-04-15T11:45:00.000Z',
          created_at: '2026-04-15T11:00:00.000Z',
          ready: true,
          ready_at: '2026-04-15T11:15:00.000Z',
        }),
      ],
    },
    new Date('2026-04-15T12:00:00.000Z'),
  )

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Cache-Control'), 'no-store, no-cache, must-revalidate')

  const payload = await response.json() as unknown
  assert.equal(isOperationsReportSnapshot(payload), true)
  assert.equal((payload as { total_records: number }).total_records, 1)
  assert.equal((payload as { overdue_queue_count: number }).overdue_queue_count, 1)
})
