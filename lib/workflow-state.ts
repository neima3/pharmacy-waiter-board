import { WaiterRecord } from './types'

export type WorkflowState =
  | 'intake'
  | 'production'
  | 'ready'
  | 'pickup_complete'
  | 'moved_to_mail'
  | 'mailed'
  | 'archived'

type WorkflowStateUpdate = Partial<Pick<WaiterRecord, 'printed' | 'ready' | 'completed' | 'moved_to_mail' | 'mailed'>>

function isTrue(value: unknown): boolean {
  return value === true
}

export function deriveWorkflowState(record: Pick<WaiterRecord, 'printed' | 'ready' | 'completed' | 'moved_to_mail' | 'mailed'>): WorkflowState {
  if (isTrue(record.mailed) && isTrue(record.completed)) return 'archived'
  if (isTrue(record.mailed)) return 'mailed'
  if (isTrue(record.moved_to_mail)) return 'moved_to_mail'
  if (isTrue(record.completed)) return 'pickup_complete'
  if (isTrue(record.ready)) return 'ready'
  if (isTrue(record.printed)) return 'production'
  return 'intake'
}

export function workflowStateLabel(state: WorkflowState): string {
  switch (state) {
    case 'intake':
      return 'Intake'
    case 'production':
      return 'Production'
    case 'ready':
      return 'Ready'
    case 'pickup_complete':
      return 'Pickup Complete'
    case 'moved_to_mail':
      return 'Moved to Mail'
    case 'mailed':
      return 'Mailed'
    case 'archived':
      return 'Archived'
  }
}

export function workflowStateToUpdate(state: WorkflowState): WorkflowStateUpdate {
  switch (state) {
    case 'intake':
      return { printed: false, ready: false, completed: false, moved_to_mail: false, mailed: false }
    case 'production':
      return { printed: true, ready: false, completed: false, moved_to_mail: false, mailed: false }
    case 'ready':
      return { ready: true }
    case 'pickup_complete':
      return { completed: true }
    case 'moved_to_mail':
      return { moved_to_mail: true, completed: false, mailed: false }
    case 'mailed':
      return { mailed: true, completed: false }
    case 'archived':
      return { completed: true, mailed: true }
  }
}

export function nextWorkflowState(state: WorkflowState): WorkflowState {
  switch (state) {
    case 'intake':
      return 'production'
    case 'production':
      return 'ready'
    case 'ready':
      return 'pickup_complete'
    case 'pickup_complete':
      return 'moved_to_mail'
    case 'moved_to_mail':
      return 'mailed'
    case 'mailed':
      return 'archived'
    case 'archived':
      return 'archived'
  }
}
