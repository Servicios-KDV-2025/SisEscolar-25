"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { BookOpen, Users, Calendar, BarChart3, Settings, GraduationCap, MapPin, Shield, Award, School } from "@repo/ui/icons";
import { useUser } from "@clerk/nextjs";
import { Button } from "@repo/ui/components/shadcn/button";
import { useUserWithConvex } from "../../../../stores/userStore";
import { useCurrentSchool } from "../../../../stores/userSchoolsStore";
import { usePermissions } from "../../../../hooks/usePermissions";
import { useCicloEscolarWithConvex } from "../../../../stores/useSchoolCiclesStore";
import { useQuery } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";


export default function EscuelaHome() {
  // Get current user from Clerk
  const { user: clerkUser, isLoaded } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);
  
  // Get current school information using the subdomain
  const {
    currentSchool,
    subdomain,
    isLoading: schoolLoading,
    error: schoolError,
  } = useCurrentSchool(currentUser?._id);

  // Get user permissions for current school
  const {
    permissions,
    isLoading: permissionsLoading,
    canCreateUsers,
    canReadUsers,
    canUpdateUsers,
    canDeleteUsers,
    isSuperAdmin,
    isAdmin,
    isTutor,
    highestRole
  } = usePermissions(currentSchool?.school._id);

  // Get school cycles for current school
  const { ciclosEscolares } = useCicloEscolarWithConvex(currentSchool?.school._id);

  // Get enrollment statistics for current school
  const enrollmentStats = useQuery(
    api.functions.studentsClasses.getEnrollmentStatistics,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : "skip"
  );

  // Get teachers/staff count for current school
  const teachersData = useQuery(
    api.functions.schools.getUsersBySchoolAndRoles,
    currentSchool?.school._id ? { 
      schoolId: currentSchool.school._id,
      roles: ["teacher", "admin", "superadmin"],
      status: "active"
    } : "skip"
  );

  // Combined loading state
  const isLoading = !isLoaded || userLoading || schoolLoading || permissionsLoading;

  // Calculate real statistics (debe estar antes del return temprano)
  const stats = React.useMemo(() => {
    const activeStudents = enrollmentStats?.totalStudents || 0;
    const teachersCount = teachersData?.length || 0;
    const totalClasses = enrollmentStats?.totalClasses || 0;
    const schoolCycles = ciclosEscolares?.length || 0;

    return [
      {
        title: "Estudiantes Activos",
        value: activeStudents.toLocaleString(),
        icon: GraduationCap,
        trend: enrollmentStats ? `${enrollmentStats.activeEnrollments} inscripciones activas` : "Cargando..."
      },
      {
        title: "Profesores",
        value: teachersCount.toString(),
        icon: Users,
        trend: teachersCount > 0 ? "Personal activo" : "Sin personal registrado"
      },
      {
        title: "Materias Activas",
        value: totalClasses.toString(),
        icon: BookOpen,
        trend: totalClasses > 0 ? "Clases disponibles" : "Sin clases registradas"
      },
      {
        title: "Ciclos Escolares",
        value: schoolCycles.toString(),
        icon: Calendar,
        trend: schoolCycles > 0 ? `${ciclosEscolares?.filter(c => c.status === 'active').length || 0} activos` : "Sin ciclos registrados"
      }
    ];
  }, [enrollmentStats, teachersData, ciclosEscolares]);

  const quickActions = [
    {
      title: "Gestión de Alumnos",
      description: "Administrar estudiantes y expedientes",
      icon: Users,
      href: "/estudiantes",
      color: "bg-blue-500"
    },
    {
      title: "Calificaciones",
      description: "Revisar y actualizar calificaciones",
      icon: BarChart3,
      href: "/calificaciones",
      color: "bg-green-500"
    },
    {
      title: "Horarios",
      description: "Programar clases y eventos",
      icon: Calendar,
      href: "/schedule",
      color: "bg-purple-500"
    },
    {
      title: "Materias",
      description: "Administrar cursos y materias",
      icon: BookOpen,
      href: "/materias",
      color: "bg-orange-500"
    }
  ];

  // Prepare school data with loading and error states
  const schoolData = React.useMemo(() => {
    // Loading state - incluye cuando currentUser existe pero currentSchool aún no
    if (isLoading || (currentUser && !currentSchool && !schoolError)) {
      return {
        name: "Cargando...",
        description: "Cargando información de la escuela...",
        shortName: "Cargando",
        address: "Cargando dirección...",
        cctCode: "Cargando",
        imgUrl: "/avatars/default-school.jpg",
        _id: null,
        status: 'active' as const
      };
    }

    // Error or no school found - solo después de que ya terminó de cargar
    if (schoolError || (!currentSchool && currentUser && !isLoading)) {
      return {
        name: "Escuela no encontrada",
        description: "Escuela no encontrada o no disponible",
        shortName: "Error",
        address: "Dirección no disponible",
        cctCode: "N/A",
        imgUrl: "/avatars/default-school.jpg",
        _id: null,
        status: 'inactive' as const
      };
    }

    // Valid school data
    if (currentSchool) {
      return {
        name: currentSchool.school.name,
        description: currentSchool.school.description,
        shortName: currentSchool.school.shortName,
        address: currentSchool.school.address,
        cctCode: currentSchool.school.cctCode,
        imgUrl: currentSchool.school.imgUrl || "/avatars/default-school.jpg",
        _id: currentSchool.school._id,
        status: currentSchool.school.status
      };
    }

    // Fallback para casos no contemplados
    return {
      name: "Cargando...",
      description: "Cargando información de la escuela...",
      shortName: "Cargando",
      address: "Cargando dirección...",
      cctCode: "Cargando",
      imgUrl: "/avatars/default-school.jpg",
      _id: null,
      status: 'active' as const
    };
  }, [isLoading, schoolError, currentSchool, currentUser]);

  // Show loading screen for initial load
  if (isLoading || (currentUser && !currentSchool && !schoolError)) {
    return (
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="space-y-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Cargando información de la escuela...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 w-full">
      
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
                {schoolData.imgUrl && schoolData.imgUrl !== "/avatars/default-school.jpg" ? (
                  <div className="relative w-[120px] h-[120px] rounded-2xl shadow-lg ring-1 ring-white/20 overflow-hidden">
                    <Image
                      src={schoolData.imgUrl}
                      alt="Logo de la escuela"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative w-[100px] h-[100px] bg-primary/10 rounded-2xl shadow-lg ring-1 ring-white/20 flex items-center justify-center">
                    <School className="w-12 h-12 text-primary/70" />
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold tracking-tight">{schoolData.name}</h1>
                  <Badge 
                    variant={schoolData.status === 'active' ? 'secondary' : 'destructive'} 
                    className="text-xs bg-green-600 text-white -mb-2"
                  >
                    {schoolData.status === 'active' ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                {schoolData.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{schoolData.address}</span>
                  </div>
                )}
                <p className="text-lg text-muted-foreground max-w-2xl">
                  {/* Plataforma integral de gestión educativa para administrar estudiantes,
                  calificaciones, horarios y recursos académicos de manera eficiente. */}
                  {schoolData.description}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="gap-2">
                <Settings className="w-4 h-4" />
                Configuración
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Acciones Rápidas</h2>
            <p className="text-muted-foreground">Accede a las funciones principales del sistema</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Card key={index} className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${action.color} text-white group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {action.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {action.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}