import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getRecord, updateRecord, deleteRecord } from '@/lib/db'
import { validateComments, validateInitials, sanitizeString } from '@/lib/validation'
import { workflowStateToUpdate, type WorkflowState } from '@/lib/workflow-state'
import { buildQueueRecordResponse } from '@/lib/queue-contract'

export const dynamic = 'force-dynamic'

export interface RecordRouteDependencies {
  initializeDatabase: typeof initializeDatabase
  getRecord: typeof getRecord
  updateRecord: typeof updateRecord
  deleteRecord: typeof deleteRecord
}

export const recordRouteDependencies: RecordRouteDependencies = {
  initializeDatabase,
  getRecord,
  updateRecord,
  deleteRecord,
}

export async function getRecordResponse(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  deps: RecordRouteDependencies = recordRouteDependencies,
) {
  try {
    await deps.initializeDatabase()
    const { id } = await params
    const record = await deps.getRecord(parseInt(id, 10))
    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    return NextResponse.json(buildQueueRecordResponse(record))
  } catch (error) {
    console.error('Error fetching record:', error)
    return NextResponse.json({ error: 'Failed to fetch record' }, { status: 500 })
  }
}

export async function putRecordResponse(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  deps: RecordRouteDependencies = recordRouteDependencies,
) {
  try {
    await deps.initializeDatabase()
    const { id } = await params
    const body = await request.json()
    const { comments, initials, num_prescriptions, printed, ready, completed, moved_to_mail, mailed, workflow_state } = body

    if (comments !== undefined) {
      const commentsResult = validateComments(comments)
      if (!commentsResult.valid) {
        return NextResponse.json({ error: commentsResult.message }, { status: 400 })
      }
    }

    if (initials !== undefined) {
      const initialsResult = validateInitials(initials)
      if (!initialsResult.valid) {
        return NextResponse.json({ error: initialsResult.message }, { status: 400 })
      }
    }

    if (num_prescriptions !== undefined) {
      if (!Number.isInteger(num_prescriptions) || num_prescriptions < 1) {
        return NextResponse.json({ error: 'num_prescriptions must be a positive integer' }, { status: 400 })
      }
    }

    const sanitizedComments = comments !== undefined ? sanitizeString(comments) : undefined

    const workflowStateUpdate = typeof workflow_state === 'string' ? workflowStateToUpdate(workflow_state as WorkflowState) : null
    const record = await deps.updateRecord(
      parseInt(id, 10),
      {
        comments: sanitizedComments,
        initials,
        num_prescriptions,
        printed: workflowStateUpdate?.printed ?? printed,
        ready: workflowStateUpdate?.ready ?? ready,
        completed: workflowStateUpdate?.completed ?? completed,
        moved_to_mail: workflowStateUpdate?.moved_to_mail ?? moved_to_mail,
        mailed: workflowStateUpdate?.mailed ?? mailed,
      },
      initials,
      'update',
    )

    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    return NextResponse.json(buildQueueRecordResponse(record))
  } catch (error) {
    console.error('Error updating record:', error)
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
  }
}

export async function deleteRecordResponse(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  deps: RecordRouteDependencies = recordRouteDependencies,
) {
  try {
    await deps.initializeDatabase()
    const { id } = await params
    const success = await deps.deleteRecord(parseInt(id, 10))
    if (!success) return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting record:', error)
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return getRecordResponse(request, context)
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return putRecordResponse(request, context)
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return deleteRecordResponse(request, context)
}
