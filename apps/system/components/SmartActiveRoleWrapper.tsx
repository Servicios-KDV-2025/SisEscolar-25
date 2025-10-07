'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useUserWithConvex } from '../stores/userStore';
import { useUserSchoolsWithConvex } from '../stores/userSchoolsStore';
import { ActiveRoleProvider } from '../hooks/useActiveRole';
import { useParams } from 'next/navigation';

interface SmartActiveRoleWrapperProps {
  children: React.ReactNode;
}

export function SmartActiveRoleWrapper({ children }: SmartActiveRoleWrapperProps) {
  const { user: clerkUser, isLoaded } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);
  const { selectedSchool, isLoading: schoolLoading } = useUserSchoolsWithConvex(currentUser?._id);
  const params = useParams();
  const subdomain = params?.subdomain as string;

  console.log('SmartActiveRoleWrapper - states:', {
    isLoaded,
    userLoading,
    schoolLoading,
    hasClerkUser: !!clerkUser,
    hasCurrentUser: !!currentUser,
    hasCurrentSchool: !!selectedSchool,
    selectedSchoolId: selectedSchool?.school._id,
    selectedSchoolName: selectedSchool?.school.name,
    subdomain,
    params
  });

  // Siempre renderizar con el contexto, pero pasar schoolId solo si está disponible
  // Prioridad: 1) selectedSchool, 2) escuela por subdominio, 3) primera escuela activa
  const { userSchools } = useUserSchoolsWithConvex(currentUser?._id);
  
  // Buscar escuela por subdominio si está disponible
  const schoolBySubdomain = userSchools?.find(us => 
    us.status === 'active' && us.school.subdomain === subdomain
  );
  
  const schoolId = selectedSchool?.school._id || 
    schoolBySubdomain?.school._id ||
    (userSchools && userSchools.length > 0 ? userSchools.find(us => us.status === 'active')?.school._id : undefined);

  console.log('SmartActiveRoleWrapper - rendering with context, schoolId:', schoolId);
  console.log('SmartActiveRoleWrapper - school selection:', {
    fromSelectedSchool: !!selectedSchool?.school._id,
    fromSubdomain: !!schoolBySubdomain?.school._id,
    fromFallback: !selectedSchool?.school._id && !schoolBySubdomain?.school._id && !!userSchools,
    subdomain,
    schoolBySubdomainName: schoolBySubdomain?.school.name
  });
  
  return (
    <ActiveRoleProvider schoolId={schoolId}>
      {children}
    </ActiveRoleProvider>
  );
}
