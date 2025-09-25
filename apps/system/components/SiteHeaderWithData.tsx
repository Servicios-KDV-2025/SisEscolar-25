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
    subdomain,
    isLoading: schoolLoading,
  } = useCurrentSchool(currentUser?._id);

  // Preparar datos del usuario para el header (misma lógica que AppSidebarWithData)
  const userData = React.useMemo(() => {
    // Si no están cargados los datos de Clerk, mostrar loading
    if (!isLoaded || userLoading) {
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
  }, [isLoaded, userLoading, clerkUser, currentUser]);

  // Preparar datos de la escuela para el header (misma lógica que AppSidebarWithData)
  const schoolData = React.useMemo(() => {
    // Mostrar loading mientras carga
    if (schoolLoading || !currentUser || !subdomain) {
      return {
        name: "Cargando escuela...",
        shortName: "Cargando"
      };
    }

    // Si no hay escuela después de cargar
    if (!currentSchool) {
      return {
        name: "Escuela no encontrada",
        shortName: "Error"
      };
    }

    // Datos reales de la escuela
    return {
      name: currentSchool.school.name,
      shortName: currentSchool.school.shortName
    };
  }, [schoolLoading, currentSchool, currentUser, subdomain]);

  return (
    <SiteHeader 
      schoolName={schoolData.name}
      pathname={pathname}
      user={userData}
    />
  );
}