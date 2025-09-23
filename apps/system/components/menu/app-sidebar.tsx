"use client"

import * as React from "react"
import {
  Command,
  Users,
  BanknoteArrowUp,
  MonitorCog,
  School,
  BellElectric,
  University,
  BookOpenCheck,
} from "lucide-react"
import Image from "next/image";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/components/shadcn/sidebar"
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import Link from "next/link";


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
  navGeneral: [
    {
      title: "Perfil institucional",
      url: `/perfil-institucional`,
      icon: University,
    },
    {
      title: "Gestión de Usuarios",
      icon: Users,
      url: "#",
      items: [
        {
          title: "Alumnos",
          url: `/usuarios/alumnos`,
        },
        {
          title: "Tutores",
          url: `/usuarios/tutores`,
        },
        {
          title: "Personal",
          url: `/usuarios/personal`,
        }
      ],
    },
    {
      title: "Inscripciones/Colegiaturas",
      url: `/inscripciones-colegiaturas`,
      icon: BanknoteArrowUp,
    },
    {
      title: "Plataforma",
      icon: MonitorCog,
      url: "#",
      items: [
        {
          title: "Subcripciones",
          url: `/plataforma/subcripciones`,
        },
      ],
    },

  ],
  navEscolar: [
    {
      title: "General",
      url: "#",
      icon: School,
      items: [
        {
          title: "Aulas",
          url: `/general/aulas`,
        },
        {
          title: "Materias",
          url: `/general/materias`,
        },
        {
          title: "Grupos",
          url: `/general/grupos`,
        },
        {
          title: "Horarios",
          url: `/general/horarios`,
        }
      ],
    },
    {
      title: "Administración",
      url: "#",
      icon: BellElectric,
      items: [
        {
          title: "Ciclos Escolares",
          url: `/administracion/ciclos-escolares`,
        },
        {
          title: "Calendario Escolar ",
          url: `/administracion/calendario-escolar`,
        },
        {
          title: "Periodos",
          url: `/administracion/periodos`,
        },
        {
          title: "Clases",
          url: `/administracion/clases`,
        },
        {
          title: "Asignación de Clases",
          url: `/administracion/asignacion-de-clases`,
        },
        {
          title: "Asignación de Horarios",
          url: `/administracion/asignacion-de-horarios`,
        },
      ],
    },
    {
      title: "Evaluación",
      icon: BookOpenCheck,
      url: "#",
      items: [
        {
          title: "Asistencias",
          url: `/evaluacion/asistencias`,
        },
        {
          title: "Rúbricas",
          url: `/evaluacion/rubricas`,
        },
        {
          title: "Asignaciones",
          url: `/evaluacion/asignaciones`,
        },
        {
          title: "Calificaciones",
          url: `/evaluacion/calificaciones`,
        },
        {
          title: "Calificaciones por Periodo",
          url: `/evaluacion/calificaciones-periodos`,
        },
      ],
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
              <Link href="/inicio">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                  {schoolData.logo && !imageError ? (
                    <Image
                      src={schoolData.logo}
                      alt={schoolData.name}
                      width={32} // tailwind size-8 = 2rem = 32px
                      height={32}
                      className="object-cover rounded-lg"
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
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={defaultNavData.navGeneral} title="General" />
        <NavMain items={defaultNavData.navEscolar} title="Control Escolar" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
