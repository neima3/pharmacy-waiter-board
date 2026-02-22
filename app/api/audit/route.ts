import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getAuditLog } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100', 10)
    const logs = await getAuditLog(limit)
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching audit log:', error)
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 })
  }
}
