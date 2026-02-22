import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getPatientByMRN } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()
    const mrn = request.nextUrl.searchParams.get('mrn')
    if (!mrn) return NextResponse.json({ error: 'MRN is required' }, { status: 400 })

    const patient = await getPatientByMRN(mrn)
    if (!patient) return NextResponse.json({ found: false })
    return NextResponse.json({ found: true, patient })
  } catch (error) {
    console.error('Error searching patient:', error)
    return NextResponse.json({ error: 'Failed to search patient' }, { status: 500 })
  }
}
