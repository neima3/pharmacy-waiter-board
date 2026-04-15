'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { WaiterForm } from '@/components/WaiterForm'
import { parsePatientLaunchContextFromSearchParams } from '@/lib/launch-context'

export function EntryFormPanel() {
  const searchParams = useSearchParams()
  const launchContext = useMemo(() => {
    return parsePatientLaunchContextFromSearchParams(new URLSearchParams(searchParams.toString()))
  }, [searchParams])

  return (
    <WaiterForm
      launchContext={launchContext.valid ? launchContext.context : null}
      launchContextError={launchContext.valid ? null : launchContext.message}
    />
  )
}
