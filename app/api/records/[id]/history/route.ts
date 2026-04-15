import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getRecord, getRecordAuditLog, getRecordWorkflowEvents } from '@/lib/db'
import { buildRecordHistoryPayload, parseHistoryQuery } from '@/lib/history-contract'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase()
    const { id } = await params
    const recordId = parseInt(id, 10)
    const record = await getRecord(recordId)
    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 })

    const query = parseHistoryQuery(request.nextUrl.searchParams)
    const auditRows = await getRecordAuditLog(recordId, query.limit, {
      action: query.action,
    })
    const workflowEvents = await getRecordWorkflowEvents(recordId, query.limit, query.eventType)
    const payload = buildRecordHistoryPayload({
      record,
      auditRows,
      workflowEvents,
      query,
    })
    return NextResponse.json(payload)
  } catch (error) {
    console.error('Error fetching record history:', error)
    return NextResponse.json({ error: 'Failed to fetch record history' }, { status: 500 })
  }
}
