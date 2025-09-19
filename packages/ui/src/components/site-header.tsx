"use client";

import { SidebarIcon } from "lucide-react";

import { SearchForm } from "@repo/ui/components/search-form";
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

interface SiteHeaderProps {
  schoolName: string;
  pathname: string;
}

export function SiteHeader({
  schoolName,
  pathname,
}: SiteHeaderProps) {
  const { toggleSidebar } = useSidebar();
  console.log(pathname)
  
  // Mapeo de segmentos de path a textos amigables
  const pathSegmentLabels: Record<string, string> = {
    'inicio': 'Inicio',
    'usuarios': 'Usuarios',
    'personal': 'Personal',
    'estudiantes': 'Estudiantes',
    'profesores': 'Profesores',
    'materias': 'Materias',
    'clases': 'Clases',
    'horarios': 'Horarios',
    'calificaciones': 'Calificaciones',
    'reportes': 'Reportes',
    'configuracion': 'Configuración',
    'perfil': 'Perfil',
    'lista': 'Lista',
    'crear': 'Crear',
    'editar': 'Editar',
    'detalle': 'Detalle',
    'clasesPorAlumnos': 'Clases por Alumnos',
    'CiclosEscolares': 'Ciclos Escolares',
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
              <BreadcrumbLink href="/inicio">{schoolName}</BreadcrumbLink>
            </BreadcrumbItem>
            
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{lastSegment}</BreadcrumbPage>
            </BreadcrumbItem>
            
          </BreadcrumbList>
        </Breadcrumb>
        <SearchForm className="w-full sm:ml-auto sm:w-auto" />
      </div>
    </header>
  );
}
