import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { DemoBanner } from '@/components/DemoBanner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pharmacy Waiter Board',
  description: 'Pharmacy Waiter Board Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <DemoBanner />
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: '#0f172a',
              color: '#fff',
              border: 'none',
            },
          }}
          closeButton
          richColors
        />
        {children}
      </body>
    </html>
  )
}
