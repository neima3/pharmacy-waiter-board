import test from 'node:test'
import assert from 'node:assert/strict'

import {
  ingestExternalIntakeRequest,
  normalizeExternalIntakeRequest,
} from '../lib/external-intake'
import type { WaiterRecord } from '../lib/types'

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
    source_app: overrides.source_app ?? 'PharmCall',
    source_record_id: overrides.source_record_id ?? 77,
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

test('normalizes an external intake payload into a queue-ready record request', () => {
  const result = normalizeExternalIntakeRequest({
    idempotency_key: 'pharmcall-evt-0001',
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
  })

  assert.equal(result.valid, true)
  if (!result.valid) return

  assert.equal(result.payload.idempotency_key, 'pharmcall-evt-0001')
  assert.equal(result.payload.source_app, 'PharmCall')
  assert.equal(result.payload.source_record_id, 88)
  assert.equal(result.payload.active_location_id, 'main-pharmacy')
  assert.equal(result.payload.active_location_name, 'Main Pharmacy')
  assert.equal(result.payload.order_type, 'waiter')
})

test('replays a completed idempotency key without writing a new record', async () => {
  const record = makeRecord(21, {
    source_app: 'PharmCall',
    source_record_id: 88,
    mrn: 'MRN-10088',
    patient_name: 'Nina Patel',
    first_name: 'Nina',
    last_name: 'Patel',
    comments: 'Call when ready',
    initials: 'NP',
    num_prescriptions: 2,
  })
  const replayResponse = {
    id: 21,
    status: 'replayed',
  }

  const result = await ingestExternalIntakeRequest(
    {
      idempotency_key: 'pharmcall-evt-0001',
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
    },
    {
      getIntakeEvent: async () => ({
        id: 9,
        source_app: 'PharmCall',
        idempotency_key: 'pharmcall-evt-0001',
        source_record_id: 88,
        source_event_type: 'create',
        status: 'completed',
        record_id: 21,
        response_status: 201,
        request_payload: '{}',
        response_payload: JSON.stringify(replayResponse),
        error_message: null,
        created_at: '2026-04-15T11:01:00.000Z',
        completed_at: '2026-04-15T11:02:00.000Z',
      }),
      claimIntakeEvent: async () => null,
      completeIntakeEvent: async () => {
        throw new Error('should not complete a replay')
      },
      failIntakeEvent: async () => {
        throw new Error('should not fail a replay')
      },
      getRecordBySourceIdentity: async () => record,
      createRecord: async () => {
        throw new Error('should not create a replayed record')
      },
      updateRecord: async () => {
        throw new Error('should not update a replayed record')
      },
    },
  )

  assert.equal(result.status, 201)
  assert.deepEqual(result.body, replayResponse)
})

test('creates a new queue record for a new external source identity', async () => {
  const record = makeRecord(31, {
    source_app: 'PharmCall',
    source_record_id: 99,
    mrn: 'MRN-10099',
    patient_name: 'Ava Chen',
    first_name: 'Ava',
    last_name: 'Chen',
    comments: 'Room 12',
    initials: 'AC',
    num_prescriptions: 1,
  })

  let createCalls = 0
  let finalizeCalls = 0

  const result = await ingestExternalIntakeRequest(
    {
      idempotency_key: 'pharmcall-evt-0002',
      event_type: 'create',
      source_app: 'PharmCall',
      source_record_id: 99,
      mrn: 'MRN-10099',
      patient_name: 'Ava Chen',
      first_name: 'Ava',
      last_name: 'Chen',
      dob: '1990-03-05',
      num_prescriptions: 1,
      comments: 'Room 12',
      initials: 'AC',
      order_type: 'acute',
    },
    {
      getIntakeEvent: async () => null,
      claimIntakeEvent: async () => ({
        id: 12,
        source_app: 'PharmCall',
        idempotency_key: 'pharmcall-evt-0002',
        source_record_id: 99,
        source_event_type: 'create',
        status: 'processing',
        record_id: null,
        response_status: null,
        request_payload: '{}',
        response_payload: null,
        error_message: null,
        created_at: '2026-04-15T11:03:00.000Z',
        completed_at: null,
      }),
      completeIntakeEvent: async () => {
        finalizeCalls += 1
      },
      failIntakeEvent: async () => {
        throw new Error('should not fail a successful intake')
      },
      getRecordBySourceIdentity: async () => null,
      createRecord: async () => {
        createCalls += 1
        return record
      },
      updateRecord: async () => {
        throw new Error('should not update a new intake')
      },
    },
  )

  assert.equal(result.status, 201)
  if ('id' in result.body) {
    assert.equal(result.body.id, 31)
  } else {
    assert.fail('expected a queue record response')
  }
  assert.equal(createCalls, 1)
  assert.equal(finalizeCalls, 1)
})

test('updates an existing queue record for a known external source identity', async () => {
  const existing = makeRecord(41, {
    source_app: 'PharmCall',
    source_record_id: 100,
    mrn: 'MRN-10100',
    patient_name: 'Mia Lopez',
    first_name: 'Mia',
    last_name: 'Lopez',
    comments: 'Old note',
    initials: 'ML',
    num_prescriptions: 1,
  })
  const updated = makeRecord(41, {
    source_app: 'PharmCall',
    source_record_id: 100,
    mrn: 'MRN-10100',
    patient_name: 'Mia Lopez',
    first_name: 'Mia',
    last_name: 'Lopez',
    comments: 'Updated note',
    initials: 'ML',
    num_prescriptions: 3,
  })

  let updateCalls = 0

  const result = await ingestExternalIntakeRequest(
    {
      idempotency_key: 'pharmcall-evt-0003',
      event_type: 'update',
      source_app: 'PharmCall',
      source_record_id: 100,
      mrn: 'MRN-10100',
      patient_name: 'Mia Lopez',
      first_name: 'Mia',
      last_name: 'Lopez',
      dob: '1987-09-19',
      num_prescriptions: 3,
      comments: 'Updated note',
      initials: 'ML',
      order_type: 'waiter',
    },
    {
      getIntakeEvent: async () => null,
      claimIntakeEvent: async () => ({
        id: 13,
        source_app: 'PharmCall',
        idempotency_key: 'pharmcall-evt-0003',
        source_record_id: 100,
        source_event_type: 'update',
        status: 'processing',
        record_id: null,
        response_status: null,
        request_payload: '{}',
        response_payload: null,
        error_message: null,
        created_at: '2026-04-15T11:04:00.000Z',
        completed_at: null,
      }),
      completeIntakeEvent: async () => undefined,
      failIntakeEvent: async () => undefined,
      getRecordBySourceIdentity: async () => existing,
      createRecord: async () => {
        throw new Error('should not create when the source identity already exists')
      },
      updateRecord: async () => {
        updateCalls += 1
        return updated
      },
    },
  )

  assert.equal(result.status, 200)
  if ('id' in result.body) {
    assert.equal(result.body.id, 41)
  } else {
    assert.fail('expected a queue record response')
  }
  assert.equal(updateCalls, 1)
})
