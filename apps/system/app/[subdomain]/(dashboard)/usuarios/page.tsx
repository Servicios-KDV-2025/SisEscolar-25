"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { Button } from "@repo/ui/components/shadcn/button";
import { Users, Shield, Building2, BookOpen, Search as SearchIcon, ArrowRight } from "@repo/ui/icons";
import Link from "next/link";

export default function UsuariosPage() {
  // Configuración de las opciones de gestión de usuarios
  const userManagementOptions = [
    {
      title: "Gestión de Personal",
      description: "Vista unificada para administrar todo el personal del sistema",
      icon: Users,
      href: "/usuarios/personal",
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      recommended: true
    },
    {
      title: "Super-Administradores",
      description: "Usuarios con acceso completo sin restricciones",
      icon: Shield,
      href: "/usuarios/super-administrador",
      color: "bg-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-700"
    },
    {
      title: "Administradores",
      description: "Usuarios con acceso administrativo departamental",
      icon: Building2,
      href: "/usuarios/administradores",
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700"
    },
    {
      title: "Auditores",
      description: "Usuarios con acceso de auditoría y verificación",
      icon: SearchIcon,
      href: "/usuarios/auditores",
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-700"
    },
    {
      title: "Docentes",
      description: "Usuarios con acceso de enseñanza y evaluación",
      icon: BookOpen,
      href: "/usuarios/docentes",
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700"
    },
    {
      title: "Tutores",
      description: "Usuarios con acceso a información de alumnos",
      icon: Users,
      href: "/usuarios/tutores",
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700"
    }
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative p-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Users className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Gestión de Usuarios</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Selecciona el tipo de gestión de usuarios que necesitas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Opciones de gestión */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userManagementOptions.map((option, index) => (
          <Card 
            key={index} 
            className={`relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer ${option.recommended ? 'ring-2 ring-blue-200 shadow-md' : ''}`}
          >
            <Link href={option.href}>
              <CardHeader className={`${option.bgColor} pb-4`}>
                <div className="flex items-center justify-between">
                  <div className={`p-3 ${option.color} rounded-xl text-white`}>
                    <option.icon className="h-6 w-6" />
                  </div>
                  {option.recommended && (
                    <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Recomendado
                    </div>
                  )}
                </div>
                <CardTitle className={`${option.textColor} text-lg`}>
                  {option.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between group-hover:bg-primary/5 transition-colors"
                >
                  <span>Ir a gestión</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* Información adicional */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recomendación
          </CardTitle>
          <CardDescription>
            Para una gestión más eficiente, te recomendamos usar la <strong>Gestión de Personal</strong> 
            que te permite administrar todos los tipos de usuarios desde una sola vista con filtros avanzados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/usuarios/personal">
            <Button className="gap-2">
              <Users className="h-4 w-4" />
              Ir a Gestión de Personal
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}