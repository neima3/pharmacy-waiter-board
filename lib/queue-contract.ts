import { deriveWorkflowState, type WorkflowState } from './workflow-state'
import type { OrderType, WaiterRecord } from './types'

export type QueueUrgencyTier = 'routine' | 'due-soon' | 'critical' | 'overdue'

export interface QueueMedicationSummary {
  count: number
  display: string
}

export interface QueuePromisedTime {
  iso: string
  relative: string
  minutes_remaining: number | null
}

export interface QueueDeliveryMode {
  code: OrderType
  label: string
}

export interface QueuePriorityBreakdown {
  order_type: OrderType
  workflow_state: WorkflowState
  tier: QueueUrgencyTier
  is_overdue: boolean
  due_in_minutes: number | null
}

export interface QueueCommunicationState {
  workflow_state: WorkflowState
  label: string
  flags: Pick<WaiterRecord, 'printed' | 'ready' | 'completed' | 'moved_to_mail' | 'mailed'>
}

export interface QueueRecordEnrichment {
  medication_summary: QueueMedicationSummary
  promised_time: QueuePromisedTime
  delivery_mode: QueueDeliveryMode
  priority_breakdown: QueuePriorityBreakdown
  communication_state: QueueCommunicationState
}

export type QueueRecordResponse = WaiterRecord & {
  queue_enrichment: QueueRecordEnrichment
}

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : parsed
}

function roundDownMinutes(milliseconds: number): number {
  return Math.floor(Math.abs(milliseconds) / 60000)
}

function formatRelativePromisedTime(millisecondsRemaining: number): string {
  const minutes = roundDownMinutes(millisecondsRemaining)
  if (millisecondsRemaining < 0) return `Overdue by ${minutes}m`
  if (minutes === 0) return 'Due now'
  return `Due in ${minutes}m`
}

function getPriorityTier(millisecondsRemaining: number): QueueUrgencyTier {
  if (millisecondsRemaining < 0) return 'overdue'
  if (millisecondsRemaining <= 5 * 60 * 1000) return 'critical'
  if (millisecondsRemaining <= 15 * 60 * 1000) return 'due-soon'
  return 'routine'
}

function getDeliveryModeLabel(orderType: OrderType): string {
  switch (orderType) {
    case 'waiter':
      return 'Patient pickup'
    case 'acute':
      return 'Acute pickup'
    case 'urgent_mail':
      return 'Urgent mail'
    case 'mail':
      return 'Mail'
  }
}

function getCommunicationLabel(workflowState: WorkflowState): string {
  switch (workflowState) {
    case 'intake':
      return 'Intake'
    case 'production':
      return 'In production'
    case 'ready':
      return 'Ready for pickup'
    case 'pickup_complete':
      return 'Pickup complete'
    case 'moved_to_mail':
      return 'Moved to mail'
    case 'mailed':
      return 'Mailed'
    case 'archived':
      return 'Archived'
  }
}

export function buildQueueRecordEnrichment(record: WaiterRecord, now = new Date()): QueueRecordEnrichment {
  const workflowState = deriveWorkflowState(record)
  const dueTimeMs = parseTimestamp(record.due_time)
  const nowMs = now.getTime()
  const millisecondsRemaining = dueTimeMs === null ? null : dueTimeMs - nowMs

  return {
    medication_summary: {
      count: record.num_prescriptions,
      display: `${record.num_prescriptions} Rx`,
    },
    promised_time: {
      iso: record.due_time,
      relative: millisecondsRemaining === null ? 'Due time unavailable' : formatRelativePromisedTime(millisecondsRemaining),
      minutes_remaining: millisecondsRemaining === null ? null : roundDownMinutes(millisecondsRemaining),
    },
    delivery_mode: {
      code: record.order_type,
      label: getDeliveryModeLabel(record.order_type),
    },
    priority_breakdown: {
      order_type: record.order_type,
      workflow_state: workflowState,
      tier: millisecondsRemaining === null ? 'routine' : getPriorityTier(millisecondsRemaining),
      is_overdue: millisecondsRemaining !== null && millisecondsRemaining < 0,
      due_in_minutes: millisecondsRemaining === null ? null : roundDownMinutes(millisecondsRemaining),
    },
    communication_state: {
      workflow_state: workflowState,
      label: getCommunicationLabel(workflowState),
      flags: {
        printed: record.printed,
        ready: record.ready,
        completed: record.completed,
        moved_to_mail: record.moved_to_mail,
        mailed: record.mailed,
      },
    },
  }
}

export function buildQueueRecordResponse(record: WaiterRecord, now = new Date()): QueueRecordResponse {
  return {
    ...record,
    queue_enrichment: buildQueueRecordEnrichment(record, now),
  }
}

export function buildQueueRecordsResponse(records: WaiterRecord[], now = new Date()): QueueRecordResponse[] {
  return records.map((record) => buildQueueRecordResponse(record, now))
}
