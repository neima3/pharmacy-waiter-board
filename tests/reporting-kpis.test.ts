import test from 'node:test'
import assert from 'node:assert/strict'

import { buildKpiSnapshot } from '../lib/reporting-kpis'
import type { WaiterRecord } from '../lib/types'

function makeRecord(id: number, overrides: Partial<WaiterRecord>): WaiterRecord {
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
  }
}

test('builds an operational KPI snapshot from waiter records', () => {
  const snapshot = buildKpiSnapshot(
    [
      makeRecord(1, {
        order_type: 'waiter',
        due_time: '2026-04-15T12:15:00.000Z',
        created_at: '2026-04-15T11:00:00.000Z',
      }),
      makeRecord(2, {
        order_type: 'acute',
        printed: true,
        due_time: '2026-04-15T11:20:00.000Z',
        created_at: '2026-04-15T10:00:00.000Z',
      }),
      makeRecord(3, {
        order_type: 'waiter',
        printed: true,
        ready: true,
        ready_at: '2026-04-15T11:30:00.000Z',
        due_time: '2026-04-15T11:40:00.000Z',
        created_at: '2026-04-15T11:00:00.000Z',
      }),
      makeRecord(4, {
        order_type: 'waiter',
        printed: true,
        ready: true,
        ready_at: '2026-04-15T11:45:00.000Z',
        due_time: '2026-04-15T11:50:00.000Z',
        created_at: '2026-04-15T11:25:00.000Z',
      }),
      makeRecord(5, {
        order_type: 'mail',
        moved_to_mail: true,
        moved_to_mail_at: '2026-04-15T11:30:00.000Z',
        due_time: '2026-04-15T11:15:00.000Z',
        created_at: '2026-04-15T10:00:00.000Z',
      }),
      makeRecord(6, {
        order_type: 'urgent_mail',
        printed: true,
        ready: true,
        completed: true,
        mailed: true,
        ready_at: '2026-04-15T11:05:00.000Z',
        mailed_at: '2026-04-15T11:50:00.000Z',
        due_time: '2026-04-15T11:05:00.000Z',
        created_at: '2026-04-15T10:30:00.000Z',
      }),
      makeRecord(7, {
        order_type: 'waiter',
        printed: true,
        ready: true,
        completed: true,
        ready_at: '2026-04-15T11:20:00.000Z',
        due_time: '2026-04-15T11:25:00.000Z',
        created_at: '2026-04-15T10:55:00.000Z',
      }),
    ],
    new Date('2026-04-15T12:00:00.000Z'),
  )

  assert.equal(snapshot.generated_at, '2026-04-15T12:00:00.000Z')
  assert.equal(snapshot.total_records, 7)
  assert.equal(snapshot.average_wait_minutes, 27.5)
  assert.equal(snapshot.ready_to_pickup_latency_minutes, 22.5)
  assert.deepEqual(snapshot.mail_conversion, {
    eligible_records: 2,
    mailed_records: 1,
    rate: 50,
  })
  assert.deepEqual(snapshot.workflow_state_counts, {
    intake: 1,
    production: 1,
    ready: 2,
    pickup_complete: 1,
    moved_to_mail: 1,
    mailed: 0,
    archived: 1,
  })
  assert.deepEqual(snapshot.overdue_queue_slices, {
    total: 5,
    by_workflow_state: {
      intake: 0,
      production: 1,
      ready: 2,
      pickup_complete: 1,
      moved_to_mail: 1,
      mailed: 0,
      archived: 0,
    },
    by_order_type: {
      waiter: 3,
      acute: 1,
      urgent_mail: 0,
      mail: 1,
    },
  })
})

test('returns null averages and empty slices when no records exist', () => {
  const snapshot = buildKpiSnapshot([], new Date('2026-04-15T12:00:00.000Z'))

  assert.equal(snapshot.total_records, 0)
  assert.equal(snapshot.average_wait_minutes, null)
  assert.equal(snapshot.ready_to_pickup_latency_minutes, null)
  assert.deepEqual(snapshot.mail_conversion, {
    eligible_records: 0,
    mailed_records: 0,
    rate: null,
  })
  assert.deepEqual(snapshot.overdue_queue_slices, {
    total: 0,
    by_workflow_state: {
      intake: 0,
      production: 0,
      ready: 0,
      pickup_complete: 0,
      moved_to_mail: 0,
      mailed: 0,
      archived: 0,
    },
    by_order_type: {
      waiter: 0,
      acute: 0,
      urgent_mail: 0,
      mail: 0,
    },
  })
})
