'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { AppSidebar } from '@repo/ui/components/app-sidebar';
import { useUserWithConvex } from '../stores/userStore';
import { useCurrentSchool } from '../stores/userSchoolsStore';

export function AppSidebarWithData({ ...props }: React.ComponentProps<typeof AppSidebar>) {
  const { user: clerkUser, isLoaded } = useUser();
  const { currentUser, isLoading } = useUserWithConvex(clerkUser?.id);
  
  // Usar el hook que detecta automáticamente el subdominio desde params
  const {
    currentSchool,
    subdomain,
    isLoading: schoolsLoading,
    error,
  } = useCurrentSchool(currentUser?._id);



  // Preparar datos del usuario para el sidebar
  const userData = React.useMemo(() => {
    // Si no están cargados los datos de Clerk, mostrar loading
    if (!isLoaded || isLoading) {
      return {
        name: "Cargando...",
        email: "cargando@example.com",
        avatar: "/avatars/default-user.jpg"
      };
    }

    // Si no hay usuario autenticado
    if (!clerkUser) {
      return {
        name: "No autenticado",
        email: "guest@example.com",
        avatar: "/avatars/default-user.jpg"
      };
    }

    // Combinar datos de Clerk y Convex
    return {
      name: currentUser?.name || clerkUser.fullName || clerkUser.firstName || "Usuario",
      email: currentUser?.email || clerkUser.primaryEmailAddress?.emailAddress || "usuario@example.com",
      avatar: currentUser?.imgUrl || clerkUser.imageUrl || "/avatars/default-user.jpg"
    };
  }, [isLoaded, isLoading, clerkUser, currentUser]);

  // Preparar datos de la escuela para el sidebar
  const schoolData = React.useMemo(() => {
    console.log('Preparando schoolData - isLoading:', schoolsLoading, 'currentSchool:', currentSchool);
    
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
    
    console.log('School data final:', schoolInfo);
    return schoolInfo;
  }, [schoolsLoading, currentSchool, currentUser, subdomain]);

  return <AppSidebar user={userData} school={schoolData} {...props} />;
}
