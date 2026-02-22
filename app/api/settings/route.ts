import { NextRequest, NextResponse } from 'next/server'
import { getAllSettings, updateSettings } from '@/lib/db'
import { Settings } from '@/lib/types'

export async function GET() {
  try {
    const settings = getAllSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as Partial<Settings>
    updateSettings(body)
    const settings = getAllSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
