"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import {
  BookOpen,
  Users,
  Calendar,
  BarChart3,
  GraduationCap,
} from "@repo/ui/icons";
import { useUser } from "@clerk/nextjs";
import { useUserWithConvex } from "../../../../stores/userStore";
import { useCurrentSchool } from "../../../../stores/userSchoolsStore";
import { usePermissions } from "../../../../hooks/usePermissions";
import { useCicloEscolarWithConvex } from "../../../../stores/useSchoolCiclesStore";
import { useQuery } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";
import {
  DashboardHeader,
  TeacherDashboard,
  TutorDashboard,
  convertTo12HourFormat,
  getRelativeTime,
} from "../../../../components/inicio";
import { useDashboardHeader } from "../../../../hooks/useDashboardHeader";
import { useTeacherDashboard } from "../../../../hooks/useTeacherDashboard";
import { useTutorDashboard } from "../../../../hooks/useTutorDashboard";
import { GeneralDashboardSkeleton } from "../../../../components/skeletons/GeneralDashboardSkeleton";

export default function EscuelaHome() {
  // Get current user from Clerk
  const { user: clerkUser, isLoaded } = useUser();
  const { currentUser, isLoading: userLoading } = useUserWithConvex(clerkUser?.id);

  // Get current school information
  const { currentSchool, isLoading: schoolLoading, error: schoolError } = useCurrentSchool(currentUser?._id);

  // Get user permissions
  const { isLoading: permissionsLoading, canReadInicioInfo, currentRole } = usePermissions(currentSchool?.school._id);

  // Get school cycles
  const { ciclosEscolares } = useCicloEscolarWithConvex(currentSchool?.school._id);

  // Combined loading state
  const isLoading = !isLoaded || userLoading || schoolLoading || permissionsLoading;

  // Queries needed for header (shared across roles)
  const teacherClasses = useQuery(
    api.functions.classCatalog.getAllClassCatalog,
    currentSchool && currentUser && currentRole === "teacher"
      ? {
        schoolId: currentSchool.school._id,
        canViewAll: false,
        teacherId: currentUser._id,
      }
      : "skip"
  );

  const tutorStudents = useQuery(
    api.functions.student.getStudentsByTutor,
    currentSchool && currentUser && currentRole === "tutor"
      ? {
        schoolId: currentSchool.school._id,
        tutorId: currentUser._id,
      }
      : "skip"
  );

  // Queries for admin stats
  const enrollmentStats = useQuery(
    api.functions.studentsClasses.getEnrollmentStatistics,
    currentSchool?.school._id ? { schoolId: currentSchool.school._id } : "skip"
  );

  const teachersData = useQuery(
    api.functions.schools.getUsersBySchoolAndRoles,
    currentSchool?.school._id
      ? {
        schoolId: currentSchool.school._id,
        roles: ["teacher", "admin", "superadmin"],
        status: "active",
      }
      : "skip"
  );

  // Use custom hooks for role-specific dashboard data
  const headerData = useDashboardHeader({
    currentRole,
    currentSchool,
    currentUser,
    clerkUser,
    teacherClasses,
    tutorStudents,
    ciclosEscolares,
    isLoading,
    schoolError,
  });

  const teacherData = useTeacherDashboard({
    currentSchool,
    currentUser,
    currentRole,
    ciclosEscolares,
  });

  const tutorData = useTutorDashboard({
    currentSchool,
    currentUser,
    currentRole,
    ciclosEscolares,
  });

  // Admin stats calculation
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
        trend: enrollmentStats
          ? `${enrollmentStats.activeEnrollments} inscripciones activas`
          : "Cargando...",
      },
      {
        title: "Profesores",
        value: teachersCount.toString(),
        icon: Users,
        trend: teachersCount > 0 ? "Personal activo" : "Sin personal registrado",
      },
      {
        title: "Materias Activas",
        value: totalClasses.toString(),
        icon: BookOpen,
        trend: totalClasses > 0 ? "Clases disponibles" : "Sin clases registradas",
      },
      {
        title: "Ciclos Escolares",
        value: schoolCycles.toString(),
        icon: Calendar,
        trend:
          schoolCycles > 0
            ? `${ciclosEscolares?.filter((c) => c.status === "active").length || 0} activos`
            : "Sin ciclos registrados",
      },
    ];
  }, [enrollmentStats, teachersData, ciclosEscolares]);

  const quickActions = [
    {
      title: "Gestión de Alumnos",
      description: "Administrar estudiantes y expedientes",
      icon: Users,
      href: "/estudiantes",
      color: "bg-blue-500",
    },
    {
      title: "Calificaciones",
      description: "Revisar y actualizar calificaciones",
      icon: BarChart3,
      href: "/calificaciones",
      color: "bg-green-500",
    },
    {
      title: "Horarios",
      description: "Programar clases y eventos",
      icon: Calendar,
      href: "/schedule",
      color: "bg-purple-500",
    },
    {
      title: "Materias",
      description: "Administrar cursos y materias",
      icon: BookOpen,
      href: "/materias",
      color: "bg-orange-500",
    },
  ];

  // Show loading screen for initial load
  if (isLoading || (currentUser && !currentSchool && !schoolError)) {
    return <GeneralDashboardSkeleton role={currentRole ?? undefined} />;
  }

  return (
    <div className="space-y-8 p-6 w-full">
      <DashboardHeader
        schoolData={headerData.schoolData}
        getHeaderMessage={headerData.getHeaderMessage}
        getHeaderSubtitle={headerData.getHeaderSubtitle}
        getHeaderDescription={headerData.getHeaderDescription}
        getHeaderImage={headerData.getHeaderImage}
        currentRole={currentRole}
      />

      {canReadInicioInfo ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
              >
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
                <h2 className="text-2xl font-semibold tracking-tight">
                  Acciones Rápidas
                </h2>
                <p className="text-muted-foreground">
                  Accede a las funciones principales del sistema
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <Card
                  key={index}
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div
                        className={`p-3 rounded-xl ${action.color} text-white group-hover:scale-110 transition-transform duration-300`}
                      >
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
        </>
      ) : (
        <div className="w-full space-y-8">
          {currentRole === "teacher" ? (
            <TeacherDashboard
              activeClassesCount={teacherData.activeTeacherClassesCount}
              uniqueGroupsCount={teacherData.uniqueTeacherGroups}
              uniqueStudentsCount={teacherData.teacherUniqueStudents}
              pendingAssignmentsCount={teacherData.pendingAssignmentsCount}
              nextClass={teacherData.nextClass}
              todaySchedule={teacherData.todaySchedule}
              todayDateFormatted={teacherData.todayDateFormatted}
              convertTo12HourFormat={convertTo12HourFormat}
            />
          ) : currentRole === "tutor" ? (
            <TutorDashboard
              studentsWithStats={tutorData.studentsWithStats}
              recentActivity={tutorData.recentActivity}
              formattedUpcomingEvents={tutorData.formattedUpcomingEvents}
              getRelativeTime={getRelativeTime}
            />
          ) : (
            <>
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">
                  Nuestra Escuela
                </h2>
                <p className="text-muted-foreground text-lg">
                  {headerData.schoolData.description ||
                    "Aún no se ha definido la visión o descripción de la escuela."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 space-y-3">
                  <CardHeader>
                    <CardTitle className="text-xl">Visión</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {headerData.schoolData.description ||
                        "Nuestra visión aún no ha sido definida."}
                    </p>
                  </CardContent>
                </Card>

                <Card className="p-6 space-y-3">
                  <CardHeader>
                    <CardTitle className="text-xl">Misión</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {headerData.schoolData.description ||
                        "Nuestra misión aún no ha sido definida."}
                    </p>
                  </CardContent>
                </Card>

                <Card className="p-6 space-y-3">
                  <CardHeader>
                    <CardTitle className="text-xl">Valores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {headerData.schoolData.description ||
                        "Los valores de la institución aún no se han registrado."}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Dirección: {headerData.schoolData.address || "No disponible"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Clave CCT: {headerData.schoolData.cctCode || "No disponible"}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

