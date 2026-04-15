import { NextResponse } from 'next/server'

import { buildWaiterBoardApiSurface } from '@/lib/waiter-board-api-surface-contract'

export const dynamic = 'force-dynamic'

export function GET() {
  const payload = buildWaiterBoardApiSurface()

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
