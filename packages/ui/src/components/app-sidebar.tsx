"use client"

import * as React from "react"
import {
  Command,
  LifeBuoy,
  Send,
  SquareTerminal,
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

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Ciclos Escolares",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Ciclos Escolares",
          url: `#`,
        },
        {
          title: "Calendario Escolar",
          url: `#`,
        },
        {
          title: "Clases por Alumno",
          url: `#`,
        },
        {
          title: "Grupos",
          url: `#`,
        },
        {
          title: "Catalogo de Clases",
          url: `#`,
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
      title: "Salones",
      url: `#`,
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
      url: `/horarios`,
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
      ],
    },
    {
      title: "Padres",
      url: `/padres`,
      icon: SquareTerminal,
      isActive: true,
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Acme Inc</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
