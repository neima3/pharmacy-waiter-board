import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getRecord, getRecordAuditLog } from '@/lib/db'

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

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100', 10)
    const history = await getRecordAuditLog(recordId, limit)
    return NextResponse.json({ record, history })
  } catch (error) {
    console.error('Error fetching record history:', error)
    return NextResponse.json({ error: 'Failed to fetch record history' }, { status: 500 })
  }
}
