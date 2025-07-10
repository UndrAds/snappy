import * as React from 'react'

import { cn } from '@/lib/utils'

interface ToasterProps {
  children?: React.ReactNode
}

export function Toaster({ children }: ToasterProps) {
  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 flex flex-col gap-2'
      )}
    >
      {children}
    </div>
  )
} 