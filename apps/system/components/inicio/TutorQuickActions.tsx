"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { BookOpen, Calendar, FileText, MessageSquare } from "@repo/ui/icons";
import { DollarSign } from "lucide-react";
import Link from "next/link";

export function TutorQuickActions() {
  const quickActions = [
    {
      title: "Calificaciones",
      description: "Ver boletas y promedios",
      icon: BookOpen,
      color: "bg-blue-500",
      href: "/evaluacion/calificaciones",
    },
    {
      title: "Horarios",
      description: "Ver horarios de clases",
      icon: Calendar,
      color: "bg-purple-500",
      href: "/administracion/clases",
    },
    {
      title: "Asistencia",
      description: "Ver el registro de asistencias",
      icon: FileText,
      color: "bg-orange-500",
      href: "/administracion/asistencia",
    },
    {
      title: "Mensajes",
      description: "Comunicación con profesores",
      icon: MessageSquare,
      color: "bg-pink-500",
      href: "/",
    },
    {
      title: "Pagos",
      description: "Estado de cuenta y pagos",
      icon: DollarSign,
      color: "bg-cyan-500",
      href: "/pagos/padre",
    },
    {
      title: "Eventos",
      description: "Calendario escolar",
      icon: Calendar,
      color: "bg-indigo-500",
      href: "/administracion/calendario-escolar",
    },
    {
      title: "Asignaciones",
      description: "Ver asignaciones de evaluación",
      icon: FileText,
      color: "bg-teal-500",
      href: "/evaluacion/asignaciones",
    },
  ];

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">Acciones Rápidas</h2>
        <p className="text-sm text-muted-foreground">
          Accede a la información de tus hijos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action, index) => (
          <Link key={index} href={action.href}>
            <Card className="cursor-pointer transition-all hover:shadow-md">
              <CardHeader>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color}`}
                >
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

