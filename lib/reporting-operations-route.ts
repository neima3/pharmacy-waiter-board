import { NextResponse } from 'next/server'

import { initializeDatabase, getAllRecords, syncExpiredWorkflowEvents } from '@/lib/db'
import { buildOperationsReportSnapshot } from '@/lib/reporting-operations'

export interface OperationsReportDependencies {
  initializeDatabase: typeof initializeDatabase
  syncExpiredWorkflowEvents: typeof syncExpiredWorkflowEvents
  getAllRecords: typeof getAllRecords
}

const defaultDependencies: OperationsReportDependencies = {
  initializeDatabase,
  syncExpiredWorkflowEvents,
  getAllRecords,
}

export async function getOperationsReportResponse(
  deps: OperationsReportDependencies = defaultDependencies,
  now = new Date(),
) {
  try {
    await deps.initializeDatabase()
    await deps.syncExpiredWorkflowEvents()
    const records = await deps.getAllRecords()
    const snapshot = buildOperationsReportSnapshot(records, now)

    return NextResponse.json(snapshot, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching operations report:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch operations report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
