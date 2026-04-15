import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveWorkflowState, workflowStateLabel, workflowStateToUpdate } from '../lib/workflow-state'

test('derives workflow states from persisted record flags', () => {
  assert.equal(deriveWorkflowState({ printed: false, ready: false, completed: false, moved_to_mail: false, mailed: false }), 'intake')
  assert.equal(deriveWorkflowState({ printed: true, ready: false, completed: false, moved_to_mail: false, mailed: false }), 'production')
  assert.equal(deriveWorkflowState({ printed: true, ready: true, completed: false, moved_to_mail: false, mailed: false }), 'ready')
  assert.equal(deriveWorkflowState({ printed: true, ready: true, completed: true, moved_to_mail: false, mailed: false }), 'pickup_complete')
  assert.equal(deriveWorkflowState({ printed: false, ready: false, completed: false, moved_to_mail: true, mailed: false }), 'moved_to_mail')
  assert.equal(deriveWorkflowState({ printed: false, ready: false, completed: false, moved_to_mail: false, mailed: true }), 'mailed')
  assert.equal(deriveWorkflowState({ printed: false, ready: false, completed: true, moved_to_mail: false, mailed: true }), 'archived')
})

test('maps canonical workflow states to update payloads', () => {
  assert.deepEqual(workflowStateToUpdate('production'), { printed: true, ready: false, completed: false, moved_to_mail: false, mailed: false })
  assert.deepEqual(workflowStateToUpdate('ready'), { ready: true })
  assert.deepEqual(workflowStateToUpdate('pickup_complete'), { completed: true })
  assert.deepEqual(workflowStateToUpdate('moved_to_mail'), { moved_to_mail: true, completed: false, mailed: false })
  assert.deepEqual(workflowStateToUpdate('mailed'), { mailed: true, completed: false })
  assert.deepEqual(workflowStateToUpdate('archived'), { completed: true, mailed: true })
})

test('labels workflow states for the UI', () => {
  assert.equal(workflowStateLabel('intake'), 'Intake')
  assert.equal(workflowStateLabel('pickup_complete'), 'Pickup Complete')
  assert.equal(workflowStateLabel('archived'), 'Archived')
})
