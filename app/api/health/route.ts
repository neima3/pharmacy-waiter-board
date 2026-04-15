import { NextResponse } from 'next/server'
import { getEnvironmentHealth } from '@/lib/db-mode'

export const dynamic = 'force-dynamic'

export async function GET() {
  const health = getEnvironmentHealth()
  return NextResponse.json(health, {
    status: health.ready ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}

