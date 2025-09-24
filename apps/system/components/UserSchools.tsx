"use client";

import React, { useState } from "react";
import { useUserSchoolsWithConvex } from "../stores/userSchoolsStore";
import { useUserWithConvex } from "../stores/userStore";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { Alert, AlertDescription } from "@repo/ui/components/shadcn/alert";
import { Badge } from "@repo/ui/components/shadcn/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Separator } from "@repo/ui/components/shadcn/separator";
import { useQuery } from "convex/react";
import { api } from "../../../packages/convex/convex/_generated/api";
import { Id } from "../../../packages/convex/convex/_generated/dataModel";
import {
  Building2,
  MapPin,
  Shield,
  Calendar,
  Globe,
  ExternalLink,
  UserCheck,
  Rocket,
  Ban,
  Hash,
  Lightbulb,
} from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";

interface UserSchoolsProps {
  clerkId?: string;
}

// Componente para mostrar estadísticas de una escuela
const SchoolStats: React.FC<{ schoolId: string }> = ({ schoolId }) => {
  const enrollmentStats = useQuery(
    api.functions.studentsClasses.getEnrollmentStatistics,
    { schoolId: schoolId as Id<"school"> }
  );

  const groups = useQuery(api.functions.group.getAllGroupsBySchool, {
    schoolId: schoolId as Id<"school">,
  });

  if (!enrollmentStats || !groups) {
    return (
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="flex flex-col items-center">
        <div className=" mb-1">
          <span className="text-lg font-bold">
            {enrollmentStats.totalStudents}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">Estudiantes</p>
      </div>
      <div className="flex flex-col items-center">
        <div className="  mb-1">
          <span className="text-lg font-bold">{groups.length}</span>
        </div>
        <p className="text-xs text-muted-foreground">Grupos</p>
      </div>
      <div className="flex flex-col items-center">
        <div className="  mb-1">
          <span className="text-lg font-bold">
            {enrollmentStats.totalClasses}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">Materias</p>
      </div>
    </div>
  );
};

export const UserSchools: React.FC<UserSchoolsProps> = ({ clerkId }) => {
  const { currentUser } = useUserWithConvex(clerkId);
  const { userSchools, isLoading, error } = useUserSchoolsWithConvex(
    currentUser?._id
  );

  const [showInactive, setShowInactive] = useState(true);

  // Separar escuelas activas e inactivas (basado en el estado de la escuela, no de la relación)
  const activeSchools = userSchools.filter(
    (userSchool) => userSchool.school.status === "active"
  );
  const inactiveSchools = userSchools.filter(
    (userSchool) => userSchool.school.status === "inactive"
  );

  // Filtrar escuelas según el estado
  const filteredSchools = showInactive ? userSchools : activeSchools;

  const handleGoToDashboard = (subdomain: string) => {
    const dashboardUrl = `http://${subdomain}.localhost:3000/inicio`;
    window.open(dashboardUrl, "_blank");
  };

  const getRoleBadgeVariant = (roles: string[]) => {
    if (roles.includes("superadmin")) return "destructive";
    if (roles.includes("admin")) return "default";
    if (roles.includes("auditor")) return "secondary";
    if (roles.includes("teacher")) return "outline";
    return "outline";
  };

  const getDepartmentIcon = (department?: string) => {
    switch (department) {
      case "secretary":
        return <Calendar className="h-3 w-3" />;
      case "direction":
        return <UserCheck className="h-3 w-3" />;
      case "schoolControl":
        return <Shield className="h-3 w-3" />;
      case "technology":
        return <ExternalLink className="h-3 w-3" />;
      default:
        return <Building2 className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Cargando escuelas...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentUser) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Usuario no encontrado</CardTitle>
          <CardDescription>
            No se pudo cargar la información del usuario.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Mensaje de error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header con mensaje de bienvenida */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  {/* Saludo personalizado como título principal */}
                  {currentUser ? (
                    <div>
                      <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
                        ¡Bienvenido, {currentUser.name}!
                      </h1>
                      <p className="text-lg text-muted-foreground">
                        {userSchools.length > 0
                          ? `Tienes acceso a ${userSchools.length} ${userSchools.length === 1 ? "escuela" : "escuelas"}. Selecciona una para comenzar a trabajar.`
                          : "Parece que aún no tienes escuelas asignadas. Contacta a tu administrador para obtener acceso."}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h1 className="text-4xl font-bold tracking-tight">
                        Mis Escuelas
                      </h1>
                      <p className="text-lg text-muted-foreground">
                        Panel de acceso a instituciones educativas
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {inactiveSchools.length > 0 && (
                <Button
                  variant={showInactive ? "outline" : "default"}
                  size="lg"
                  onClick={() => setShowInactive(!showInactive)}
                  className="gap-2 cursor-pointer "
                >
                  {showInactive ? "Ocultar inactivas" : "Mostrar inactivas"}
                </Button>
              )}
              <Button
                asChild
                className=" bg-red-500 hover:bg-red-600 text-white cursor-pointer"
              >
                <SignOutButton />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de escuelas */}
      {filteredSchools.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {showInactive
                ? "¡Excelente! No hay escuelas inactivas"
                : "Aún no tienes escuelas asignadas"}
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              {showInactive
                ? "Todas tus escuelas están activas y listas para usar. ¡Perfecto para comenzar a trabajar!"
                : "Para acceder al sistema escolar, necesitas que un administrador de eKardex te asigne a una o más instituciones educativas."}
            </p>
            {!showInactive && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>¿Necesitas ayuda?</strong> Contacta a tu coordinador
                    o al equipo de soporte de eKardex para solicitar acceso.
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchools.map((userSchool) => (
              <Card
                key={userSchool.userSchoolId}
                className="group hover:shadow-lg transition-all duration-300 relative"
              >
                {/* Badge de estado en la esquina */}
                <div className="absolute top-3 right-3 z-10">
                  <Badge
                    variant={
                      userSchool.school.status === "active"
                        ? "default"
                        : "secondary"
                    }
                    className={
                      userSchool.school.status === "active"
                        ? "bg-green-600 text-white"
                        : "bg-gray-600/70 text-white"
                    }
                  >
                    {userSchool.school.status === "active"
                      ? "Activo"
                      : "Inactivo"}
                  </Badge>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarImage
                        src={userSchool.school.imgUrl}
                        alt={userSchool.school.name}
                      />
                      <AvatarFallback className="bg-blue-500/10 text-blue-700 font-semibold">
                        {userSchool.school.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold truncate">
                        {userSchool.school.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 text-sm">
                        <Globe className="h-3 w-3" />
                        <span className="truncate">
                          {userSchool.school.subdomain}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Información básica */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">
                        {userSchool.school.address}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Hash className="h-3 w-3" />
                      <span className="font-mono text-xs">
                        {userSchool.school.cctCode}
                      </span>
                    </div>
                  </div>

                  {/* Roles */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Tus roles
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {userSchool.role.map((role) => (
                        <Badge
                          key={role}
                          variant={getRoleBadgeVariant([role])}
                          className="text-xs"
                        >
                          {role}
                        </Badge>
                      ))}
                    </div>
                    {userSchool.department && (
                      <Badge
                        variant="outline"
                        className="text-xs w-fit flex items-center gap-1"
                      >
                        {getDepartmentIcon(userSchool.department)}
                        <span>{userSchool.department}</span>
                      </Badge>
                    )}
                  </div>

                  {/* Estadísticas de la escuela */}
                  {userSchool.school.status === "active" && (
                    <>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                          Estadísticas
                        </p>
                        <SchoolStats schoolId={userSchool.school._id} />
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Acciones */}
                  {userSchool.school.status === "active" ? (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() =>
                          handleGoToDashboard(userSchool.school.subdomain)
                        }
                        className="w-full  gap-2 cursor-pointer"
                      >
                        <Rocket className="h-4 w-4" />
                        Ir al Dashboard
                      </Button>
                      {/* Información adicional en hover */}
                      <div className="text-xs text-muted-foreground space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div>
                          <span className="font-medium">Asignado:</span>{" "}
                          {new Date(userSchool.createdAt).toLocaleDateString(
                            "es-ES",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 px-3">
                      <Ban className="h-10 w-10 text-red-500 mx-auto mb-3" />
                      <p className="text-sm text-red-600 font-semibold mb-2">
                        Escuela Inactiva
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Esta escuela está temporalmente inactiva por falta de
                        pago o un problema técnico. Comunícate con la
                        administración de eKardex para más información.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
