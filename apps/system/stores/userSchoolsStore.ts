import { create } from 'zustand';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../packages/convex/convex/_generated/api';
import { Id } from '../../../packages/convex/convex/_generated/dataModel';
import React from 'react';

// Tipos para las escuelas
export interface School {
  _id: Id<"school">;
  name: string;
  subdomain: string;
  shortName: string;
  cctCode: string;
  address: string;
  description: string;
  imgUrl: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: number;
  updatedAt: number;
}

// Tipos para la relación usuario-escuela
export interface UserSchool {
  userSchoolId: Id<"userSchool">;
  school: School;
  role: Array<'superadmin' | 'admin' | 'auditor' | 'teacher' | 'tutor'>;
  status: 'active' | 'inactive';
  department?: 'secretary' | 'direction' | 'schoolControl' | 'technology';
  createdAt: number;
  updatedAt: number;
}

// Tipos para actualizar relación usuario-escuela
export interface UpdateUserSchoolData {
  role?: Array<'superadmin' | 'admin' | 'auditor' | 'teacher' | 'tutor'>;
  department?: 'secretary' | 'direction' | 'schoolControl' | 'technology';
  status?: 'active' | 'inactive';
}

// Tipos para asignar usuario a escuela
export interface AssignUserToSchoolData {
  schoolId: Id<"school">;
  role: Array<'superadmin' | 'admin' | 'auditor' | 'teacher' | 'tutor'>;
  department?: 'secretary' | 'direction' | 'schoolControl' | 'technology';
  status?: 'active' | 'inactive';
}

// Estado del store
interface UserSchoolsState {
  // Estado de las escuelas del usuario
  userSchools: UserSchool[];
  selectedSchool: UserSchool | null;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  setUserSchools: (schools: UserSchool[]) => void;
  setSelectedSchool: (school: UserSchool | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Funciones para manejar escuelas
  fetchUserSchools: (userId: Id<"user">, status?: 'active' | 'inactive', role?: string) => Promise<UserSchool[]>;
  fetchUserActiveSchools: (userId: Id<"user">, role?: string) => Promise<UserSchool[]>;
  fetchUserSchool: (userId: Id<"user">, schoolId: Id<"school">) => Promise<UserSchool | null>;
  assignUserToSchool: (userId: Id<"user">, data: AssignUserToSchoolData) => Promise<boolean>;
  updateUserSchool: (userSchoolId: Id<"userSchool">, data: UpdateUserSchoolData) => Promise<boolean>;
  removeUserFromSchool: (userSchoolId: Id<"userSchool">) => Promise<boolean>;
  deactivateUserInSchool: (userSchoolId: Id<"userSchool">) => Promise<boolean>;
  activateUserInSchool: (userSchoolId: Id<"userSchool">) => Promise<boolean>;
  
  // Reset del store
  reset: () => void;
}

// Hook personalizado para usar el store con Convex
export const useUserSchoolsStore = create<UserSchoolsState>((set, get) => ({
  // Estado inicial
  userSchools: [],
  selectedSchool: null,
  isLoading: false,
  error: null,

  // Setters básicos
  setUserSchools: (schools) => set({ userSchools: schools }),
  setSelectedSchool: (school) => set({ selectedSchool: school }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Obtener escuelas del usuario
  fetchUserSchools: async (userId: Id<"user">, status?: 'active' | 'inactive', role?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Esta función se implementará usando el hook de Convex
      // Por ahora retornamos array vacío, se implementará en el componente
      set({ isLoading: false });
      return [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: errorMessage, isLoading: false });
      return [];
    }
  },

  // Obtener escuelas activas del usuario
  fetchUserActiveSchools: async (userId: Id<"user">, role?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Esta función se implementará usando el hook de Convex
      // Por ahora retornamos array vacío, se implementará en el componente
      set({ isLoading: false });
      return [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: errorMessage, isLoading: false });
      return [];
    }
  },

