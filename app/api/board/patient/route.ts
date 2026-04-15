import { NextResponse } from 'next/server'
import { initializeDatabase, getReadyWaiterRecords, syncExpiredWorkflowEvents } from '@/lib/db'
import { buildQueueRecordsResponse } from '@/lib/queue-contract'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await initializeDatabase()
    await syncExpiredWorkflowEvents()
    const records = await getReadyWaiterRecords()
    return NextResponse.json(buildQueueRecordsResponse(records))
  } catch (error) {
    console.error('Error fetching patient board:', error)
    return NextResponse.json({ error: 'Failed to fetch patient board' }, { status: 500 })
  }
}
