import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getRecord, updateRecord } from '@/lib/db'
import { workflowStateToUpdate } from '@/lib/workflow-state'

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

    const updated = await updateRecord(record.id, workflowStateToUpdate('archived'), record.initials, 'archive')
    if (!updated) return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    return NextResponse.json({ record: updated, workflow_state: 'archived' })
  } catch (error) {
    console.error('Error archiving record:', error)
    return NextResponse.json({ error: 'Failed to archive record' }, { status: 500 })
  }
}
