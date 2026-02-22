import { NextRequest, NextResponse } from 'next/server'
import { 
  getAllWaiterRecords, 
  createWaiterRecord, 
  getProductionBoardRecords,
  calculateDueTime 
} from '@/lib/db'
import { OrderType } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    
    let records
    if (type === 'production') {
      records = getProductionBoardRecords()
    } else {
      records = getAllWaiterRecords()
    }
    
    return NextResponse.json(records)
  } catch (error) {
    console.error('Error fetching records:', error)
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mrn, first_name, last_name, dob, num_prescriptions, comments, initials, order_type } = body
    
    if (!mrn || !first_name || !last_name || !dob || !initials) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const dueTime = calculateDueTime((order_type || 'waiter') as OrderType)
    
    const record = createWaiterRecord({
      mrn,
      first_name,
      last_name,
      dob,
      num_prescriptions: num_prescriptions || 1,
      comments: comments || '',
      initials,
      order_type: (order_type || 'waiter') as OrderType,
      due_time: dueTime,
    })
    
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating record:', error)
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
  }
}
