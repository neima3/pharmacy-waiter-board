import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildQueueRecordResponse,
  buildQueueRecordsResponse,
} from '../lib/queue-contract'

test('builds a queue enrichment envelope from persisted record fields', () => {
  const response = buildQueueRecordResponse(
    {
      id: 17,
      patient_id: 42,
      mrn: 'MRN-10042',
      patient_name: 'Maria Rodriguez',
      first_name: 'Maria',
      last_name: 'Rodriguez',
      dob: '1978-07-22',
      num_prescriptions: 3,
      comments: 'Needs pickup',
      initials: 'AB',
      order_type: 'waiter',
      due_time: '2026-04-15T12:10:00.000Z',
      created_at: '2026-04-15T11:00:00.000Z',
      active_location_id: 'main-pharmacy',
      active_location_name: 'Main Pharmacy',
      source_app: 'PharmacyWaiterBoard',
      source_record_id: 17,
      printed: true,
      ready: true,
      ready_at: '2026-04-15T11:55:00.000Z',
      completed: false,
      moved_to_mail: false,
      moved_to_mail_at: null,
      mailed: false,
      mailed_at: null,
    },
    new Date('2026-04-15T12:00:00.000Z'),
  )

  assert.equal(response.id, 17)
  assert.equal(response.queue_enrichment.medication_summary.count, 3)
  assert.equal(response.queue_enrichment.medication_summary.display, '3 Rx')
  assert.equal(response.queue_enrichment.promised_time.iso, '2026-04-15T12:10:00.000Z')
  assert.equal(response.queue_enrichment.promised_time.relative, 'Due in 10m')
  assert.equal(response.queue_enrichment.delivery_mode.code, 'waiter')
  assert.equal(response.queue_enrichment.delivery_mode.label, 'Patient pickup')
  assert.equal(response.queue_enrichment.priority_breakdown.order_type, 'waiter')
  assert.equal(response.queue_enrichment.priority_breakdown.workflow_state, 'ready')
  assert.equal(response.queue_enrichment.priority_breakdown.tier, 'due-soon')
  assert.equal(response.queue_enrichment.priority_breakdown.is_overdue, false)
  assert.equal(response.queue_enrichment.communication_state.workflow_state, 'ready')
  assert.equal(response.queue_enrichment.communication_state.label, 'Ready for pickup')
  assert.equal(response.queue_enrichment.communication_state.flags.ready, true)
})

test('enriches a queue list without changing the record ordering', () => {
  const responses = buildQueueRecordsResponse(
    [
      {
        id: 8,
        patient_id: null,
        mrn: 'MRN-10008',
        patient_name: 'Barbara Martinez',
        first_name: 'Barbara',
        last_name: 'Martinez',
        dob: '1975-06-19',
        num_prescriptions: 1,
        comments: '',
        initials: 'CD',
        order_type: 'mail',
        due_time: '2026-04-15T13:00:00.000Z',
        created_at: '2026-04-15T11:30:00.000Z',
        active_location_id: 'main-pharmacy',
        active_location_name: 'Main Pharmacy',
        source_app: 'PharmacyWaiterBoard',
        source_record_id: 8,
        printed: false,
        ready: false,
        ready_at: null,
        completed: false,
        moved_to_mail: false,
        moved_to_mail_at: null,
        mailed: false,
        mailed_at: null,
      },
      {
        id: 9,
        patient_id: null,
        mrn: 'MRN-10009',
        patient_name: 'William Davis',
        first_name: 'William',
        last_name: 'Davis',
        dob: '1945-08-11',
        num_prescriptions: 2,
        comments: '',
        initials: 'EF',
        order_type: 'urgent_mail',
        due_time: '2026-04-15T12:30:00.000Z',
        created_at: '2026-04-15T11:20:00.000Z',
        active_location_id: 'main-pharmacy',
        active_location_name: 'Main Pharmacy',
        source_app: 'PharmacyWaiterBoard',
        source_record_id: 9,
        printed: true,
        ready: true,
        ready_at: '2026-04-15T11:45:00.000Z',
        completed: false,
        moved_to_mail: true,
        moved_to_mail_at: '2026-04-15T11:50:00.000Z',
        mailed: false,
        mailed_at: null,
      },
    ],
    new Date('2026-04-15T12:00:00.000Z'),
  )

  assert.deepEqual(responses.map((response) => response.id), [8, 9])
  assert.equal(responses[0].queue_enrichment.delivery_mode.label, 'Mail')
  assert.equal(responses[0].queue_enrichment.communication_state.label, 'Intake')
  assert.equal(responses[1].queue_enrichment.delivery_mode.label, 'Urgent mail')
  assert.equal(responses[1].queue_enrichment.communication_state.label, 'Moved to mail')
})
