"use client";

import { SidebarIcon } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/components/shadcn/breadcrumb";
import { Button } from "@repo/ui/components/shadcn/button";
import { Separator } from "@repo/ui/components/shadcn/separator";
import { useSidebar } from "@repo/ui/components/shadcn/sidebar";
import { NavUser } from "./nav-user";
import React from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { useUserWithConvex } from '../../stores/userStore';
import { useCurrentSchool } from '../../stores/userSchoolsStore';

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
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
  // console.log(pathname)
  
  // Mapeo de segmentos de path a textos amigables
  const pathSegmentLabels: Record<string, string> = {
    'inicio': 'Inicio',

    'perfil-institucional': 'Perfil institucional',
    'alumnos': 'Alumnos',
    'tutores': 'Tutores',
    'personal': 'Personal',
    'pagos': 'Pagos',
    'politicas-de-cobros': 'Políticas de Cobros',
    'suscripciones': 'Suscripciones',

    'aulas': 'Aulas',
    'materias': 'Materias',
    'grupos': 'Grupos',
    'horarios': 'Horarios',
    
    'ciclos-escolares': 'Ciclos Escolares',
    'calendario-escolar': 'Calendario Escolar',
    'periodos': 'Periodos',
    'clases': 'Clases',
    'asignacion-de-clases' : 'Asignación de Clases',
    'asignacion-de-horarios': 'Asignación de Horarios',

    'asistencias': 'Asistencias',
    'rubricas': 'Rúbricas',
    'asignaciones': 'Asignaciones',
    'calificaciones': 'Calificaciones',
    'calificaciones-periodos': 'Calificaciones por Periodo',

    'usuarios': 'Usuarios',
    'profesores': 'Profesores',
    'perfil': 'Perfil',
    'lista': 'Lista',
    'crear': 'Crear',
    'editar': 'Editar',
    'detalle': 'Detalle',
    'reportes': 'Reportes',
    'configuracion': 'Configuración',
  };

  // Extraer solo el último segmento del path y aplicar mapeo
  const getLastPathSegment = (path: string) => {
    // Remover la barra inicial si existe
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    // Si el path está vacío, devolver "inicio"
    if (!cleanPath) return pathSegmentLabels['inicio'] || 'Inicio';
    // Dividir por "/" y tomar el último segmento
    const segments = cleanPath.split('/');
    const lastSegment = segments[segments.length - 1];
    // Devolver el texto mapeado o el segmento original si no hay mapeo
    return lastSegment ? (pathSegmentLabels[lastSegment] || lastSegment) : 'Inicio';
  };
  
  const lastSegment = getLastPathSegment(pathname);

  const userHeader = userData || {
    name: "Usuario",
    email: "usuario@ejemplo.com",
    avatar: "/avatars/default-user.jpg",
  };
  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/inicio">{schoolData.name}</BreadcrumbLink>
            </BreadcrumbItem>
            
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{lastSegment}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="text-sm text-muted-foreground ml-auto">

        <NavUser user={userHeader} />
        </div>

        
      </div>
    </header>
  );
}
