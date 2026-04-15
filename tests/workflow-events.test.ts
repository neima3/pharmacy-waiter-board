import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildWorkflowEventPayload,
  formatWorkflowEventFrame,
  isExpiredReadyRecord,
} from '../lib/workflow-events'

test('builds a canonical workflow event payload', () => {
  const payload = buildWorkflowEventPayload({
    id: 17,
    type: 'advance',
    record: {
      id: 17,
      patient_id: 42,
      mrn: 'MRN-10042',
      patient_name: 'Maria Rodriguez',
      first_name: 'Maria',
      last_name: 'Rodriguez',
      dob: '1978-07-22',
      num_prescriptions: 1,
      comments: 'Needs pickup',
      initials: 'AB',
      order_type: 'waiter',
      due_time: '2026-04-14T12:00:00.000Z',
      created_at: '2026-04-14T11:00:00.000Z',
      active_location_id: 'main-pharmacy',
      active_location_name: 'Main Pharmacy',
      source_app: 'PharmacyWaiterBoard',
      source_record_id: 17,
      printed: true,
      ready: true,
      ready_at: '2026-04-14T11:15:00.000Z',
      completed: false,
      moved_to_mail: false,
      moved_to_mail_at: null,
      mailed: false,
      mailed_at: null,
    },
    previousRecord: {
      id: 17,
      patient_id: 42,
      mrn: 'MRN-10042',
      patient_name: 'Maria Rodriguez',
      first_name: 'Maria',
      last_name: 'Rodriguez',
      dob: '1978-07-22',
      num_prescriptions: 1,
      comments: 'Needs pickup',
      initials: 'AB',
      order_type: 'waiter',
      due_time: '2026-04-14T12:00:00.000Z',
      created_at: '2026-04-14T11:00:00.000Z',
      active_location_id: 'main-pharmacy',
      active_location_name: 'Main Pharmacy',
      source_app: 'PharmacyWaiterBoard',
      source_record_id: 17,
      printed: true,
      ready: false,
      ready_at: null,
      completed: false,
      moved_to_mail: false,
      moved_to_mail_at: null,
      mailed: false,
      mailed_at: null,
    },
    occurredAt: '2026-04-14T11:16:00.000Z',
    actorInitials: 'AB',
  })

  assert.equal(payload.id, 17)
  assert.equal(payload.type, 'advance')
  assert.equal(payload.recordId, 17)
  assert.equal(payload.workflowState, 'ready')
  assert.equal(payload.previousWorkflowState, 'production')
  assert.equal(payload.actorInitials, 'AB')
  assert.equal(payload.record.mrn, 'MRN-10042')
  assert.equal(payload.previousRecord?.ready, false)
})

test('detects expired ready waiter records using the auto-clear window', () => {
  const now = new Date('2026-04-14T12:00:00.000Z')

  assert.equal(
    isExpiredReadyRecord(
      {
        order_type: 'waiter',
        ready: true,
        completed: false,
        ready_at: '2026-04-14T11:15:00.000Z',
      },
      30,
      now,
    ),
    true,
  )

  assert.equal(
    isExpiredReadyRecord(
      {
        order_type: 'waiter',
        ready: true,
        completed: false,
        ready_at: '2026-04-14T11:40:00.000Z',
      },
      30,
      now,
    ),
    false,
  )

  assert.equal(
    isExpiredReadyRecord(
      {
        order_type: 'mail',
        ready: true,
        completed: false,
        ready_at: '2026-04-14T11:15:00.000Z',
      },
      30,
      now,
    ),
    false,
  )
})

test('formats canonical SSE frames for workflow events', () => {
  const frame = formatWorkflowEventFrame({
    id: 17,
    type: 'expiration',
    recordId: 17,
    workflowState: 'ready',
    previousWorkflowState: 'ready',
    occurredAt: '2026-04-14T12:00:00.000Z',
    actorInitials: null,
    reason: 'auto_clear',
    record: {
      id: 17,
      patient_id: 42,
      mrn: 'MRN-10042',
      patient_name: 'Maria Rodriguez',
      first_name: 'Maria',
      last_name: 'Rodriguez',
      dob: '1978-07-22',
      num_prescriptions: 1,
      comments: 'Needs pickup',
      initials: 'AB',
      order_type: 'waiter',
      due_time: '2026-04-14T12:00:00.000Z',
      created_at: '2026-04-14T11:00:00.000Z',
      active_location_id: 'main-pharmacy',
      active_location_name: 'Main Pharmacy',
      source_app: 'PharmacyWaiterBoard',
      source_record_id: 17,
      printed: true,
      ready: true,
      ready_at: '2026-04-14T11:15:00.000Z',
      completed: false,
      moved_to_mail: false,
      moved_to_mail_at: null,
      mailed: false,
      mailed_at: null,
    },
    previousRecord: null,
  })

  assert.match(frame, /^id: 17$/m)
  assert.match(frame, /^event: expiration$/m)
  assert.match(frame, /^data: /m)
  assert.match(frame, /"reason":"auto_clear"/)
})
