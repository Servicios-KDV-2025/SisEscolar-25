"use client";

import { create } from "zustand";
import { useAction } from "convex/react";
import React from "react";
import { api } from "@repo/convex/convex/_generated/api";

// Tipos para las acciones de usuario
export type CreateUserData = {
  email: string;
  password: string;
  name: string;
  lastName: string;
  phone: string;
  address: string;
};

export type UpdateUserData = {
  email?: string;
  password?: string;
  name?: string;
  lastName?: string;
  phone?: string;
  address?: string;
};

export type UserActionResponse = {
  success: boolean;
  message?: string;
  error?: string;
  userId?: string;
};

// Estado del store
interface UserActionsState {
  // Estados de carga
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Manejo de errores específicos por operación
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;

  // Último resultado de operación
  lastResult: UserActionResponse | null;

  // Acciones básicas del estado
  setCreating: (creating: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setDeleting: (deleting: boolean) => void;
  setCreateError: (error: string | null) => void;
  setUpdateError: (error: string | null) => void;
  setDeleteError: (error: string | null) => void;
  setLastResult: (result: UserActionResponse | null) => void;
  clearErrors: () => void;
  clearLastResult: () => void;

  // Reset del store
  reset: () => void;
}

// Estado inicial
const initialState = {
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  createError: null,
  updateError: null,
  deleteError: null,
  lastResult: null,
};

// Store de Zustand
export const useUserActionsStore = create<UserActionsState>((set) => ({
  ...initialState,

  // Setters básicos
  setCreating: (creating) => set({ isCreating: creating }),
  setUpdating: (updating) => set({ isUpdating: updating }),
  setDeleting: (deleting) => set({ isDeleting: deleting }),
  setCreateError: (error) => set({ createError: error }),
  setUpdateError: (error) => set({ updateError: error }),
  setDeleteError: (error) => set({ deleteError: error }),
  setLastResult: (result) => set({ lastResult: result }),

  // Limpiar errores
  clearErrors: () => set({
    createError: null,
    updateError: null,
    deleteError: null,
  }),

  // Limpiar último resultado
  clearLastResult: () => set({ lastResult: null }),

  // Reset del store
  reset: () => set(initialState),
}));

// Hook que combina Zustand con Convex para operaciones de usuario
export const useUserActionsWithConvex = () => {
  const store = useUserActionsStore();

  // Actions de Convex
  const createUserAction = useAction(api.functions.actions.users.createUser);
  const updateUserAction = useAction(api.functions.actions.users.updateUser);
  const deleteUserAction = useAction(api.functions.actions.users.deleteUser);

  // Función para crear usuario
  const createUser = React.useCallback(async (data: CreateUserData): Promise<UserActionResponse> => {
    try {
      store.setCreating(true);
      store.setCreateError(null);
      store.clearLastResult();

      const result = await createUserAction(data);

      // Asegurar que result tenga el tipo correcto
      const typedResult: UserActionResponse = {
        success: result.success,
        message: result.message,
        error: typeof result.error === 'string' ? result.error : undefined,
        userId: result.userId
      };

      store.setLastResult(typedResult);
      store.setCreating(false);

      if (!typedResult.success && typedResult.error) {
        store.setCreateError(typedResult.error);
      }

      return typedResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear usuario';
      const errorResult: UserActionResponse = {
        success: false,
        error: errorMessage,
      };

      store.setCreateError(errorMessage);
      store.setLastResult(errorResult);
      store.setCreating(false);

      return errorResult;
    }
  }, [createUserAction, store]);

  // Función para actualizar usuario
  const updateUser = React.useCallback(async (userId: string, data: UpdateUserData): Promise<UserActionResponse> => {
    try {
      store.setUpdating(true);
      store.setUpdateError(null);
      store.clearLastResult();

      const result = await updateUserAction({ userId, ...data });

      // Asegurar que result tenga el tipo correcto
      const typedResult: UserActionResponse = {
        success: result.success,
        message: result.message,
        error: typeof result.error === 'string' ? result.error : undefined,
        userId: result.userId
      };

      store.setLastResult(typedResult);
      store.setUpdating(false);

      if (!typedResult.success && typedResult.error) {
        store.setUpdateError(typedResult.error);
      }

      return typedResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar usuario';
      const errorResult: UserActionResponse = {
        success: false,
        error: errorMessage,
      };

      store.setUpdateError(errorMessage);
      store.setLastResult(errorResult);
      store.setUpdating(false);

      return errorResult;
    }
  }, [updateUserAction, store]);

  // Función para eliminar usuario
  const deleteUser = React.useCallback(async (userId: string): Promise<UserActionResponse> => {
    try {
      store.setDeleting(true);
      store.setDeleteError(null);
      store.clearLastResult();

      const result = await deleteUserAction({ userId });

      // Si no hay resultado (undefined), consideramos que fue exitoso
      const finalResult: UserActionResponse = result || {
        success: true,
        message: "Usuario eliminado exitosamente",
      };

      store.setLastResult(finalResult);
      store.setDeleting(false);

      if (!finalResult.success && finalResult.error) {
        store.setDeleteError(finalResult.error);
      }

      return finalResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar usuario';
      const errorResult: UserActionResponse = {
        success: false,
        error: errorMessage,
      };

      store.setDeleteError(errorMessage);
      store.setLastResult(errorResult);
      store.setDeleting(false);

      return errorResult;
    }
  }, [deleteUserAction, store]);

  return React.useMemo(() => ({
    // Estado del store
    isCreating: store.isCreating,
    isUpdating: store.isUpdating,
    isDeleting: store.isDeleting,
    createError: store.createError,
    updateError: store.updateError,
    deleteError: store.deleteError,
    lastResult: store.lastResult,

    // Acciones
    createUser,
    updateUser,
    deleteUser,

    // Utilidades
    clearErrors: store.clearErrors,
    clearLastResult: store.clearLastResult,
    reset: store.reset,

    // Estados derivados útiles
    hasAnyError: !!(store.createError || store.updateError || store.deleteError),
    isAnyLoading: store.isCreating || store.isUpdating || store.isDeleting,
  }), [
    store.isCreating,
    store.isUpdating,
    store.isDeleting,
    store.createError,
    store.updateError,
    store.deleteError,
    store.lastResult,
    createUser,
    updateUser,
    deleteUser,
    store.clearErrors,
    store.clearLastResult,
    store.reset,
  ]);
};

// Hook para usar solo el store sin Convex (para casos donde no se necesitan las acciones automáticas)
export const useUserActionsStoreOnly = () => {
  return useUserActionsStore();
};
