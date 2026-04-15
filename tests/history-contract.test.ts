import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildAuditHistoryPayload,
  buildRecordHistoryPayload,
  parseHistoryQuery,
} from '../lib/history-contract'

test('parses and clamps stable history query params', () => {
  const query = parseHistoryQuery(new URLSearchParams('limit=999&recordId=17&action=create&eventType=advance'), {
    allowRecordId: true,
  })

  assert.deepEqual(query, {
    limit: 500,
    recordId: 17,
    action: 'CREATE',
    eventType: 'advance',
  })
})

test('builds a stable audit history envelope with workflow enrichment', () => {
  const payload = buildAuditHistoryPayload({
    query: {
      limit: 2,
      recordId: null,
      action: null,
      eventType: null,
    },
    auditRows: [
      {
        id: 11,
        record_id: 7,
        action: 'UPDATE',
        old_values: '{"comments":"old"}',
        new_values: '{"comments":"new"}',
        staff_initials: 'AB',
        timestamp: '2026-04-14T12:00:00.000Z',
      },
      {
        id: 10,
        record_id: 7,
        action: 'CREATE',
        old_values: null,
        new_values: '{"comments":"new"}',
        staff_initials: 'AB',
        timestamp: '2026-04-14T11:00:00.000Z',
      },
    ],
    workflowEvents: [
      {
        id: 22,
        event_type: 'update',
        event_key: 'workflow:7:update',
        record_id: 7,
        payload: {
          id: 22,
          type: 'update',
          recordId: 7,
          workflowState: 'ready',
          previousWorkflowState: 'production',
          occurredAt: '2026-04-14T12:00:00.000Z',
          actorInitials: 'AB',
          reason: null,
          record: {
            id: 7,
            patient_id: null,
            mrn: 'MRN-10007',
            patient_name: 'David Garcia',
            first_name: 'David',
            last_name: 'Garcia',
            dob: '1988-02-28',
            num_prescriptions: 1,
            comments: 'new',
            initials: 'AB',
            order_type: 'waiter',
            due_time: '2026-04-14T13:00:00.000Z',
            created_at: '2026-04-14T11:00:00.000Z',
            active_location_id: 'main-pharmacy',
            active_location_name: 'Main Pharmacy',
            source_app: 'PharmacyWaiterBoard',
            source_record_id: 7,
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
        },
        created_at: '2026-04-14T12:00:00.000Z',
      },
      {
        id: 21,
        event_type: 'create',
        event_key: 'workflow:7:create',
        record_id: 7,
        payload: {
          id: 21,
          type: 'create',
          recordId: 7,
          workflowState: 'production',
          previousWorkflowState: null,
          occurredAt: '2026-04-14T11:00:00.000Z',
          actorInitials: 'AB',
          reason: null,
          record: {
            id: 7,
            patient_id: null,
            mrn: 'MRN-10007',
            patient_name: 'David Garcia',
            first_name: 'David',
            last_name: 'Garcia',
            dob: '1988-02-28',
            num_prescriptions: 1,
            comments: 'new',
            initials: 'AB',
            order_type: 'waiter',
            due_time: '2026-04-14T13:00:00.000Z',
            created_at: '2026-04-14T11:00:00.000Z',
            active_location_id: 'main-pharmacy',
            active_location_name: 'Main Pharmacy',
            source_app: 'PharmacyWaiterBoard',
            source_record_id: 7,
            printed: true,
            ready: false,
            ready_at: null,
            completed: false,
            moved_to_mail: false,
            moved_to_mail_at: null,
            mailed: false,
            mailed_at: null,
          },
          previousRecord: null,
        },
        created_at: '2026-04-14T11:00:00.000Z',
      },
    ],
  })

  assert.equal(payload.items.length, 2)
  assert.equal(payload.meta.limit, 2)
  assert.equal(payload.meta.count, 2)
  assert.equal(payload.meta.has_more, true)
  assert.equal(payload.items[0].workflow_event?.event_type, 'update')
  assert.equal(payload.items[1].workflow_event?.event_type, 'create')
})

test('builds a record history envelope with the record preserved', () => {
  const payload = buildRecordHistoryPayload({
    record: {
      id: 7,
      patient_id: null,
      mrn: 'MRN-10007',
      patient_name: 'David Garcia',
      first_name: 'David',
      last_name: 'Garcia',
      dob: '1988-02-28',
      num_prescriptions: 1,
      comments: 'new',
      initials: 'AB',
      order_type: 'waiter',
      due_time: '2026-04-14T13:00:00.000Z',
      created_at: '2026-04-14T11:00:00.000Z',
      active_location_id: 'main-pharmacy',
      active_location_name: 'Main Pharmacy',
      source_app: 'PharmacyWaiterBoard',
      source_record_id: 7,
      printed: true,
      ready: false,
      ready_at: null,
      completed: false,
      moved_to_mail: false,
      moved_to_mail_at: null,
      mailed: false,
      mailed_at: null,
    },
    query: {
      limit: 1,
      recordId: null,
      action: 'CREATE',
      eventType: 'create',
    },
    auditRows: [],
    workflowEvents: [],
  })

  assert.equal(payload.record.id, 7)
  assert.equal(payload.history.meta.limit, 1)
  assert.equal(payload.history.meta.filters.action, 'CREATE')
  assert.equal(payload.history.meta.filters.event_type, 'create')
})
