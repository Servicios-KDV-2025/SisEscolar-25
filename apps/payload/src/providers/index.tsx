import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { ClerkProvider } from '@clerk/nextjs'
import { ConvexClientProvider } from '@/app/(frontend)/ConvexClientProvider'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <ConvexClientProvider>
        <ClerkProvider>
          <HeaderThemeProvider>{children}</HeaderThemeProvider>
        </ClerkProvider>
      </ConvexClientProvider>
    </ThemeProvider>
  )
}
