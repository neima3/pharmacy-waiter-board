import { NextRequest, NextResponse } from 'next/server'
import { searchPatientsByMRN } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const mrn = searchParams.get('mrn')
    
    if (!mrn) {
      return NextResponse.json({ error: 'MRN is required' }, { status: 400 })
    }
    
    const patient = searchPatientsByMRN(mrn)
    
    if (!patient) {
      return NextResponse.json({ found: false })
    }
    
    return NextResponse.json({ found: true, patient })
  } catch (error) {
    console.error('Error searching patient:', error)
    return NextResponse.json({ error: 'Failed to search patient' }, { status: 500 })
  }
}
