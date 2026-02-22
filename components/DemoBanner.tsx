'use client'

export function DemoBanner() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') return null
  return (
    <div className="bg-amber-400 text-amber-950 text-center py-2.5 px-4 text-sm font-semibold sticky top-0 z-[100] flex items-center justify-center gap-2 shadow-sm">
      <span className="text-base">⚠️</span>
      <span>
        <strong>DEMO VERSION</strong> — Do not enter real patient information or PHI.
        This is for demonstration purposes only.
      </span>
    </div>
  )
}
