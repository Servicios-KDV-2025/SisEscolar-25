"use client"

import * as React from "react"
import {
  Command,
  LifeBuoy,
  Send,
  SquareTerminal,
  Users,
} from "lucide-react"


import { NavMain } from "@repo/ui/components/nav-main"
import { NavSecondary } from "@repo/ui/components/nav-secondary"
import { NavUser } from "@repo/ui/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/components/shadcn/sidebar"


// Interfaz para los datos del usuario
interface UserData {
  name: string;
  email: string;
  avatar: string;
}

// Interfaz para los datos de la escuela
interface SchoolData {
  name: string;
  shortName: string;
  logo: string;
}

// Props del componente
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: UserData;
  school?: SchoolData;
}

const defaultNavData = {
  navMain: [
    {
      title: "Ciclos Escolares",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Ciclos Escolares",
          url: `/CiclosEscolares`,
        },
        {
          title: "Calendario Escolar",
          url: `/calendar`,
        },
        {
          title: "Clases por Alumno",
          url: `#`,
        },
        {
          title: "Grupos",
          url: `/grupos`,
        },
        {
          title: "Catalogo de Clases",
          url: `/catalogo-clases`,
        },
        {
          title: "Eventos Por Clase",
          url: `#`,
        },
        {
          title: "Eventos Escolares",
          url: `#`,
        },
      ],
    },
    {
      title: "Aulas",
      url: `/aulas`,
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Asistencia",
      url: `/attendance`,
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Materias",
      url: `/materias`,
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Departamentos",
      url: `/departamentos`,
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Personal",
      url: `/personal`,
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Periodos",
      url: `/periodos`,
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Horarios",
      url: `/schedule`,
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Horarios por Clase",
      url: `/horariosPorClase`,
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Alumnos",
      url: `/alumnos`,
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Calificaciones",
      url: `/calificaciones`,
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Calificaciones",
          url: `/calificaciones`,
        },
        {
          title: "Rúbricas",
          url: `/gradeRubic`,
        },
      ],
    },
    {
      title: "Padres",
      url: `/padres`,
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Usuarios",
      url: "#",
      icon: Users,
      isActive: true,
      items: [
        {
          title: "Gestión de Personal",
          url: `/usuarios/personal`,
        },
        {
          title: "Gestión de Tutores",
          url: `/usuarios/tutores`,
        },
        {
          title: "Gestión de Alumnos",
          url: `/usuarios/alumnos`,
        },
      ],
    },
    
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
}

export function AppSidebar({ user, school, ...props }: AppSidebarProps) {
  const [imageError, setImageError] = React.useState(false);
  
  // Usar datos del usuario pasados como props o valores por defecto
  const userData = user || {
    name: "Usuario",
    email: "usuario@ejemplo.com",
    avatar: "/avatars/default-user.jpg",
  };

  // Usar datos de la escuela pasados como props o valores por defecto
  const schoolData = school || {
    name: "Sistema Escolar",
    shortName: "Sistema",
    logo: "/avatars/default-school.jpg",
  };

  // Reset error when school changes
  React.useEffect(() => {
    setImageError(false);
  }, [schoolData.logo]);
  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                  {schoolData.logo && !imageError ? (
                    <img 
                      src={schoolData.logo} 
                      alt={schoolData.name}
                      className="size-8 object-cover rounded-lg"
                      onError={() => setImageError(true)}
                      onLoad={() => setImageError(false)}
                    />
                  ) : (
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                      <Command className="size-4" />
                    </div>
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium" title={schoolData.name}>
                    {schoolData.name}
                  </span>
                  <span className="truncate text-xs" title={schoolData.shortName}>
                    {schoolData.shortName}
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={defaultNavData.navMain} />
        <NavSecondary items={defaultNavData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
