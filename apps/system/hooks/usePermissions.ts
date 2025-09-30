import { useUserStore } from "../stores/userStore";
import { useUserSchoolsWithConvex } from "../stores/userSchoolsStore";
import { useActiveRole } from "./useActiveRole";
import React, { useState, useEffect, useMemo } from "react";

type UserRole = "superadmin" | "admin" | "auditor" | "teacher" | "tutor";

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

        // Perfil Institucional
        { action: "read", resource: "perfil_institucional" },
        { action: "update", resource: "perfil_institucional" },

        // paginia de inicio
        { action: "read", resource: "inicio_info" },

        //pagina de tutores
        { action: "create", resource: "users_tutores" },
        { action: "read", resource: "users_tutores" },
        { action: "update", resource: "users_tutores" },
        { action: "delete", resource: "users_tutores" },

        // pagina de personal
        { action: "create", resource: "users_personal" },
        { action: "read", resource: "users_personal" },
        { action: "update", resource: "users_personal" },
        { action: "delete", resource: "users_personal" },
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
  ];

  // Definir permisos por rol (basado en tu sistema actual)
  const rolePermissions: Record<UserRole, Record<string, boolean>> = {
    superadmin: {
      // Superadmin tiene TODOS los permisos
      "create:users": true,
      "read:users": true,
      "update:users": true,
      "delete:users": true,

            //permisos perfil institucional
            "read:perfil_institucional": true,
            "update:perfil_institucional": true,

            // permisos pagina de inicio
            "read:inicio_info": true,

            // permisos pagina de tutores
            "create:users_tutores": true,
            "read:users_tutores": true,
            "update:users_tutores": true,
            "delete:users_tutores": true,

            //  pagina de personal
            "create:users_personal": true,
            "read:users_personal": true,
            "update:users_personal": true,
            "delete:users_personal": true,

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
    },
    admin: {
      // Admin tiene casi todos los permisos (excepto eliminar escuelas)
      "create:users": true,
      "read:users": true,
      "update:users": true,
      "delete:users": true,

            //permisos perfil institucional
            "read:perfil_institucional": true,
            "update:perfil_institucional": true,
            
            // permisos pagina de inicio
            "read:inicio_info": true,

            // permisos pagina de tutores
            "create:users_tutores": true,
            "read:users_tutores": true,
            "update:users_tutores": true,
            "delete:users_tutores": true,

            //  pagina de personal
            "create:users_personal": false,
            "read:users_personal": true,
            "update:users_personal": false,
            "delete:users_personal": false,
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
    },
    auditor: {
      // Auditor solo puede leer y ver reportes
      "create:users": false,
      "read:users": true,
      "update:users": false,
      "delete:users": false,

            //permisos perfil institucional
            "read:perfil_institucional": true,
            "update:perfil_institucional": false,

            // permisos pagina de inicio
            "read:inicio_info": true,

            // permisos pagina de tutores
            "create:users_tutores": false,
            "read:users_tutores": true,
            "update:users_tutores": false,
            "delete:users_tutores": false,

            //  pagina de personal
            "create:users_personal": true,
            "read:users_personal": true,
            "update:users_personal": true,
            "delete:users_personal": false,
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
    },
    teacher: {
      // Profesor similar al tutor pero con menos permisos
      "create:users": false,
      "read:users": false, // Solo usuarios de sus materias
      "update:users": false,
      "delete:users": false,

            //permisos perfil institucional
            "read:perfil_institucional": true,
            "update:perfil_institucional": false,

            // permisos pagina de inicio
            "read:inicio_info": false,

            // permisos pagina de tutores
            "create:users_tutores": false,
            "read:users_tutores": false,
            "update:users_tutores": false,
            "delete:users_tutores": false,

            //  pagina de personal
            "create:users_personal": false,
            "read:users_personal": false,
            "update:users_personal": false,
            "delete:users_personal": false,
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
    },
    tutor: {
      // Tutor es el padre
      "create:users": false,
      "read:users": true, // Solo podra ver a sus hijos
      "update:users": false,
      "delete:users": false,

            //permisos perfil institucional
            "read:perfil_institucional": true,
            "update:perfil_institucional": false,

            // permisos pagina de inicio
            "read:inicio_info": false,

            // permisos pagina de tutores
            "create:users_tutores": false,
            "read:users_tutores": false,
            "update:users_tutores": false,
            "delete:users_tutores": false,

            //  pagina de personal
            "create:users_personal": false,
            "read:users_personal": false,
            "update:users_personal": false,
            "delete:users_personal": false,
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

    // Propiedades específicas por rol
    isSuperAdmin: hasRole("superadmin"),
    isAdmin: hasRole("admin"),
    isAuditor: hasRole("auditor"),
    isTeacher: hasRole("teacher"),
    isTutor: hasRole("tutor"),

    // Filtros para estudiantes
    getStudentFilters,
  };
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

        // Permisos perfil institucional
        canReadPerfilInstitucional: permissions["read:perfil_institucional"] || false,
        canUpdatePerfilInstitucional: permissions["update:perfil_institucional"] || false,

        // Permisos pagina de inicio
        canReadInicioInfo: permissions["read:inicio_info"] || false,

        // Permisos pagina de tutores
        canCreateUsersTutores: permissions["create:users_tutores"] || false,
        canReadUsersTutores: permissions["read:users_tutores"] || false,
        canUpdateUsersTutores: permissions["update:users_tutores"] || false,
        canDeleteUsersTutores: permissions["delete:users_tutores"] || false,

        // Permisos pagina de personal
        canCreateUsersPersonal: permissions["create:users_personal"] || false,
        canReadUsersPersonal: permissions["read:users_personal"] || false,
        canUpdateUsersPersonal: permissions["update:users_personal"] || false,
        canDeleteUsersPersonal: permissions["delete:users_personal"] || false,


        

        // Propiedades específicas por rol
        isSuperAdmin: hasRole('superadmin'),
        isAdmin: hasRole('admin'),
        isAuditor: hasRole('auditor'),
        isTeacher: hasRole('teacher'),
        isTutor: hasRole('tutor'),

        // Filtros para estudiantes
        getStudentFilters,
    };
};