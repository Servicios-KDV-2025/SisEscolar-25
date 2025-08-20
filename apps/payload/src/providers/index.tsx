import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { ClerkProvider } from '@clerk/nextjs'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <ClerkProvider>
        <HeaderThemeProvider>{children}</HeaderThemeProvider>
      </ClerkProvider>
    </ThemeProvider>
  )
}