  // Obtener escuela específica del usuario
  fetchUserSchool: async (userId: Id<"user">, schoolId: Id<"school">) => {
    set({ isLoading: true, error: null });
    
    try {
      // Esta función se implementará usando el hook de Convex
      // Por ahora retornamos null, se implementará en el componente
      set({ isLoading: false });
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  // Asignar usuario a escuela
  assignUserToSchool: async (userId: Id<"user">, data: AssignUserToSchoolData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Esta función se implementará usando el hook de Convex
      // Por ahora retornamos false, se implementará en el componente
      set({ isLoading: false });
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // Actualizar relación usuario-escuela
  updateUserSchool: async (userSchoolId: Id<"userSchool">, data: UpdateUserSchoolData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Esta función se implementará usando el hook de Convex
      // Por ahora retornamos false, se implementará en el componente
      set({ isLoading: false });
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // Remover usuario de escuela
  removeUserFromSchool: async (userSchoolId: Id<"userSchool">) => {
    set({ isLoading: true, error: null });
    
    try {
      // Esta función se implementará usando el hook de Convex
      // Por ahora retornamos false, se implementará en el componente
      set({ isLoading: false });
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // Desactivar usuario en escuela
  deactivateUserInSchool: async (userSchoolId: Id<"userSchool">) => {
    set({ isLoading: true, error: null });
    
    try {
      // Esta función se implementará usando el hook de Convex
      // Por ahora retornamos false, se implementará en el componente
      set({ isLoading: false });
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // Activar usuario en escuela
  activateUserInSchool: async (userSchoolId: Id<"userSchool">) => {
    set({ isLoading: true, error: null });
    
    try {
      // Esta función se implementará usando el hook de Convex
      // Por ahora retornamos false, se implementará en el componente
      set({ isLoading: false });
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // Reset del store
  reset: () => set({
    userSchools: [],
    selectedSchool: null,
    isLoading: false,
    error: null,
  }),
}));

// Hook personalizado que combina Zustand con Convex
export const useUserSchoolsWithConvex = (userId?: Id<"user">) => {
  const store = useUserSchoolsStore();
  
  // Queries para obtener escuelas del usuario
  const userSchools = useQuery(
    api.functions.schools.getUserSchools,
    userId ? { userId } : 'skip'
  );

  const userActiveSchools = useQuery(
    api.functions.schools.getUserActiveSchools,
    userId ? { userId } : 'skip'
  );
  
  // Mutations
  const assignUserToSchoolMutation = useMutation(api.functions.schools.assignUserToSchool);
  const updateUserSchoolMutation = useMutation(api.functions.schools.updateUserSchool);
  const removeUserFromSchoolMutation = useMutation(api.functions.schools.removeUserFromSchool);
  const deactivateUserInSchoolMutation = useMutation(api.functions.schools.deactivateUserInSchool);
  const activateUserInSchoolMutation = useMutation(api.functions.schools.activateUserInSchool);

  // Actualizar el store cuando cambien las escuelas
  React.useEffect(() => {
    if (userSchools) {
      store.setUserSchools(userSchools);
    } else if (userId) {
      store.setUserSchools([]);
    }
  }, [userSchools, userId]);

  // Funciones que usan las mutations de Convex
  const fetchUserSchools = React.useCallback(async (status?: 'active' | 'inactive', role?: string) => {
    if (!userId) {
      store.setError('No hay usuario autenticado');
      return [];
    }

    try {
      store.setLoading(true);
      store.clearError();
      
      // Para obtener escuelas con filtros específicos, usamos la query directamente
      // El store se actualizará automáticamente cuando cambie la query
      store.setLoading(false);
      return useUserSchoolsStore.getState().userSchools;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener escuelas';
      store.setError(errorMessage);
      store.setLoading(false);
      return [];
    }
  }, [userId, store]);

  const fetchUserActiveSchools = React.useCallback(async (role?: string) => {
    if (!userId) {
      store.setError('No hay usuario autenticado');
      return [];
    }

    try {
      store.setLoading(true);
      store.clearError();
      
      // Para obtener escuelas activas, usamos la query directamente
      // El store se actualizará automáticamente cuando cambie la query
      store.setLoading(false);
      return userActiveSchools || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener escuelas activas';
      store.setError(errorMessage);
      store.setLoading(false);
      return [];
    }
  }, [userId, userActiveSchools, store]);

  const fetchUserSchool = React.useCallback(async (schoolId: Id<"school">) => {
    if (!userId) {
      store.setError('No hay usuario autenticado');
      return null;
    }

    try {
      store.setLoading(true);
      store.clearError();
      
      // Para obtener una escuela específica, usamos la query directamente
      // El store se actualizará automáticamente cuando cambie la query
      store.setLoading(false);
      return useUserSchoolsStore.getState().selectedSchool;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener escuela';
      store.setError(errorMessage);
      store.setLoading(false);
      return null;
    }
  }, [userId, store]);

  const assignUserToSchool = React.useCallback(async (data: AssignUserToSchoolData) => {
    if (!userId) {
      store.setError('No hay usuario autenticado');
      return false;
    }

    try {
      store.setLoading(true);
      store.clearError();
      
      await assignUserToSchoolMutation({
        userId,
        ...data,
      });
      
      store.setLoading(false);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al asignar usuario a escuela';
      store.setError(errorMessage);
      store.setLoading(false);
      return false;
    }
  }, [userId, assignUserToSchoolMutation, store]);

  const updateUserSchool = React.useCallback(async (userSchoolId: Id<"userSchool">, data: UpdateUserSchoolData) => {
    try {
      store.setLoading(true);
      store.clearError();
      
      await updateUserSchoolMutation({
        userSchoolId,
        ...data,
      });
      
      store.setLoading(false);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar relación usuario-escuela';
      store.setError(errorMessage);
      store.setLoading(false);
      return false;
    }
  }, [updateUserSchoolMutation, store]);

  const removeUserFromSchool = React.useCallback(async (userSchoolId: Id<"userSchool">) => {
    try {
      store.setLoading(true);
      store.clearError();
      
      await removeUserFromSchoolMutation({
        userSchoolId,
      });
      
      store.setLoading(false);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al remover usuario de escuela';
      store.setError(errorMessage);
      store.setLoading(false);
      return false;
    }
  }, [removeUserFromSchoolMutation, store]);

  const deactivateUserInSchool = React.useCallback(async (userSchoolId: Id<"userSchool">) => {
    try {
      store.setLoading(true);
      store.clearError();
      
      await deactivateUserInSchoolMutation({
        userSchoolId,
      });
      
      store.setLoading(false);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al desactivar usuario en escuela';
      store.setError(errorMessage);
      store.setLoading(false);
      return false;
    }
  }, [deactivateUserInSchoolMutation, store]);

  const activateUserInSchool = React.useCallback(async (userSchoolId: Id<"userSchool">) => {
    try {
      store.setLoading(true);
      store.clearError();
      
      await activateUserInSchoolMutation({
        userSchoolId,
      });
      
      store.setLoading(false);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al activar usuario en escuela';
      store.setError(errorMessage);
      store.setLoading(false);
      return false;
    }
  }, [activateUserInSchoolMutation, store]);

  return React.useMemo(() => ({
    // Estado del store
    userSchools: store.userSchools,
    selectedSchool: store.selectedSchool,
    isLoading: store.isLoading,
    error: store.error,
    
    // Acciones
    fetchUserSchools,
    fetchUserActiveSchools,
    fetchUserSchool,
    assignUserToSchool,
    updateUserSchool,
    removeUserFromSchool,
    deactivateUserInSchool,
    activateUserInSchool,
    setSelectedSchool: store.setSelectedSchool,
    clearError: store.clearError,
    reset: store.reset,
  }), [
    store.userSchools,
    store.selectedSchool,
    store.isLoading,
    store.error,
    fetchUserSchools,
    fetchUserActiveSchools,
    fetchUserSchool,
    assignUserToSchool,
    updateUserSchool,
    removeUserFromSchool,
    deactivateUserInSchool,
    activateUserInSchool,
    store.setSelectedSchool,
    store.clearError,
    store.reset,
  ]);
};

// Hook para usar solo el store sin Convex (para casos simples)
export const useUserSchoolsStoreOnly = () => {
  return useUserSchoolsStore();
};

// Hook especializado para obtener la escuela actual por subdominio
export const useCurrentSchoolBySubdomain = (userId?: Id<"user">, subdomain?: string) => {
  // Query para obtener la escuela actual por subdominio
  const currentSchool = useQuery(
    api.functions.schools.getUserSchoolBySubdomain,
    userId && subdomain ? { userId, subdomain } : 'skip'
  );

  return React.useMemo(() => ({
    currentSchool: currentSchool || null,
    isLoading: currentSchool === undefined && !!userId && !!subdomain,
    error: null, // Convex maneja errores automáticamente
  }), [currentSchool, userId, subdomain]);
}; 