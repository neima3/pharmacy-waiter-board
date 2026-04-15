import { WaiterRecord } from './types'
import { WorkflowState, deriveWorkflowState } from './workflow-state'

export type WorkflowEventType = 'create' | 'update' | 'advance' | 'archive' | 'expiration'

export interface WorkflowEventPayload {
  id: number
  type: WorkflowEventType
  recordId: number
  workflowState: WorkflowState
  previousWorkflowState: WorkflowState | null
  occurredAt: string
  actorInitials: string | null
  reason: 'auto_clear' | null
  record: WaiterRecord
  previousRecord: WaiterRecord | null
}

export type WorkflowEventStoragePayload = Omit<WorkflowEventPayload, 'id'>

type WorkflowEventPayloadInput = {
  id: number
  type: WorkflowEventType
  record: WaiterRecord
  previousRecord?: WaiterRecord | null
  occurredAt?: string
  actorInitials?: string | null
  reason?: 'auto_clear' | null
}

export function buildWorkflowEventPayload({
  id,
  type,
  record,
  previousRecord = null,
  occurredAt = new Date().toISOString(),
  actorInitials = null,
  reason = null,
}: WorkflowEventPayloadInput): WorkflowEventPayload {
  return {
    id,
    type,
    recordId: record.id,
    workflowState: deriveWorkflowState(record),
    previousWorkflowState: previousRecord ? deriveWorkflowState(previousRecord) : null,
    occurredAt,
    actorInitials,
    reason,
    record,
    previousRecord,
  }
}

export function toWorkflowEventStoragePayload(payload: WorkflowEventPayload): WorkflowEventStoragePayload {
  const { id: _id, ...storagePayload } = payload
  return storagePayload
}

export function hydrateWorkflowEventPayload(
  id: number,
  payload: WorkflowEventStoragePayload,
): WorkflowEventPayload {
  return { id, ...payload }
}

export function formatWorkflowEventFrame(payload: WorkflowEventPayload): string {
  return [
    `id: ${payload.id}`,
    `event: ${payload.type}`,
    `data: ${JSON.stringify(payload)}`,
    '',
  ].join('\n')
}

export function isExpiredReadyRecord(
  record: Pick<WaiterRecord, 'order_type' | 'ready' | 'completed' | 'ready_at'>,
  autoClearMinutes: number,
  now = new Date(),
): boolean {
  if (record.order_type !== 'waiter') return false
  if (record.ready !== true || record.completed === true || !record.ready_at) return false
  if (!Number.isFinite(autoClearMinutes) || autoClearMinutes <= 0) return false

  const readyAt = Date.parse(record.ready_at)
  if (Number.isNaN(readyAt)) return false

  return now.getTime() >= readyAt + autoClearMinutes * 60 * 1000
}
