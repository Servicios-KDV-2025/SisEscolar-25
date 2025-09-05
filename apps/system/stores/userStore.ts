import { create } from 'zustand';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../packages/convex/convex/_generated/api';
import { Id } from '../../../packages/convex/convex/_generated/dataModel';
import React from 'react';

// Tipos para el usuario
export interface User {
  _id: Id<"user">;
  name: string;
  lastName?: string;
  email: string;
  phone?: string;
  address?: string;
  birthDate?: number;
  admissionDate?: number;
  imgUrl?: string;
  createdAt: number;
  updatedAt: number;
  clerkId: string;
  status?: 'active' | 'inactive';
}

// Tipos para actualizar usuario
export interface UpdateUserData {
  name?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  birthDate?: number;
  admissionDate?: number;
  imgUrl?: string;
  status?: 'active' | 'inactive';
}

// Estado del store
interface UserState {
  // Estado del usuario actual
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  setCurrentUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Funciones para manejar datos del usuario
  fetchUserByClerkId: (clerkId: string) => Promise<User | null>;
  updateUserData: (userId: Id<"user">, data: UpdateUserData) => Promise<User | null>;
  deactivateUser: (userId: Id<"user">) => Promise<boolean>;
  deleteUser: (userId: Id<"user">) => Promise<boolean>;
  
  // Reset del store
  reset: () => void;
}

// Hook personalizado para usar el store con Convex
export const useUserStore = create<UserState>((set, get) => ({
  // Estado inicial
  currentUser: null,
  isLoading: false,
  error: null,

  // Setters básicos
  setCurrentUser: (user) => set({ currentUser: user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Obtener usuario por Clerk ID
  fetchUserByClerkId: async (clerkId: string) => {
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

  // Actualizar datos del usuario
  updateUserData: async (userId: Id<"user">, data: UpdateUserData) => {
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

  // Desactivar usuario
  deactivateUser: async (userId: Id<"user">) => {
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

  // Eliminar usuario permanentemente
  deleteUser: async (userId: Id<"user">) => {
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
    currentUser: null,
    isLoading: false,
    error: null,
  }),
}));

// Hook personalizado que combina Zustand con Convex
export const useUserWithConvex = (clerkId?: string) => {
  const store = useUserStore();
  
  // Query para obtener usuario por Clerk ID
  const user = useQuery(
    api.functions.users.getUserByClerkId,
    clerkId ? { clerkId } : 'skip'
  );
  
  // Mutations
  const updateUserMutation = useMutation(api.functions.users.updateUser);
  const deactivateUserMutation = useMutation(api.functions.users.deactivateUser);
  const deleteUserMutation = useMutation(api.functions.users.deleteUser);

  // Actualizar el store cuando cambie el usuario
  React.useEffect(() => {
    if (user) {
      store.setCurrentUser(user);
    } else if (clerkId) {
      store.setCurrentUser(null);
    }
  }, [user, clerkId]);

  // Funciones que usan las mutations de Convex
  const updateUserData = React.useCallback(async (data: UpdateUserData) => {
    // Obtener el usuario actual en el momento de la ejecución
    const currentUser = useUserStore.getState().currentUser;
    if (!currentUser) {
      store.setError('No hay usuario autenticado');
      return null;
    }

    try {
      store.setLoading(true);
      store.clearError();
      
      const updatedUser = await updateUserMutation({
        userId: currentUser._id,
        ...data,
      });
      
      if (updatedUser) {
        store.setCurrentUser(updatedUser);
      }
      
      store.setLoading(false);
      return updatedUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar usuario';
      store.setError(errorMessage);
      store.setLoading(false);
      return null;
    }
  }, [updateUserMutation, store]);

  const deactivateUser = React.useCallback(async () => {
    // Obtener el usuario actual en el momento de la ejecución
    const currentUser = useUserStore.getState().currentUser;
    if (!currentUser) {
      store.setError('No hay usuario autenticado');
      return false;
    }

    try {
      store.setLoading(true);
      store.clearError();
      
      const result = await deactivateUserMutation({
        userId: currentUser._id,
      });
      
      if (result) {
        store.setCurrentUser(result);
      }
      
      store.setLoading(false);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al desactivar usuario';
      store.setError(errorMessage);
      store.setLoading(false);
      return false;
    }
  }, [deactivateUserMutation, store]);

  const deleteUser = React.useCallback(async () => {
    // Obtener el usuario actual en el momento de la ejecución
    const currentUser = useUserStore.getState().currentUser;
    if (!currentUser) {
      store.setError('No hay usuario autenticado');
      return false;
    }

    try {
      store.setLoading(true);
      store.clearError();
      
      await deleteUserMutation({
        userId: currentUser._id,
      });
      
      store.reset();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar usuario';
      store.setError(errorMessage);
      store.setLoading(false);
      return false;
    }
  }, [deleteUserMutation, store]);

  return React.useMemo(() => ({
    // Estado del store
    currentUser: store.currentUser,
    isLoading: store.isLoading,
    error: store.error,
    
    // Acciones
    updateUserData,
    deactivateUser,
    deleteUser,
    clearError: store.clearError,
    reset: store.reset,
  }), [
    store.currentUser,
    store.isLoading,
    store.error,
    updateUserData,
    deactivateUser,
    deleteUser,
    store.clearError,
    store.reset,
  ]);
};

// Hook para usar solo el store sin Convex (para casos simples)
export const useUserStoreOnly = () => {
  return useUserStore();
}; 