import { OrderType, WaiterRecord } from './types'
import { deriveWorkflowState, type WorkflowState } from './workflow-state'

export interface MailConversionSnapshot {
  eligible_records: number
  mailed_records: number
  rate: number | null
}

export interface OverdueQueueSlicesSnapshot {
  total: number
  by_workflow_state: Record<WorkflowState, number>
  by_order_type: Record<OrderType, number>
}

export interface KpiSnapshot {
  generated_at: string
  total_records: number
  average_wait_minutes: number | null
  ready_to_pickup_latency_minutes: number | null
  mail_conversion: MailConversionSnapshot
  workflow_state_counts: Record<WorkflowState, number>
  overdue_queue_slices: OverdueQueueSlicesSnapshot
}

const WORKFLOW_STATES: WorkflowState[] = [
  'intake',
  'production',
  'ready',
  'pickup_complete',
  'moved_to_mail',
  'mailed',
  'archived',
]

const ORDER_TYPES: OrderType[] = ['waiter', 'acute', 'urgent_mail', 'mail']

function createWorkflowStateCounts(): Record<WorkflowState, number> {
  return Object.fromEntries(WORKFLOW_STATES.map((state) => [state, 0])) as Record<WorkflowState, number>
}

function createOrderTypeCounts(): Record<OrderType, number> {
  return Object.fromEntries(ORDER_TYPES.map((orderType) => [orderType, 0])) as Record<OrderType, number>
}

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : parsed
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

function averageMinutes(values: number[]): number | null {
  if (values.length === 0) return null
  const sum = values.reduce((total, value) => total + value, 0)
  return roundToOneDecimal(sum / values.length)
}

function isMailEligible(record: WaiterRecord): boolean {
  return record.order_type === 'mail' || record.order_type === 'urgent_mail'
}

function isOverdueRecord(record: WaiterRecord, nowMs: number): boolean {
  const dueMs = parseTimestamp(record.due_time)
  if (dueMs === null || dueMs > nowMs) return false

  const workflowState = deriveWorkflowState(record)
  return workflowState !== 'mailed' && workflowState !== 'archived'
}

export function buildKpiSnapshot(records: WaiterRecord[], now = new Date()): KpiSnapshot {
  const workflowStateCounts = createWorkflowStateCounts()
  const overdueByWorkflowState = createWorkflowStateCounts()
  const overdueByOrderType = createOrderTypeCounts()

  const waitMinutes: number[] = []
  const readyLatencyMinutes: number[] = []
  let mailEligibleRecords = 0
  let mailedRecords = 0
  let overdueTotal = 0

  const nowMs = now.getTime()

  for (const record of records) {
    const workflowState = deriveWorkflowState(record)
    workflowStateCounts[workflowState] += 1

    const readyAtMs = parseTimestamp(record.ready_at)
    const createdAtMs = parseTimestamp(record.created_at)

    if (readyAtMs !== null && createdAtMs !== null && readyAtMs >= createdAtMs) {
      waitMinutes.push((readyAtMs - createdAtMs) / 60000)
    }

    if (workflowState === 'ready' && readyAtMs !== null) {
      const latencyMinutes = (nowMs - readyAtMs) / 60000
      if (latencyMinutes >= 0) {
        readyLatencyMinutes.push(latencyMinutes)
      }
    }

    if (isMailEligible(record)) {
      mailEligibleRecords += 1
      if (record.mailed) {
        mailedRecords += 1
      }
    }

    if (isOverdueRecord(record, nowMs)) {
      overdueTotal += 1
      overdueByWorkflowState[workflowState] += 1
      overdueByOrderType[record.order_type] += 1
    }
  }

  return {
    generated_at: now.toISOString(),
    total_records: records.length,
    average_wait_minutes: averageMinutes(waitMinutes),
    ready_to_pickup_latency_minutes: averageMinutes(readyLatencyMinutes),
    mail_conversion: {
      eligible_records: mailEligibleRecords,
      mailed_records: mailedRecords,
      rate: mailEligibleRecords === 0 ? null : roundToOneDecimal((mailedRecords / mailEligibleRecords) * 100),
    },
    workflow_state_counts: workflowStateCounts,
    overdue_queue_slices: {
      total: overdueTotal,
      by_workflow_state: overdueByWorkflowState,
      by_order_type: overdueByOrderType,
    },
  }
}
