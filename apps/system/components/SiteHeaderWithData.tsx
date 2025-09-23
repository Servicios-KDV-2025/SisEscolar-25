'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { useUserWithConvex } from '../stores/userStore';
import { useCurrentSchool } from '../stores/userSchoolsStore';
import { SiteHeader } from 'components/menu/site-header';

export function SiteHeaderWithData() {
  const { user: clerkUser, isLoaded } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);
  const pathname = usePathname();
  
  // Usar el hook que detecta automáticamente el subdominio desde params
  const {
    currentSchool,
    isLoading: schoolLoading,
  } = useCurrentSchool(currentUser?._id);

  // Preparar datos de la escuela para el header
  const schoolData = React.useMemo(() => {
    // Si no están cargados los datos, mostrar loading
    if (!isLoaded || userLoading || schoolLoading) {
      return {
        name: "Cargando...",
        shortName: "Cargando"
      };
    }

    // Si no hay escuela encontrada
    if (!currentSchool) {
      return {
        name: "Escuela no encontrada",
        shortName: "Error"
      };
    }

    // Datos válidos de la escuela
    return {
      name: currentSchool.school.name,
      shortName: currentSchool.school.shortName
    };
  }, [isLoaded, userLoading, schoolLoading, currentSchool]);

  return (
    <SiteHeader 
      schoolName={schoolData.name}
      pathname={pathname}
    />
  );
}
