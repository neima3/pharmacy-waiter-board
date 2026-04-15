import { getOperationsReportResponse } from '@/lib/reporting-operations-route'

export const dynamic = 'force-dynamic'

export async function GET() {
  return getOperationsReportResponse()
}
