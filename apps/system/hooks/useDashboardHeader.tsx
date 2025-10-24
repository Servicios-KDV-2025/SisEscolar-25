import React from "react";
import { BookOpen, MapPin, Users } from "@repo/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/shadcn/tooltip";
import type { Id } from "@repo/convex/convex/_generated/dataModel";

interface User {
  _id: Id<"user">;
  name: string;
  lastName?: string;
}

interface SchoolData {
  name: string;
  description: string;
  shortName: string;
  address: string;
  cctCode: string;
  imgUrl: string;
  _id: string | null;
  status: "active" | "inactive";
}

interface CurrentSchool {
  userSchoolId: string;
  school: {
    _id: Id<"school">;
    name: string;
    description: string;
    shortName: string;
    address: string;
    cctCode: string;
    imgUrl?: string;
    status: "active" | "inactive";
  };
}

interface UseDashboardHeaderProps {
  currentRole: string | null;
  currentSchool: CurrentSchool | null;
  currentUser: User | null;
  clerkUser: any;
  teacherClasses: any[] | undefined;
  tutorStudents: any[] | undefined;
  ciclosEscolares: any[] | undefined;
  isLoading: boolean;
  schoolError: string | null;
}

export function useDashboardHeader({
  currentRole,
  currentSchool,
  currentUser,
  clerkUser,
  teacherClasses,
  tutorStudents,
  ciclosEscolares,
  isLoading,
  schoolError,
}: UseDashboardHeaderProps) {
  // Get header message based on role
  const getHeaderMessage = React.useMemo(() => {
    if (!currentRole || !currentSchool) return currentSchool?.school.name || "Cargando...";

    switch (currentRole) {
      case "superadmin":
      case "admin":
        return currentSchool?.school.name;
      case "teacher":
        return "Prof." + " " + (currentUser?.name || "") + " " + (currentUser?.lastName || "");
      case "tutor":
        return (currentUser?.name || "") + " " + (currentUser?.lastName || "");
      default:
        return currentSchool?.school.name;
    }
  }, [currentRole, currentSchool, currentUser]);

  // Get header subtitle based on role
  const getHeaderSubtitle = React.useMemo(() => {
    if (!currentRole || !currentSchool) return currentSchool?.school.name || "Cargando...";

    switch (currentRole) {
      case "superadmin":
      case "admin":
        return (
          <>
            <MapPin className="w-4 h-4" />
            <span>{currentSchool?.school.address}</span>{" "}
          </>
        );
      case "teacher": {
        if (!teacherClasses || teacherClasses.length === 0) {
          return <span className="text-muted-foreground">No tienes clases asignadas</span>;
        }
        const subjectNames = teacherClasses
          .map((c) => c.subject?.name)
          .slice(0, 3)
          .join(", ");

        const remaining = teacherClasses.length > 3 ? `+${teacherClasses.length - 3} más` : "";
        const allSubjects = teacherClasses.map((c) => c.subject?.name).join(", ");

        return (
          <>
            <BookOpen className="w-4 h-4" />
            <Tooltip>
              <TooltipTrigger>
                <span>
                  {subjectNames} {remaining}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{allSubjects}</p>
              </TooltipContent>
            </Tooltip>
          </>
        );
      }
      case "tutor": {
        if (!tutorStudents || tutorStudents.length === 0) {
          return <span className="text-muted-foreground">No tienes alumnos asignados</span>;
        }

        const studentsNames = tutorStudents
          .map((s) => `${s.name} ${s.lastName || ""}`.trim())
          .slice(0, 2)
          .join(", ");

        const remainingStudents = tutorStudents.length > 2 ? ` +${tutorStudents.length - 2} más` : "";

        return (
          <>
            <Users className="w-4 h-4" />
            <span>Hijos: {studentsNames}{remainingStudents}</span>
          </>
        );
      }

      default:
        return (
          <>
            <MapPin className="w-4 h-4" />
            <span>{currentSchool?.school.address}</span>
          </>
        );
    }
  }, [currentRole, currentSchool, teacherClasses, tutorStudents]);

  // Get header description based on role
  const getHeaderDescription = React.useMemo(() => {
    if (!currentRole || !currentSchool) return currentSchool?.school.description || "Cargando...";

    switch (currentRole) {
      case "superadmin":
      case "admin":
        return currentSchool?.school.description;
      case "teacher": {
        const activeCiclo = ciclosEscolares?.find((c) => c.status === "active");
        const cicloLabel = activeCiclo ? ` Ciclo Escolar ${activeCiclo.name}` : "";
        return (
          <>
            <span>{cicloLabel}</span>
          </>
        );
      }
      case "tutor":
        return tutorStudents && tutorStudents.length > 0
          ? "Tienes " + tutorStudents.length + " hijos inscritos"
          : "No tienes hijos inscritos";
      default:
        return currentSchool?.school.description;
    }
  }, [currentRole, currentSchool, tutorStudents, ciclosEscolares]);

  // Determine which image to show based on user role
  const getHeaderImage = React.useMemo(() => {
    if (!currentRole) return currentSchool?.school.imgUrl || "/avatars/default-school.jpg";

    if (currentRole === "teacher" || currentRole === "tutor") {
      return clerkUser?.imageUrl || "/avatars/default-user.jpg";
    }

    return currentSchool?.school.imgUrl || "/avatars/default-school.jpg";
  }, [currentRole, clerkUser?.imageUrl, currentSchool?.school.imgUrl]);

  // Prepare school data
  const schoolData: SchoolData = React.useMemo(() => {
    if (isLoading || (currentUser && !currentSchool && !schoolError)) {
      return {
        name: "Cargando...",
        description: "Cargando información de la escuela...",
        shortName: "Cargando",
        address: "Cargando dirección...",
        cctCode: "Cargando",
        imgUrl: "/avatars/default-school.jpg",
        _id: null,
        status: "active" as const,
      };
    }

    if (schoolError || (!currentSchool && currentUser && !isLoading)) {
      return {
        name: "Escuela no encontrada",
        description: "Escuela no encontrada o no disponible",
        shortName: "Error",
        address: "Dirección no disponible",
        cctCode: "N/A",
        imgUrl: "/avatars/default-school.jpg",
        _id: null,
        status: "inactive" as const,
      };
    }

    if (currentSchool) {
      return {
        name: currentSchool.school.name,
        description: currentSchool.school.description,
        shortName: currentSchool.school.shortName,
        address: currentSchool.school.address,
        cctCode: currentSchool.school.cctCode,
        imgUrl: currentSchool.school.imgUrl || "/avatars/default-school.jpg",
        _id: currentSchool.school._id,
        status: currentSchool.school.status,
      };
    }

    return {
      name: "Cargando...",
      description: "Cargando información de la escuela...",
      shortName: "Cargando",
      address: "Cargando dirección...",
      cctCode: "Cargando",
      imgUrl: "/avatars/default-school.jpg",
      _id: null,
      status: "active" as const,
    };
  }, [isLoading, schoolError, currentSchool, currentUser]);

  return {
    getHeaderMessage,
    getHeaderSubtitle,
    getHeaderDescription,
    getHeaderImage,
    schoolData,
  };
}

