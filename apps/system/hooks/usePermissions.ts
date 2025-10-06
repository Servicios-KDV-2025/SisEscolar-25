import { useUserStore } from "../stores/userStore";
import { useUserSchoolsWithConvex } from "../stores/userSchoolsStore";
import { useActiveRole } from "./useActiveRole";
import React, { useState, useEffect, useMemo } from "react";

export type UserRole = "superadmin" | "admin" | "auditor" | "teacher" | "tutor";

export const usePermissions = (schoolId?: string) => {
  const { currentUser } = useUserStore();
  const { userSchools, isLoading: schoolsLoading } = useUserSchoolsWithConvex(
    currentUser?._id
  );
  const {
    activeRole,
    availableRoles,
    isLoading: roleLoading,
    error: roleError,
  } = useActiveRole();

  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Definir todos los recursos y acciones disponibles
  const actionsResources = [
    { action: "create", resource: "users" },
    { action: "read", resource: "users" },
    { action: "update", resource: "users" },
    { action: "delete", resource: "users" },
    //Aulas
    { action: "create", resource: "classroom" },
    { action: "read", resource: "classroom" },
    { action: "update", resource: "classroom" },
    { action: "delete", resource: "classroom" },
    // Materias
    { action: "create", resource: "subject" },
    { action: "read", resource: "subject" },
    { action: "update", resource: "subject" },
    { action: "delete", resource: "subject" },
    // Grupos
    { action: "create", resource: "group" },
    { action: "read", resource: "group" },
    { action: "update", resource: "group" },
    { action: "delete", resource: "group" },
    // Horarios
    { action: "create", resource: "schedule" },
    { action: "read", resource: "schedule" },
    { action: "update", resource: "schedule" },
    { action: "delete", resource: "schedule" },
    // Ciclos Escolares
    { action: "create", resource: "schoolCycle" },
    { action: "read", resource: "schoolCycle" },
    { action: "update", resource: "schoolCycle" },
    { action: "delete", resource: "schoolCycle" },
    // Calendario Escolar
    { action: "create", resource: "calendar" },
    { action: "read", resource: "calendar" },
    { action: "update", resource: "calendar" },
    { action: "delete", resource: "calendar" },
    // Periodos
    { action: "create", resource: "term" },
    { action: "read", resource: "term" },
    { action: "update", resource: "term" },
    { action: "delete", resource: "term" },

    //Class Catalog
    { action: "create", resource: "classCatalog" },
    { action: "read", resource: "classCatalog" },
    { action: "update", resource: "classCatalog" },
    { action: "delete", resource: "classCatalog" },
    //Students Classes
    { action: "create", resource: "studentsClasses" },
    { action: "read", resource: "studentsClasses" },
    { action: "update", resource: "studentsClasses" },
    { action: "delete", resource: "studentsClasses" },
    //Schedule Assignment
    { action: "create", resource: "scheduleAssignament" },
    { action: "read", resource: "scheduleAssignament" },
    { action: "update", resource: "scheduleAssignament" },
    { action: "delete", resource: "scheduleAssignament" },
    // Attendance
    { action: "create", resource: "attendance" },
    { action: "read", resource: "attendance" },
    { action: "update", resource: "attendance" },
    { action: "delete", resource: "attendance" },
    // Rubrics
    { action: "create", resource: "rubrics" },
    { action: "read", resource: "rubrics" },
    { action: "update", resource: "rubrics" },
    { action: "delete", resource: "rubrics" },
    // Attendance
    { action: "create", resource: "assignance" },
    { action: "read", resource: "assignance" },
    { action: "update", resource: "assignance" },
    { action: "delete", resource: "assignance" },
  ];


  // Definir permisos por rol (basado en tu sistema actual)
  const rolePermissions: Record<UserRole, Record<string, boolean>> = {
    superadmin: {
      // Superadmin tiene TODOS los permisos
      "create:users": true,
      "read:users": true,
      "update:users": true,
      "delete:users": true,

      //Aulas
      "create:classroom": true,
      "read:classroom": true,
      "update:classroom": true,
      "delete:classroom": true,
      // Materias
      "create:subject": true,
      "read:subject": true,
      "update:subject": true,
      "delete:subject": true,
      // Grupos
      "create:group": true,
      "read:group": true,
      "update:group": true,
      "delete:group": true,
      // Horarios
      "create:schedule": true,
      "read:schedule": true,
      "update:schedule": true,
      "delete:schedule": true,
      // Ciclos Escolares
      "create:schoolCycle": true,
      "read:schoolCycle": true,
      "update:schoolCycle": true,
      "delete:schoolCycle": true,
      // Calendario Escolar
      "create:calendar": true,
      "read:calendar": true,
      "update:calendar": true,
      "delete:calendar": true,
      // Periodos
      "create:term": true,
      "read:term": true,
      "update:term": true,
      "delete:term": true,

      //Class Catalog
      "create:classCatalog": true,
      "read:classCatalog": true,
      "update:classCatalog": true,
      "delete:classCatalog": true,
      //Students Classes
      "create:studentsClasses": true,
      "read:studentsClasses": true,
      "update:studentsClasses": true,
      "delete:studentsClasses": true,
      //Schedule Assignment
      "create:scheduleAssignament": true,
      "read:scheduleAssignament": true,
      "update:scheduleAssignament": true,
      "delete:scheduleAssignament": true,
      //Attendance
      "create:attendance": true,
      "read:attendance": true,
      "update:attendance": true,
      "delete:attendance": false,
      // Rubrics
      "create:rubrics": true,
      "read:rubrics": true,
      "update:rubrics": true,
      "delete:rubrics": true,
      // Attendance
      "create:assignance": false,
      "read:assignance": true,
      "update:assignance": true,
      "delete:assignance": false,
    },
    admin: {
      // Admin tiene casi todos los permisos (excepto eliminar escuelas)
      "create:users": true,
      "read:users": true,
      "update:users": true,
      "delete:users": true,
      //Aulas
      "create:classroom": true,
      "read:classroom": true,
      "update:classroom": true,
      "delete:classroom": true,
      // Materias
      "create:subject": true,
      "read:subject": true,
      "update:subject": true,
      "delete:subject": true,
      // Grupos
      "create:group": true,
      "read:group": true,
      "update:group": true,
      "delete:group": true,
      // Horarios
      "create:schedule": true,
      "read:schedule": true,
      "update:schedule": true,
      "delete:schedule": true,
      // Ciclos Escolares
      "create:schoolCycle": true,
      "read:schoolCycle": true,
      "update:schoolCycle": true,
      "delete:schoolCycle": true,
      // Calendario Escolar
      "create:calendar": true,
      "read:calendar": true,
      "update:calendar": true,
      "delete:calendar": true,
      // Periodos
      "create:term": true,
      "read:term": true,
      "update:term": true,
      "delete:term": true,

      //Class Catalog
      "create:classCatalog": true,
      "read:classCatalog": true,
      "update:classCatalog": true,
      "delete:classCatalog": true,
      //Students Classes
      "create:studentsClasses": true,
      "read:studentsClasses": true,
      "update:studentsClasses": true,
      "delete:studentsClasses": true,
      //Schedule Assignment
      "create:scheduleAssignament": true,
      "read:scheduleAssignament": true,
      "update:scheduleAssignament": true,
      "delete:scheduleAssignament": true,
      //Attendance
      "create:attendance": true,
      "read:attendance": true,
      "update:attendance": true,
      "delete:attendance": false,
      //Rubrics
      "create:rubrics": true,
      "read:rubrics": true,
      "update:rubrics": true,
      "delete:rubrics": true,
      // Attendance
      "create:assignance": false,
      "read:assignance": true,
      "update:assignance": true,
      "delete:assignance": false,
    },
    auditor: {
      // Auditor solo puede leer y ver reportes
      "create:users": false,
      "read:users": true,
      "update:users": false,
      "delete:users": false,
      //Aulas
      "create:classroom": false,
      "read:classroom": true,
      "update:classroom": false,
      "delete:classroom": false,
      // Materias
      "create:subject": false,
      "read:subject": true,
      "update:subject": false,
      "delete:subject": false,
      // Grupos
      "create:group": false,
      "read:group": true,
      "update:group": false,
      "delete:group": false,
      // Horarios
      "create:schedule": false,
      "read:schedule": true,
      "update:schedule": false,
      "delete:schedule": false,
      // Ciclos Escolares
      "create:schoolCycle": false,
      "read:schoolCycle": true,
      "update:schoolCycle": false,
      "delete:schoolCycle": false,
      // Calendario Escolar
      "create:calendar": false,
      "read:calendar": true,
      "update:calendar": false,
      "delete:calendar": false,
      // Periodos
      "create:term": false,
      "read:term": true,
      "update:term": false,
      "delete:term": false,

      //Class Catalog
      "create:classCatalog": false,
      "read:classCatalog": true,
      "update:classCatalog": false,
      "delete:classCatalog": false,
      //Students Classes
      "create:studentsClasses": false,
      "read:studentsClasses": true,
      "update:studentsClasses": false,
      "delete:studentsClasses": false,
      //Schedule Assignment
      "create:scheduleAssignament": false,
      "read:scheduleAssignament": true,
      "update:scheduleAssignament": false,
      "delete:scheduleAssignament": false,
      //Attendance
      "create:attendance": false,
      "read:attendance": true,
      "update:attendance": false,
      "delete:attendance": false,
      // Rubrics
      "create:rubrics": false,
      "read:rubrics": true,
      "update:rubrics": false,
      "delete:rubrics": false,
      // Attendance
      "create:assignance": false,
      "read:assignance": true,
      "update:assignance": false,
      "delete:assignance": false,
    },
    teacher: {
      // Profesor similar al tutor pero con menos permisos
      "create:users": false,
      "read:users": true, // Solo usuarios de sus materias
      "update:users": false,
      "delete:users": false,
      //Aulas
      "create:classroom": false,
      "read:classroom": false,
      "update:classroom": false,
      "delete:classroom": false,
      // Materias
      "create:subject": false,
      "read:subject": false,
      "update:subject": false,
      "delete:subject": false,
      // Grupos
      "create:group": false,
      "read:group": false,
      "update:group": false,
      "delete:group": false,
      // Horarios
      "create:schedule": false,
      "read:schedule": false,
      "update:schedule": false,
      "delete:schedule": false,
      // Ciclos Escolares
      "create:schoolCycle": false,
      "read:schoolCycle": false,
      "update:schoolCycle": false,
      "delete:schoolCycle": false,
      // Calendario Escolar
      "create:calendar": false,
      "read:calendar": true,
      "update:calendar": false,
      "delete:calendar": false,
      // Periodos
      "create:term": false,
      "read:term": true,
      "update:term": false,
      "delete:term": false,

      //Students Classes
      "create:studentsClasses": false,
      "read:studentsClasses": true,
      "update:studentsClasses": false,
      "delete:studentsClasses": false,
      //Schedule Assignment
      "create:scheduleAssignament": true,
      "read:scheduleAssignament": true,
      "update:scheduleAssignament": true,
      "delete:scheduleAssignament": false,
      //Attendance
      "create:attendance": true,
      "read:attendance": true,
      "update:attendance": true,
      "delete:attendance": false,
      // Rubrics
      "create:rubrics": true,
      "read:rubrics": true,
      "update:rubrics": true,
      "delete:rubrics": true,
      // Attendance
      "create:assignance": true,
      "read:assignance": true,
      "update:assignance": true,
      "delete:assignance": true,
    },
    tutor: {
      // Tutor es el padre
      "create:users": false,
      "read:users": true, // Solo podra ver a sus hijos
      "update:users": false,
      "delete:users": false,
      //Aulas
      "create:classroom": false,
      "read:classroom": false,
      "update:classroom": false,
      "delete:classroom": false,
      // Materias
      "create:subject": false,
      "read:subject": false,
      "update:subject": false,
      "delete:subject": false,
      // Grupos
      "create:group": false,
      "read:group": false,
      "update:group": false,
      "delete:group": false,
      // Horarios
      "create:schedule": false,
      "read:schedule": false,
      "update:schedule": false,
      "delete:schedule": false,
      // Ciclos Escolares
      "create:schoolCycle": false,
      "read:schoolCycle": false,
      "update:schoolCycle": false,
      "delete:schoolCycle": false,
      // Calendario Escolar
      "create:calendar": false,
      "read:calendar": true,
      "update:calendar": false,
      "delete:calendar": false,
      // Periodos
      "create:term": false,
      "read:term": false,
      "update:term": false,
      "delete:term": false,

      //Students Classes
      "create:studentsClasses": false,
      "read:studentsClasses": true,
      "update:studentsClasses": false,
      "delete:studentsClasses": false,
      //Schedule Assignment
      "create:scheduleAssignament": false,
      "read:scheduleAssignament": true,
      "update:scheduleAssignament": false,
      "delete:scheduleAssignament": false,
      //Attendance
      "create:attendance": false,
      "read:attendance": true,
      "update:attendance": false,
      "delete:attendance": false,
      // Rubrics
      "create:rubrics": false,
      "read:rubrics": true,
      "update:rubrics": false,
      "delete:rubrics": false,
      // Attendance
      "create:assignance": false,
      "read:assignance": true,
      "update:assignance": false,
      "delete:assignance": false,
    },
  };

  // Obtener roles del usuario en la escuela específica o en todas las escuelas
  const userRoles = useMemo((): UserRole[] => {
    if (!currentUser || !userSchools || userSchools.length === 0) {
      return [];
    }

    if (schoolId) {
      // Buscar roles en una escuela específica
      const school = userSchools.find(
        (us) => us.school._id === schoolId && us.status === "active"
      );
      return school ? school.role : [];
    } else {
      // Obtener todos los roles de todas las escuelas activas (para permisos globales)
      return userSchools
        .filter((us) => us.status === "active")
        .flatMap((us) => us.role);
    }
  }, [currentUser, userSchools, schoolId]);

  // Usar el rol activo en lugar del más alto
  const currentRole = activeRole;

  useEffect(() => {
    // Esperar a que terminen de cargar las escuelas y el rol activo
    if (schoolsLoading || roleLoading) {
      setIsLoading(true);
      return;
    }

    if (currentUser) {
      try {
        if (currentRole) {
          // Obtener permisos del rol activo
          const userPermissions = rolePermissions[currentRole];

          // Crear objeto de permisos con todas las acciones/recursos
          const allPermissions: Record<string, boolean> = {};

          actionsResources.forEach(({ action, resource }) => {
            const permissionKey = `${action}:${resource}`;
            allPermissions[permissionKey] =
              userPermissions[permissionKey] || false;
          });

          setPermissions(allPermissions);
          setError(roleError);
        } else {
          // Usuario sin rol activo, no tiene permisos
          setPermissions({});
          setError(roleError || "Usuario sin rol activo");
        }
      } catch (err) {
        setError("Error al cargar permisos");
        console.error("Error loading permissions:", err);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Usuario no autenticado
      setPermissions({});
      setIsLoading(false);
    }
  }, [
    currentUser,
    userSchools,
    currentRole,
    schoolsLoading,
    roleLoading,
    roleError,
  ]);

  // Función helper para verificar permisos
  const hasPermission = (permission: string): boolean => {
    return permissions[permission] || false;
  };

  // Función para verificar múltiples permisos (al menos uno debe ser true)
  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some((permission) => permissions[permission]);
  };

  // Función para verificar múltiples permisos (todos deben ser true)
  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every((permission) => permissions[permission]);
  };

  // Función para verificar si tiene un rol específico
  const hasRole = (role: UserRole): boolean => {
    return userRoles.includes(role);
  };

  // Función para verificar si tiene cualquier rol de una lista
  const hasAnyRole = (roleList: UserRole[]): boolean => {
    return roleList.some((role) => userRoles.includes(role));
  };

  // Función para obtener filtros de estudiantes basados en el rol activo del usuario
  const getStudentFilters = React.useCallback(() => {
    if (!currentUser || !currentRole) {
      return { canViewAll: false, tutorId: undefined, teacherId: undefined };
    }

    // Superadmin y Admin pueden ver todos los estudiantes
    if (currentRole === "superadmin" || currentRole === "admin") {
      return { canViewAll: true, tutorId: undefined, teacherId: undefined };
    }

    // Auditor puede ver todos pero con restricciones de edición
    if (currentRole === "auditor") {
      return { canViewAll: true, tutorId: undefined, teacherId: undefined };
    }

    // Tutor solo puede ver sus estudiantes asignados
    if (currentRole === "tutor") {
      return {
        canViewAll: false,
        tutorId: currentUser._id,
        teacherId: undefined,
      };
    }

    // Maestro solo puede ver estudiantes de sus materias
    if (currentRole === "teacher") {
      return {
        canViewAll: false,
        tutorId: undefined,
        teacherId: currentUser._id,
      };
    }

    // Por defecto, no puede ver nada
    return { canViewAll: false, tutorId: undefined, teacherId: undefined };
  }, [currentUser, currentRole]);

  return {
    // Estado
    permissions,
    isLoading,
    error,

    // Roles del usuario
    userRoles,
    currentRole,
    availableRoles,

    // Funciones de permisos
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Funciones de roles
    hasRole,
    hasAnyRole,

    // Propiedades específicas para facilitar el uso
    canCreateUsers: permissions["create:users"] || false,
    canReadUsers: permissions["read:users"] || false,
    canUpdateUsers: permissions["update:users"] || false,
    canDeleteUsers: permissions["delete:users"] || false,
    //Aulas
    canCreateClassroom: permissions["create:classroom"] || false,
    canReadClassroom: permissions["read:classroom"] || false,
    canUpdateClassroom: permissions["update:classroom"] || false,
    canDeleteClassroom: permissions["delete:classroom"] || false,
    //Materias
    canCreateSubject: permissions["create:subject"] || false,
    canReadSubject: permissions["read:subject"] || false,
    canUpdateSubject: permissions["update:subject"] || false,
    canDeleteSubject: permissions["delete:subject"] || false,
    //Grupos
    canCreateGroup: permissions["create:group"] || false,
    canReadGroup: permissions["read:group"] || false,
    canUpdateGroup: permissions["update:group"] || false,
    canDeleteGroup: permissions["delete:group"] || false,
    //Horarios
    canCreateSchedule: permissions["create:schedule"] || false,
    canReadSchedule: permissions["read:schedule"] || false,
    canUpdateSchedule: permissions["update:schedule"] || false,
    canDeleteSchedule: permissions["delete:schedule"] || false,
    //Ciclos Escolares
    canCreateSchoolCycle: permissions["create:schoolCycle"] || false,
    canReadSchoolCycle: permissions["read:schoolCycle"] || false,
    canUpdateSchoolCycle: permissions["update:schoolCycle"] || false,
    canDeleteSchoolCycle: permissions["delete:schoolCycle"] || false,
    //Calendario Escolar
    canCreateCalendar: permissions["create:calendar"] || false,
    canReadCalendar: permissions["read:calendar"] || false,
    canUpdateCalendar: permissions["update:calendar"] || false,
    canDeleteCalendar: permissions["delete:calendar"] || false,
    //Periodos
    canCreateTerm: permissions["create:term"] || false,
    canReadTerm: permissions["read:term"] || false,
    canUpdateTerm: permissions["update:term"] || false,
    canDeleteTerm: permissions["delete:term"] || false,

    /** Class Catalog */
    canCreateClassCatalog: permissions["create:classCatalog"] || false,
    canReadClassCatalog: permissions["read:classCatalog"] || false,
    canUpdateClassCatalog: permissions["update:classCatalog"] || false,
    canDeleteClassCatalog: permissions["delete:classCatalog"] || false,
    /** Students Classes */
    canCreateStudentsClasses: permissions["create:studentsClasses"] || false,
    canReadStudentsClasses: permissions["read:studentsClasses"] || false,
    canUpdateStudentsClasses: permissions["update:studentsClasses"] || false,
    canDeleteStudentsClasses: permissions["delete:studentsClasses"] || false,
    /** Schedule Assignment */
    canCreateScheduleAssignament: permissions["create:scheduleAssignament"] || false,
    canReadScheduleAssignament: permissions["read:scheduleAssignament"] || false,
    canUpdateScheduleAssignament: permissions["update:scheduleAssignament"] || false,
    canDeleteScheduleAssignament: permissions["delete:scheduleAssignament"] || false,
    /** Attendance */
    canCreateAttendance: permissions["create:attendance"] || false,
    canReadAttendance: permissions["read:attendance"] || false,
    canUpdateAttendance: permissions["update:attendance"] || false,
    canDeleteAttendance: permissions["delete:attendance"] || false,
    /** Rubrics */
    canCreateRubric: permissions["create:rubrics"] || false,
    canReadRubric: permissions["read:rubrics"] || false,
    canUpdateRubric: permissions["update:rubrics"] || false,
    canDeleteRubric: permissions["delete:rubrics"] || false,
    /** Assignance */
    canCreateAssignance: permissions["create:assignance"] || false,
    canReadAssignance: permissions["read:assignance"] || false,
    canUpdateAssignance: permissions["update:assignance"] || false,
    canDeleteAssignance: permissions["delete:assignance"] || false,

    // Propiedades específicas por rol
    isSuperAdmin: hasRole("superadmin"),
    isAdmin: hasRole("admin"),
    isAuditor: hasRole("auditor"),
    isTeacher: hasRole("teacher"),
    isTutor: hasRole("tutor"),

    // Filtros para estudiantes
    getStudentFilters,
  };
};
