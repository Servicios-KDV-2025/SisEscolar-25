"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useUserWithConvex } from '../stores/userStore';
import { useUserSchoolsWithConvex } from '../stores/userSchoolsStore';
import { useActiveRoleStore } from '../stores/activeRoleStore';

type UserRole = 'superadmin' | 'admin' | 'auditor' | 'teacher' | 'tutor';

interface ActiveRoleContextType {
  activeRole: UserRole | null;
  availableRoles: UserRole[];
  setActiveRole: (role: UserRole | null) => void;
  isLoading: boolean;
  error: string | null;
}

const ActiveRoleContext = createContext<ActiveRoleContextType | undefined>(undefined);

interface ActiveRoleProviderProps {
  children: React.ReactNode;
  schoolId?: string;
}

export function ActiveRoleProvider({ children, schoolId }: ActiveRoleProviderProps) {
  // Este provider ahora espera que los datos ya estén disponibles
  const { user: clerkUser } = useUser();
  const { currentUser } = useUserWithConvex(clerkUser?.id);
  const { userSchools, selectedSchool } = useUserSchoolsWithConvex(currentUser?._id);
  const { getActiveRole, setActiveRole: setStoreActiveRole } = useActiveRoleStore();

  // Debug: verificar el estado de los datos
//   console.log('ActiveRoleProvider - data states:', {
//     hasClerkUser: !!clerkUser,
//     clerkUserId: clerkUser?.id,
//     hasCurrentUser: !!currentUser,
//     currentUserId: currentUser?._id,
//     hasCurrentSchool: !!selectedSchool,
//     currentSchoolId: selectedSchool?.school._id,
//     userSchoolsLength: userSchools?.length,
//     userSchoolsData: userSchools,
//     schoolId: schoolId
//   });
  
  // Obtener rol activo del store (específico por escuela)
//   const getStoredActiveRole = (): UserRole | null => {
//     console.log('getStoredActiveRole called with schoolId:', schoolId);
//     if (schoolId) {
//       const role = getActiveRole(schoolId);
//       console.log('Retrieved role from store:', role);
//       return role;
//     }
//     console.log('No schoolId, returning null');
//     return null;
//   };

  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar rol inicial cuando el schoolId esté disponible
  useEffect(() => {
    if (schoolId && !activeRole) {
    //   console.log('Initial load: schoolId available, loading stored role:', schoolId);
      const storedRole = getActiveRole(schoolId);
    //   console.log('Stored role from store:', storedRole);
      if (storedRole) {
        setActiveRole(storedRole);
        // console.log('Set initial active role from store:', storedRole);
      }
    }
  }, [schoolId, activeRole, getActiveRole]);

  // Recargar rol activo cuando cambie el schoolId (para cambios de escuela)
  useEffect(() => {
    if (schoolId) {
    //   console.log('SchoolId changed, reloading active role for new school:', schoolId);
      const newActiveRole = getActiveRole(schoolId);
    //   console.log('New active role from store:', newActiveRole);
      setActiveRole(newActiveRole);
    }
  }, [schoolId, getActiveRole]);

  // Obtener roles disponibles del usuario en la escuela específica
  const availableRoles = React.useMemo((): UserRole[] => {
    // console.log('useActiveRole - calculating availableRoles:', {
    //   currentUser: !!currentUser,
    //   userSchools: userSchools?.length,
    //   schoolId,
    //   currentSchool: !!selectedSchool,
    //   currentSchoolId: selectedSchool?.school._id
    // });

    if (!currentUser || !userSchools || userSchools.length === 0) {
    //   console.log('No user or schools, returning empty roles');
      return [];
    }

    // Usar schoolId si se proporciona, o selectedSchool si está disponible, o la primera escuela activa
    const effectiveSchoolId = schoolId || selectedSchool?.school._id || 
      (userSchools && userSchools.length > 0 ? userSchools.find(us => us.status === 'active')?.school._id : undefined);
    // console.log('Effective school ID:', effectiveSchoolId);
    // console.log('Fallback to first active school:', !schoolId && !selectedSchool?.school._id);

    // SIEMPRE usar schoolId específico - no mostrar roles de otras escuelas
    if (effectiveSchoolId) {
      // Buscar roles SOLO en la escuela específica
      const school = userSchools.find(us => us.school._id === effectiveSchoolId && us.status === 'active');
    //   console.log('Searching for school with ID:', effectiveSchoolId);
    //   console.log('Available schools:', userSchools.map(us => ({ id: us.school._id, name: us.school.name, status: us.status, roles: us.role })));
    //   console.log('Found school:', school?.school.name, 'with roles:', school?.role);
      const roles = school ? school.role : [];
      // Eliminar roles duplicados
      const uniqueRoles = [...new Set(roles)];
      console.log('Unique roles for this school:', uniqueRoles);
      return uniqueRoles;
    } else {
      // Si no hay schoolId específico, no mostrar roles (debe haber un schoolId)
    //   console.log('No schoolId provided - returning empty roles');
      return [];
    }
  }, [currentUser, userSchools, schoolId, selectedSchool]);

  // Obtener el rol más alto disponible (como fallback)
  const highestAvailableRole = React.useMemo((): UserRole | null => {
    if (availableRoles.includes('superadmin')) return 'superadmin';
    if (availableRoles.includes('admin')) return 'admin';
    if (availableRoles.includes('auditor')) return 'auditor';
    if (availableRoles.includes('teacher')) return 'teacher';
    if (availableRoles.includes('tutor')) return 'tutor';
    return null;
  }, [availableRoles]);

  // Inicializar el rol activo SOLO una vez cuando se cargan los datos
  useEffect(() => {
    // console.log('useActiveRole - useEffect triggered:', {
    //   currentUser: !!currentUser,
    //   availableRoles,
    //   highestAvailableRole,
    //   activeRole,
    //   schoolId,
    //   selectedSchool: !!selectedSchool
    // });

    if (!currentUser) {
    //   console.log('No currentUser, setting loading state');
      setIsLoading(true);
      setActiveRole(null);
      setError(null);
      return;
    }

    if (currentUser && availableRoles.length > 0) {
    //   console.log('User has roles, checking active role logic...');
    //   console.log('Current activeRole:', activeRole);
    //   console.log('Available roles:', availableRoles);
    //   console.log('Highest available role:', highestAvailableRole);
      
      // Solo establecer el rol más alto si NO hay un rol activo ya seleccionado
      // Esto permite que el usuario mantenga su selección
      if (!activeRole) {
        // console.log('No active role set, checking store first...');
        const storedRole = getActiveRole(schoolId || '');
        if (storedRole && availableRoles.includes(storedRole)) {
        //   console.log('Found valid stored role, using it:', storedRole);
          setActiveRole(storedRole);
        } else {
        //   console.log('No valid stored role, setting to highest:', highestAvailableRole);
          setActiveRole(highestAvailableRole);
          // Guardar en store específico por escuela
          if (schoolId && highestAvailableRole) {
            setStoreActiveRole(schoolId, highestAvailableRole);
          }
        }
      } else if (!availableRoles.includes(activeRole)) {
        // Si el rol activo ya no está disponible, usar el más alto
        console.log('Active role no longer available, switching to highest:', highestAvailableRole);
        setActiveRole(highestAvailableRole);
        // Guardar en store específico por escuela
        if (schoolId && highestAvailableRole) {
          setStoreActiveRole(schoolId, highestAvailableRole);
        }
      } else {
        // console.log('Active role is valid and available:', activeRole);
      }
      setError(null);
    } else {
    //   console.log('User has no roles or no currentUser');
    //   console.log('availableRoles.length:', availableRoles.length);
    //   console.log('currentUser:', !!currentUser);
      setActiveRole(null);
      setError('Usuario sin roles asignados');
    }
    
    setIsLoading(false);
  }, [currentUser, availableRoles, highestAvailableRole, activeRole, schoolId, setStoreActiveRole, getActiveRole]); // Incluí schoolId para recargar cuando cambie la escuela

  // Función para cambiar el rol activo
  const handleSetActiveRole = (role: UserRole | null) => {
    // console.log('handleSetActiveRole called with:', role, 'available:', availableRoles);
    
    if (role && availableRoles.includes(role)) {
    //   console.log('Setting active role to:', role);
      setActiveRole(role);
      // Guardar en store específico por escuela
      if (schoolId) {
        setStoreActiveRole(schoolId, role);
      }
    } else if (role === null) {
    //   console.log('Setting active role to highest:', highestAvailableRole);
      setActiveRole(highestAvailableRole);
      // Guardar en store específico por escuela
      if (schoolId && highestAvailableRole) {
        setStoreActiveRole(schoolId, highestAvailableRole);
      }
    } else {
    //   console.log('Role not available or invalid:', role);
    }
  };

  const value: ActiveRoleContextType = {
    activeRole,
    availableRoles,
    setActiveRole: handleSetActiveRole,
    isLoading,
    error
  };

//   console.log('ActiveRoleProvider ready with data:', {
//     activeRole,
//     availableRoles,
//     isLoading,
//     error
//   });

  return (
    <ActiveRoleContext.Provider value={value}>
      {children}
    </ActiveRoleContext.Provider>
  );
}

export function useActiveRole(): ActiveRoleContextType {
  const context = useContext(ActiveRoleContext);
  if (context === undefined) {
    throw new Error('useActiveRole must be used within an ActiveRoleProvider');
  }
  return context;
}
