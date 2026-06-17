'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          error: 'bg-destructive text-destructive-foreground border-destructive',
          success: 'bg-green-50 text-green-900 border-green-200',
        },
      }}
    />
  )
}
