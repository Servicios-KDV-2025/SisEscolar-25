'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useUserWithConvex } from '../stores/userStore';
import { useCurrentSchool } from '../stores/userSchoolsStore';
import { AppSidebar } from 'components/menu/app-sidebar';

export function AppSidebarWithData({ ...props }: React.ComponentProps<typeof AppSidebar>) {
  const { user: clerkUser } = useUser();
  const { currentUser } = useUserWithConvex(clerkUser?.id);
  
  // Usar el hook que detecta automáticamente el subdominio desde params
  const {
    currentSchool,
    subdomain,
    isLoading: schoolsLoading,
  } = useCurrentSchool(currentUser?._id);

  // Preparar datos de la escuela para el sidebar
  const schoolData = React.useMemo(() => {
    // Mostrar loading mientras carga
    if (schoolsLoading || !currentUser || !subdomain) {
      return {
        name: "Cargando escuela...",
        shortName: "Cargando",
        logo: "/avatars/default-school.jpg"
      };
    }

    // Si no hay escuela después de cargar
    if (!currentSchool) {
      return {
        name: "Escuela no encontrada",
        shortName: "Error",
        logo: "/avatars/default-school.jpg"
      };
    }

    // Datos reales de la escuela
    const schoolInfo = {
      name: currentSchool.school.name,
      shortName: currentSchool.school.shortName,
      logo: currentSchool.school.imgUrl || "/avatars/default-school.jpg"
    };
    
    return schoolInfo;
  }, [schoolsLoading, currentSchool, currentUser, subdomain]);

  return <AppSidebar school={schoolData} {...props} />;
}