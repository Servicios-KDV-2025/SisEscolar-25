'use client';

import React from 'react';
import { ActiveRoleProvider } from '../hooks/useActiveRole';

interface ActiveRoleWrapperProps {
  children: React.ReactNode;
}

export function ActiveRoleWrapper({ children }: ActiveRoleWrapperProps) {
  // Pasar undefined como schoolId para que el contexto maneje la lógica internamente
  return (
    <ActiveRoleProvider>
      {children}
    </ActiveRoleProvider>
  );
}
