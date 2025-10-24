"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { BookOpen, ClipboardCheck, Calendar, FileText, MessageSquare, Users } from "@repo/ui/icons";
import Link from "next/link";

export function TeacherQuickActions() {
  const quickActions = [
    {
      title: "Mis Clases",
      description: "Ver grupos y materias asignadas",
      icon: BookOpen,
      color: "bg-blue-500",
      href: "/administracion/clases",
    },
    {
      title: "Calificaciones",
      description: "Registrar y consultar calificaciones",
      icon: ClipboardCheck,
      color: "bg-green-500",
      href: "/evaluacion/calificaciones",
    },
    {
      title: "Horario",
      description: "Ver mi horario de clases",
      icon: Calendar,
      color: "bg-purple-500",
      href: "/administracion/asignacion-de-horarios",
    },
    {
      title: "Asistencia",
      description: "Tomar asistencia de estudiantes",
      icon: FileText,
      color: "bg-orange-500",
      href: "/evaluacion/asistencias",
    },
    {
      title: "Comunicados",
      description: "Enviar mensajes a padres",
      icon: MessageSquare,
      color: "bg-pink-500",
      href: "/",
    },
    {
      title: "Estudiantes",
      description: "Ver lista de alumnos",
      icon: Users,
      color: "bg-cyan-500",
      href: "/usuarios/alumnos",
    },
    {
      title: "Asignaciones",
      description: "Asignar y revisar asignaciones",
      icon: FileText,
      color: "bg-indigo-500",
      href: "/evaluacion/asignaciones",
    },
    {
      title: "Rúbricas",
      description: "Ver y gestionar rúbricas de evaluación",
      icon: FileText,
      color: "bg-teal-500",
      href: "/evaluacion/rubricas",
    },
  ];

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">Acciones Rápidas</h2>
        <p className="text-sm text-muted-foreground">
          Accede a tus herramientas de enseñanza
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action, index) => (
          <Link key={index} href={action.href}>
            <Card className="cursor-pointer transition-all hover:shadow-md">
              <CardHeader>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color}`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="mt-4">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

