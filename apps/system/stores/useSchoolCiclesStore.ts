import { create } from 'zustand';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../packages/convex/convex/_generated/api';
import { Id } from '../../../packages/convex/convex/_generated/dataModel';
import { useCallback, useEffect, useMemo } from 'react';
import { useCurrentSchool } from './userSchoolsStore';
import { useUser } from '@clerk/nextjs';

// Tipos para el ciclo escolar (ajustados para coincidir con tu schema de Convex)
export interface CicloEscolar {
  _id: Id<"schoolCycle">;
  schoolId: Id<"school">;
  name: string;
  startDate: number;
  endDate: number;
  status: "active" | "archived" | "inactive";
  createdAt: number;
  updatedAt?: number;
}

// Tipos para crear ciclo escolar
export interface CreateCicloEscolarData {
  schoolId: Id<"school">;
  name: string;
  startDate: number;
  endDate: number;
  status: "active" | "archived" | "inactive";
}

// Tipos para actualizar ciclo escolar
export interface UpdateCicloEscolarData {
  cicloEscolarID: Id<"schoolCycle">;
  schoolId: Id<"school">;
  name?: string;
  startDate?: number;
  endDate?: number;
  status?: "active" | "archived" | "inactive";
}

// Estado del store con manejo de errores y estados de carga específicos
export interface CicloEscolarStore {
  ciclosEscolares: CicloEscolar[];
  selectedCiclo: CicloEscolar | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;

