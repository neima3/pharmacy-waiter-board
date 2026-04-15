import { NextResponse } from 'next/server'
import { initializeDatabase, getAllRecords, syncExpiredWorkflowEvents } from '@/lib/db'
import { buildKpiSnapshot } from '@/lib/reporting-kpis'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await initializeDatabase()
    await syncExpiredWorkflowEvents()
    const records = await getAllRecords()
    const snapshot = buildKpiSnapshot(records)

    return NextResponse.json(snapshot, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching KPI snapshot:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch KPI snapshot',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
