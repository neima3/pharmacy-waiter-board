import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getRecord, updateRecord } from '@/lib/db'
import { deriveWorkflowState, nextWorkflowState, workflowStateToUpdate } from '@/lib/workflow-state'
import { buildQueueRecordResponse } from '@/lib/queue-contract'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase()
    const { id } = await params
    const record = await getRecord(parseInt(id, 10))
    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 })

    const nextState = nextWorkflowState(deriveWorkflowState(record))
    const updated = await updateRecord(
      record.id,
      workflowStateToUpdate(nextState),
      record.initials,
      'advance'
    )
    if (!updated) return NextResponse.json({ error: 'Record not found' }, { status: 404 })

    return NextResponse.json({ record: buildQueueRecordResponse(updated), workflow_state: nextState })
  } catch (error) {
    console.error('Error advancing record:', error)
    return NextResponse.json({ error: 'Failed to advance record' }, { status: 500 })
  }
}
