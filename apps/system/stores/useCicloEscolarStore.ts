import { create } from 'zustand';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../packages/convex/convex/_generated/api';
import { Id } from '../../../packages/convex/convex/_generated/dataModel';
import React from 'react';
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
  escuelaID: Id<"school">;
  nombre: string;
  fechaInicio: number;
  fechaFin: number;
  status: "active" | "archived" | "inactive";
}

// Tipos para actualizar ciclo escolar
export interface UpdateCicloEscolarData {
  nombre: string;
  fechaInicio: number;
  fechaFin: number;
  status: "active" | "archived" | "inactive";
}

// Estado del store
interface CicloEscolarState {
  // Estado inicial
  ciclosEscolares: CicloEscolar[];
  selectedCiclo: CicloEscolar | null;
  isLoading: boolean;
  error: string | null;
  
  // Setters básicos
  setCiclosEscolares: (ciclos: CicloEscolar[]) => void;
  setSelectedCiclo: (ciclo: CicloEscolar | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Reset del store
  reset: () => void;
}

// Store principal de Zustand
export const useCicloEscolarStore = create<CicloEscolarState>((set, get) => ({
  // Estado inicial
  ciclosEscolares: [],
  selectedCiclo: null,
  isLoading: false,
  error: null,

  // Setters básicos
  setCiclosEscolares: (ciclos) => set({ ciclosEscolares: ciclos }),
  setSelectedCiclo: (ciclo) => set({ selectedCiclo: ciclo }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Reset del store
  reset: () => set({
    ciclosEscolares: [],
    selectedCiclo: null,
    isLoading: false,
    error: null,
  }),
}));

// Función auxiliar para comparar arrays
function areArraysEqual(arr1: any[], arr2: any[]) {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((item, index) => JSON.stringify(item) === JSON.stringify(arr2[index]));
}

// Hook personalizado que combina Zustand con Convex
export const useCicloEscolarWithConvex = () => {
  const store = useCicloEscolarStore();
  
  // CAMBIO PRINCIPAL: Obtener userId y schoolId correctamente
  const { user } = useUser();
  const userId = user?.publicMetadata?.userId as Id<"user">;
  const { currentSchool, isLoading: isSchoolLoading } = useCurrentSchool(userId);
  const escuelaID = currentSchool?.school._id;

  // Queries para obtener ciclos escolares - SOLO si tenemos escuelaID
  const ciclosEscolares = useQuery(
    api.functions.ciclosEscolares.ObtenerCiclosEscolares,
    escuelaID ? { escuelaID } : 'skip'
  );
  
  // Mutations
  const crearCicloEscolarMutation = useMutation(api.functions.ciclosEscolares.CrearCicloEscolar);
  const actualizarCicloEscolarMutation = useMutation(api.functions.ciclosEscolares.ActualizarCicloEscolar);
  const eliminarCicloEscolarMutation = useMutation(api.functions.ciclosEscolares.EliminarCicloEscolar);

  // Actualizar el store cuando cambien los ciclos escolares
  React.useEffect(() => {
    if (ciclosEscolares !== undefined) {
      const mappedCiclos: CicloEscolar[] = ciclosEscolares.map(ciclo => ({
        _id: ciclo._id,
        schoolId: ciclo.schoolId,
        name: ciclo.name,
        startDate: ciclo.startDate,
        endDate: ciclo.endDate,
        status: ciclo.status,
        createdAt: ciclo._creationTime || ciclo.createdAt,
        updatedAt: ciclo.updatedAt,
      }));
      
      // Solo actualizar si los ciclos han cambiado
      if (!areArraysEqual(store.ciclosEscolares, mappedCiclos)) {
        store.setCiclosEscolares(mappedCiclos);
      }
      
      // Siempre establecer loading como false cuando tenemos datos
      if (store.isLoading) {
        store.setLoading(false);
      }
    } else if (escuelaID && !isSchoolLoading) {
      // Solo establecer loading como true si tenemos una escuelaID pero no datos
      if (!store.isLoading) {
        store.setLoading(true);
      }
    }
  }, [ciclosEscolares, escuelaID, isSchoolLoading, store.ciclosEscolares.length]);

  // Funciones que usan las mutations de Convex
  const fetchCiclosEscolares = React.useCallback(async (escuelaID: Id<"school">) => {
    try {
      // Los datos se actualizarán automáticamente a través del useEffect
      return useCicloEscolarStore.getState().ciclosEscolares;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener ciclos escolares';
      store.setError(errorMessage);
      return [];
    }
  }, [store]);

  const fetchCicloEscolarById = React.useCallback(async (cicloEscolarID: Id<"schoolCycle">) => {
    try {
      // Para obtener un ciclo específico, podemos buscarlo en el store actual
      const ciclos = useCicloEscolarStore.getState().ciclosEscolares;
      const cicloEncontrado = ciclos.find(ciclo => ciclo._id === cicloEscolarID);
      
      return cicloEncontrado || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener ciclo escolar';
      store.setError(errorMessage);
      return null;
    }
  }, [store]);

  const createCicloEscolar = React.useCallback(async (data: CreateCicloEscolarData) => {
    if (!escuelaID) {
      store.setError('No hay escuela seleccionada');
      return false;
    }

    try {
      store.setLoading(true);
      store.clearError();
      
      console.log('Enviando datos a Convex:', data); // Debug
      
      const result = await crearCicloEscolarMutation(data);
      console.log('Respuesta de Convex:', result); // Debug
      
      store.setLoading(false);
      return true;
    } catch (error) {
      console.error('Error en createCicloEscolar:', error); // Debug
      const errorMessage = error instanceof Error ? error.message : 'Error al crear ciclo escolar';
      store.setError(errorMessage);
      store.setLoading(false);
      return false;
    }
  }, [crearCicloEscolarMutation, store, escuelaID]);

  const updateCicloEscolar = React.useCallback(async (
    cicloEscolarID: Id<"schoolCycle">, 
    escuelaID: Id<"school">, 
    data: UpdateCicloEscolarData
  ) => {
    try {
      store.setLoading(true);
      store.clearError();
      
      await actualizarCicloEscolarMutation({
        cicloEscolarID,
        escuelaID,
        nombre: data.nombre,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        status: data.status,
      });
      
      store.setLoading(false);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar ciclo escolar';
      store.setError(errorMessage);
      store.setLoading(false);
      return false;
    }
  }, [actualizarCicloEscolarMutation, store]);

  const deleteCicloEscolar = React.useCallback(async (cicloEscolarID: Id<"schoolCycle">) => {
    try {
      store.setLoading(true);
      store.clearError();
      
      await eliminarCicloEscolarMutation({
        cicloEscolarID,
      });
      
      store.setLoading(false);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar ciclo escolar';
      store.setError(errorMessage);
      store.setLoading(false);
      return false;
    }
  }, [eliminarCicloEscolarMutation, store]);

  return {
    // Estado del store
    ciclosEscolares: store.ciclosEscolares,
    selectedCiclo: store.selectedCiclo,
    isLoading: store.isLoading || isSchoolLoading,
    error: store.error,
    
    // Información adicional
    userId,
    escuelaID,
    currentSchool,
    
    // Acciones
    fetchCiclosEscolares,
    fetchCicloEscolarById,
    createCicloEscolar,
    updateCicloEscolar,
    deleteCicloEscolar,
    setSelectedCiclo: store.setSelectedCiclo,
    clearError: store.clearError,
    reset: store.reset,
  };
};

// Hook para usar solo el store sin Convex (para casos simples)
export const useCicloEscolarStoreOnly = () => {
  return useCicloEscolarStore();
};

// Hook especializado para obtener un ciclo específico por ID
export const useCicloEscolarById = (cicloEscolarID?: Id<"schoolCycle">) => {
  // Query para obtener un ciclo específico por ID
  const cicloEscolar = useQuery(
    api.functions.ciclosEscolares.ObtenerCiclosEscolaresPorId,
    cicloEscolarID ? { cicloEscolarID } : 'skip'
  );

  return React.useMemo(() => ({
    cicloEscolar: cicloEscolar ? {
      _id: cicloEscolar._id,
      schoolId: cicloEscolar.schoolId,
      name: cicloEscolar.name,
      startDate: cicloEscolar.startDate,
      endDate: cicloEscolar.endDate,
      status: cicloEscolar.status,
      createdAt: cicloEscolar.createdAt,
      updatedAt: cicloEscolar.updatedAt,
    } as CicloEscolar : null,
    isLoading: cicloEscolar === undefined && !!cicloEscolarID,
    error: null, // Convex maneja errores automáticamente
  }), [cicloEscolar, cicloEscolarID]);
};