  // Setters básicos
  setCiclosEscolares: (ciclos: CicloEscolar[]) => void;
  setSelectedCiclo: (ciclo: CicloEscolar | null) => void;
  setLoading: (loading: boolean) => void;
  setCreating: (creating: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setDeleting: (deleting: boolean) => void;
  setError: (error: string | null) => void;
  setCreateError: (error: string | null) => void;
  setUpdateError: (error: string | null) => void;
  setDeleteError: (error: string | null) => void;
  clearErrors: () => void;
  reset: () => void;
}

// Estado inicial sin los setters, solo las propiedades de datos
const initialState = {
  ciclosEscolares: [],
  selectedCiclo: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  createError: null,
  updateError: null,
  deleteError: null,
};

// Store principal de Zustand
export const useCicloEscolarStore = create<CicloEscolarStore>((set) => ({
  ...initialState,
  setCiclosEscolares: (ciclos) => set({ ciclosEscolares: ciclos }),
  setSelectedCiclo: (ciclo) => set({ selectedCiclo: ciclo }),
  setLoading: (loading) => set({ isLoading: loading }),
  setCreating: (creating) => set({ isCreating: creating }),
  setUpdating: (updating) => set({ isUpdating: updating }),
  setDeleting: (deleting) => set({ isDeleting: deleting }),
  setError: (error) => set({ error }),
  setCreateError: (error) => set({ createError: error }),
  setUpdateError: (error) => set({ updateError: error }),
  setDeleteError: (error) => set({ deleteError: error }),
  clearErrors: () => set({
    error: null,
    createError: null,
    updateError: null,
    deleteError: null,
  }),
  reset: () => set(initialState),
}));

// Hook personalizado que combina Zustand con Convex
export const useCicloEscolarWithConvex = () => {
  const {
    ciclosEscolares,
    selectedCiclo,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    createError,
    updateError,
    deleteError,
    setCiclosEscolares,
    setSelectedCiclo,
    setLoading,
    setCreating,
    setUpdating,
    setDeleting,
    setError,
    setCreateError,
    setUpdateError,
    setDeleteError,
    clearErrors,
    reset
  } = useCicloEscolarStore();

  // Obtener userId y schoolId correctamente
  const { user } = useUser();
  const userId = user?.publicMetadata?.userId as Id<"user">;
  const { currentSchool, isLoading: isSchoolLoading } = useCurrentSchool(userId);
  const schoolId = currentSchool?.school._id;

  // Queries para obtener ciclos escolares - SOLO si tenemos schoolId
  const ciclosEscolaresQuery = useQuery(
    // FIX: Usar el nombre de la función de Convex que proporcionaste
    api.functions.schoolCycles.ObtenerCiclosEscolares,
    // FIX: Usar el nombre de la propiedad de Convex que proporcionaste
    schoolId ? { escuelaID: schoolId } : 'skip'
  );

  // Mutations
  const crearCicloEscolarMutation = useMutation(api.functions.schoolCycles.CrearCicloEscolar);
  const actualizarCicloEscolarMutation = useMutation(api.functions.schoolCycles.ActualizarCicloEscolar);
  const eliminarCicloEscolarMutation = useMutation(api.functions.schoolCycles.EliminarCicloEscolar);

  // Actualizar el store cuando cambien los ciclos escolares
  useEffect(() => {
    if (ciclosEscolaresQuery !== undefined) {
      const mappedCiclos: CicloEscolar[] = ciclosEscolaresQuery.map(ciclo => ({
        _id: ciclo._id,
        schoolId: ciclo.schoolId,
        name: ciclo.name,
        startDate: ciclo.startDate,
        endDate: ciclo.endDate,
        status: ciclo.status,
        createdAt: ciclo._creationTime,
        updatedAt: ciclo.updatedAt,
      }));
      setCiclosEscolares(mappedCiclos);
    }
  }, [ciclosEscolaresQuery, setCiclosEscolares]);

  // Manejar el estado de carga general
  useEffect(() => {
    setLoading(isSchoolLoading || ciclosEscolaresQuery === undefined);
  }, [isSchoolLoading, ciclosEscolaresQuery, setLoading]);

  // Funciones que usan las mutations de Convex
  const createCicloEscolar = useCallback(async (data: CreateCicloEscolarData) => {
    if (!schoolId) {
      setCreateError('No hay escuela seleccionada');
      return false;
    }

    setCreating(true);
    setCreateError(null);
    try {
      await crearCicloEscolarMutation({
        // FIX: Mapear la propiedad 'schoolId' a 'escuelaID' para la función de Convex
        escuelaID: schoolId,
        nombre: data.name,
        fechaInicio: data.startDate,
        fechaFin: data.endDate,
        status: data.status,
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear ciclo escolar';
      setCreateError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setCreating(false);
    }
  }, [crearCicloEscolarMutation, schoolId, setCreating, setCreateError]);


  const updateCicloEscolar = useCallback(async (data: UpdateCicloEscolarData) => {
    setUpdating(true);
    setUpdateError(null);
    try {
      await actualizarCicloEscolarMutation({
        // FIX: Mapear las propiedades del objeto 'data' a los argumentos de la función de Convex
        cicloEscolarID: data.cicloEscolarID,
        escuelaID: data.schoolId, // El nombre de la propiedad en Convex es 'escuelaID'
        nombre: data.name,
        fechaInicio: data.startDate,
        fechaFin: data.endDate,
        status: data.status,
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar ciclo escolar';
      setUpdateError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUpdating(false);
    }
  }, [actualizarCicloEscolarMutation, setUpdating, setUpdateError]);


  const deleteCicloEscolar = useCallback(async (cicloEscolarID: Id<"schoolCycle">) => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await eliminarCicloEscolarMutation({ cicloEscolarID });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar ciclo escolar';
      setDeleteError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setDeleting(false);
    }
  }, [eliminarCicloEscolarMutation, setDeleting, setDeleteError]);

  // Hook especializado para obtener un ciclo específico por ID desde el store
  const getCicloEscolarById = useCallback((cicloEscolarID: Id<"schoolCycle">) => {
    return ciclosEscolares.find(c => c._id === cicloEscolarID) || null;
  }, [ciclosEscolares]);
  
  // Exponer el estado y las acciones
  const storeState = useMemo(() => ({
    ciclosEscolares,
    selectedCiclo,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    createError,
    updateError,
    deleteError,
    schoolId,
    currentSchool,
  }), [
    ciclosEscolares,
    selectedCiclo,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    createError,
    updateError,
    deleteError,
    schoolId,
    currentSchool,
  ]);

  const storeActions = useMemo(() => ({
    createCicloEscolar,
    updateCicloEscolar,
    deleteCicloEscolar,
    setSelectedCiclo,
    getCicloEscolarById,
    clearErrors,
    reset,
  }), [
    createCicloEscolar,
    updateCicloEscolar,
    deleteCicloEscolar,
    setSelectedCiclo,
    getCicloEscolarById,
    clearErrors,
    reset
  ]);

  return {
    ...storeState,
    ...storeActions,
  };
};

// Hook para usar solo el store sin Convex (para casos simples)
export const useCicloEscolarStoreOnly = () => {
  return useCicloEscolarStore();
};

