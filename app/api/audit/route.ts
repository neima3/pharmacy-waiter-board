import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getAuditLog, getWorkflowEvents } from '@/lib/db'
import { buildAuditHistoryPayload, parseHistoryQuery } from '@/lib/history-contract'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()
    const query = parseHistoryQuery(request.nextUrl.searchParams, {
      allowRecordId: true,
    })
    const auditRows = await getAuditLog(query.limit, {
      recordId: query.recordId,
      action: query.action,
    })
    const recordIds = Array.from(new Set(auditRows.map((row) => row.record_id)))
    const workflowEvents = recordIds.length > 0
      ? await getWorkflowEvents(query.limit, {
          recordIds,
          eventType: query.eventType,
        })
      : []
    const history = buildAuditHistoryPayload({
      auditRows,
      workflowEvents,
      query,
    })
    return NextResponse.json(history)
  } catch (error) {
    console.error('Error fetching audit log:', error)
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 })
  }
}
