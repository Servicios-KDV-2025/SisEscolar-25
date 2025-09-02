import { useUserStore } from "../stores/userStore";
import { useUserSchoolsWithConvex } from "../stores/userSchoolsStore";
import React, { useState, useEffect, useMemo } from "react";  

type UserRole = 'superadmin' | 'admin' | 'auditor' | 'teacher' | 'tutor';

export const usePermissions = (schoolId?: string) => {
    const { currentUser } = useUserStore();
    const { userSchools, isLoading: schoolsLoading } = useUserSchoolsWithConvex(currentUser?._id);
    
    const [permissions, setPermissions] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Definir todos los recursos y acciones disponibles
    const actionsResources = [
        { action: "create", resource: "users" },
        { action: "read", resource: "users" },
        { action: "update", resource: "users" },
        { action: "delete", resource: "users" },
    ];

    // Definir permisos por rol (basado en tu sistema actual)
    const rolePermissions: Record<UserRole, Record<string, boolean>> = {
        superadmin: {
            // Superadmin tiene TODOS los permisos
            "create:users": true,
            "read:users": true,
            "update:users": true,
            "delete:users": true,
        },
        admin: {
            // Admin tiene casi todos los permisos (excepto eliminar escuelas)
            "create:users": true,
            "read:users": true,
            "update:users": true,
            "delete:users": true,
        },
        auditor: {
            // Auditor solo puede leer y ver reportes
            "create:users": false,
            "read:users": true,
            "update:users": false,
            "delete:users": false,
        },
        teacher: {
            // Profesor similar al tutor pero con menos permisos
            "create:users": false,
            "read:users": true, // Solo usuarios de sus materias
            "update:users": false,
            "delete:users": false,
        },
        tutor: {
            // Tutor es el padre 
            "create:users": false,
            "read:users": true, // Solo podra ver a sus hijos
            "update:users": false,
            "delete:users": false,
        },
    };

    // Obtener roles del usuario en la escuela específica o en todas las escuelas
    const userRoles = useMemo((): UserRole[] => {
        if (!currentUser || !userSchools || userSchools.length === 0) {
            return [];
        }

        if (schoolId) {
            // Buscar roles en una escuela específica
            const school = userSchools.find(us => us.school._id === schoolId && us.status === 'active');
            return school ? school.role : [];
        } else {
            // Obtener todos los roles de todas las escuelas activas (para permisos globales)
            return userSchools
                .filter(us => us.status === 'active')
                .flatMap(us => us.role);
        }
    }, [currentUser, userSchools, schoolId]);

    // Obtener el rol más alto (prioridad: superadmin > admin > auditor > teacher > tutor)
    const highestRole = useMemo((): UserRole | null => {
        if (userRoles.includes('superadmin')) return 'superadmin';
        if (userRoles.includes('admin')) return 'admin';
        if (userRoles.includes('auditor')) return 'auditor';
        if (userRoles.includes('teacher')) return 'teacher';
        if (userRoles.includes('tutor')) return 'tutor';
        return null;
    }, [userRoles]);

    useEffect(() => {
        // Esperar a que termine de cargar las escuelas
        if (schoolsLoading) {
            setIsLoading(true);
            return;
        }

        if (currentUser) {
            try {
                if (highestRole) {
                    // Obtener permisos del rol más alto
                    const userPermissions = rolePermissions[highestRole];
                    
                    // Crear objeto de permisos con todas las acciones/recursos
                    const allPermissions: Record<string, boolean> = {};
                    
                    actionsResources.forEach(({ action, resource }) => {
                        const permissionKey = `${action}:${resource}`;
                        allPermissions[permissionKey] = userPermissions[permissionKey] || false;
                    });
                    
                    setPermissions(allPermissions);
                    setError(null);
                } else {
                    // Usuario sin roles, no tiene permisos
                    setPermissions({});
                    setError(userSchools?.length === 0 ? 'Usuario no asignado a ninguna escuela' : 'Usuario sin roles asignados');
                }
            } catch (err) {
                setError('Error al cargar permisos');
                console.error('Error loading permissions:', err);
            } finally {
                setIsLoading(false);
            }
        } else {
            // Usuario no autenticado
            setPermissions({});
            setIsLoading(false);
        }
    }, [currentUser, userSchools, highestRole, schoolsLoading]);

    // Función helper para verificar permisos
    const hasPermission = (permission: string): boolean => {
        return permissions[permission] || false;
    };

    // Función para verificar múltiples permisos (al menos uno debe ser true)
    const hasAnyPermission = (permissionList: string[]): boolean => {
        return permissionList.some(permission => permissions[permission]);
    };

    // Función para verificar múltiples permisos (todos deben ser true)
    const hasAllPermissions = (permissionList: string[]): boolean => {
        return permissionList.every(permission => permissions[permission]);
    };

    // Función para verificar si tiene un rol específico
    const hasRole = (role: UserRole): boolean => {
        return userRoles.includes(role);
    };

    // Función para verificar si tiene cualquier rol de una lista
    const hasAnyRole = (roleList: UserRole[]): boolean => {
        return roleList.some(role => userRoles.includes(role));
    };

    // Función para obtener filtros de estudiantes basados en el rol del usuario
    const getStudentFilters = React.useCallback(() => {
        if (!currentUser || !highestRole) {
            return { canViewAll: false, tutorId: undefined, teacherId: undefined };
        }

        // Superadmin y Admin pueden ver todos los estudiantes
        if (highestRole === 'superadmin' || highestRole === 'admin') {
            return { canViewAll: true, tutorId: undefined, teacherId: undefined };
        }

        // Auditor puede ver todos pero con restricciones de edición
        if (highestRole === 'auditor') {
            return { canViewAll: true, tutorId: undefined, teacherId: undefined };
        }

        // Tutor solo puede ver sus estudiantes asignados
        if (highestRole === 'tutor') {
            return { canViewAll: false, tutorId: currentUser._id, teacherId: undefined };
        }

        // Maestro solo puede ver estudiantes de sus materias
        if (highestRole === 'teacher') {
            return { canViewAll: false, tutorId: undefined, teacherId: currentUser._id };
        }

        // Por defecto, no puede ver nada
        return { canViewAll: false, tutorId: undefined, teacherId: undefined };
    }, [currentUser, highestRole]);

    return {
        // Estado
        permissions,
        isLoading,
        error,
        
        // Roles del usuario
        userRoles,
        highestRole,
        
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
