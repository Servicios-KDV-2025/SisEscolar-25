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
  LucideIcon,
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
import Link from "next/link";
import { usePermissions, type UserRole } from "../../hooks/usePermissions";
import { useCurrentSchool } from "stores/userSchoolsStore"
import { useUserWithConvex } from "stores/userStore"
import { useUser } from "@clerk/nextjs"


// Interfaz para los datos de la escuela
interface SchoolData {
  name: string;
  shortName: string;
  logo: string;
}

// Props del componente
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  school?: SchoolData;
}

interface NavSubItem {
  title: string;
  url: string;
  allowedRoles?: UserRole[];
}

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  allowedRoles?: UserRole[];
  items?: NavSubItem[];
}

// Función para filtrar items por rol
function filterNavItemsByRole(
  items: NavItem[],
  currentRole: UserRole | null | undefined
): NavItem[] {
  if (!currentRole) return []; // Si no hay rol, no mostrar nada
  
  return items
    .map((item) => {
      // Si el item principal no tiene allowedRoles, se muestra a todos
      // Si tiene allowedRoles y el rol está incluido, se muestra
      const canShowItem = !item.allowedRoles || item.allowedRoles.includes(currentRole);
      
      if (!canShowItem) return null;
      
      // Filtrar sub-items si existen
      if (item.items && item.items.length > 0) {
        const filteredSubItems = item.items.filter((subItem: NavSubItem) => {
          // Si el sub-item no tiene allowedRoles, se muestra si el item padre se muestra
          // Si tiene allowedRoles, verificar si el rol está incluido
          return !subItem.allowedRoles || subItem.allowedRoles.includes(currentRole);
        });
        
        // Si después de filtrar quedan sub-items, incluir el item con sub-items filtrados
        if (filteredSubItems.length > 0) {
          return {
            ...item,
            items: filteredSubItems,
          };
        }
        // Si no quedan sub-items, no mostrar el item padre
        return null;
      }
      
      return item;
    })
    .filter((item): item is NavItem => item !== null); // Eliminar nulls
}

const defaultNavData: {
  navGeneral: NavItem[];
  navEscolar: NavItem[];
} = {
  navGeneral: [
    {
      title: "Perfil institucional",
      url: `/perfil-institucional`,
      icon: University,
      allowedRoles: ["superadmin", "admin", "auditor", "teacher", "tutor"] as UserRole[],
    },
    {
      title: "Gestión de Usuarios",
      icon: Users,
      url: "#",
      items: [
        {
          title: "Alumnos",
          url: `/usuarios/alumnos`,
          allowedRoles: ["superadmin", "admin", "auditor",  "tutor"],
        },
        {
          title: "Tutores",
          url: `/usuarios/tutores`,
          allowedRoles: ["superadmin", "admin", "auditor"],
        },
        {
          title: "Personal",
          url: `/usuarios/personal`,
          allowedRoles: ["superadmin", "admin", "auditor"],
        }
      ],
    },
    {
      title: "Pagos",
      icon: BanknoteArrowUp,
      url: "#",
      items: [
        {
          title: "Políticas de Cobros",
          url: `/pagos/politicas-de-cobros`,
          allowedRoles: ["superadmin", "admin", "auditor"],
        },
        {
          title: "Pagos",
          url: `/pagos`,
          allowedRoles: ["superadmin", "admin", "auditor", "tutor"],
        },
      ],
    },
    {
      title: "Plataforma",
      icon: MonitorCog,
      url: "#",
      items: [
        {
          title: "Suscripciones",
          url: `/plataforma/suscripciones`,
          allowedRoles: ["superadmin"],
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
          allowedRoles: ["superadmin", "admin", "auditor"],
        },
        {
          title: "Materias",
          url: `/general/materias`,
          allowedRoles: ["superadmin", "admin", "auditor"],
        },
        {
          title: "Grupos",
          url: `/general/grupos`,
          allowedRoles: ["superadmin", "admin", "auditor"],
        },
        {
          title: "Horarios",
          url: `/general/horarios`,
          allowedRoles: ["superadmin", "admin", "auditor"],
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
          allowedRoles: ["superadmin", "admin", "auditor"],
        },
        {
          title: "Calendario Escolar ",
          url: `/administracion/calendario-escolar`,
          allowedRoles: ["superadmin", "admin", "auditor","teacher","tutor"],
        },
        {
          title: "Periodos",
          url: `/administracion/periodos`,
          allowedRoles: ["superadmin", "admin", "auditor","teacher"],
        },
        {
          title: "Clases",
          url: `/administracion/clases`,
          allowedRoles: ["superadmin", "admin", "auditor"],
        },
        {
          title: "Asignación de Clases",
          url: `/administracion/asignacion-de-clases`,
          allowedRoles: ["superadmin", "admin", "auditor","teacher","tutor"],
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
          allowedRoles: ["superadmin", "admin", "auditor","teacher","tutor"],
        },
        {
          title: "Rúbricas",
          url: `/evaluacion/rubricas`,
          allowedRoles: ["superadmin", "admin", "auditor","teacher","tutor"],
        },
        {
          title: "Asignaciones",
          url: `/evaluacion/asignaciones`,
          allowedRoles: ["teacher","tutor"],
        },
        {
          title: "Calificaciones",
          url: `/evaluacion/calificaciones`,
          allowedRoles: ["superadmin", "admin", "auditor","teacher","tutor"],
        },
        {
          title: "Calificaciones por Periodo",
          url: `/evaluacion/calificaciones-periodos`,
          allowedRoles: ["superadmin", "admin", "auditor","teacher","tutor"],
        },
      ],
    },
  ],
} as {
  navGeneral: NavItem[];
  navEscolar: NavItem[];
};

export function AppSidebar({  school, ...props }: AppSidebarProps) {
  const [imageError, setImageError] = React.useState(false);

  const { user: clerkUser } = useUser();
  const { currentUser } = useUserWithConvex(clerkUser?.id);
  const { currentSchool } = useCurrentSchool(currentUser?._id);
  const permissions = usePermissions(currentSchool?.school._id);
  const currentRole = permissions.currentRole;
  
  const filteredNavGeneral = React.useMemo(() => {
    return filterNavItemsByRole(defaultNavData.navGeneral, currentRole);
  }, [currentRole]);

  const filteredNavEscolar = React.useMemo(() => {
    return filterNavItemsByRole(defaultNavData.navEscolar, currentRole);
  }, [currentRole]);


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
                      unoptimized={true}
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
        <NavMain items={filteredNavGeneral} title="General" />
        <NavMain items={filteredNavEscolar} title="Control Escolar" />
      </SidebarContent>
      <SidebarFooter>
      </SidebarFooter>
    </Sidebar>
  )
}
