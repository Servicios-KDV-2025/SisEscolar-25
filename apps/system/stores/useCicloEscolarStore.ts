import { create } from 'zustand';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../packages/convex/convex/_generated/api';
import { Id } from '../../../packages/convex/convex/_generated/dataModel';
import React from 'react';

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
  
  // Acciones asíncronas
  fetchCiclosEscolares: (escuelaID: Id<"school">) => Promise<CicloEscolar[]>;
  fetchCicloEscolarById: (cicloEscolarID: Id<"schoolCycle">) => Promise<CicloEscolar | null>;
  createCicloEscolar: (data: CreateCicloEscolarData) => Promise<boolean>;
  updateCicloEscolar: (cicloEscolarID: Id<"schoolCycle">, escuelaID: Id<"school">, data: UpdateCicloEscolarData) => Promise<boolean>;
  deleteCicloEscolar: (cicloEscolarID: Id<"schoolCycle">) => Promise<boolean>;
  
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

  // Obtener ciclos escolares por escuela
  fetchCiclosEscolares: async (escuelaID: Id<"school">) => {
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

  // Obtener ciclo escolar por ID
  fetchCicloEscolarById: async (cicloEscolarID: Id<"schoolCycle">) => {
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

  // Crear ciclo escolar
  createCicloEscolar: async (data: CreateCicloEscolarData) => {
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

  // Actualizar ciclo escolar
  updateCicloEscolar: async (cicloEscolarID: Id<"schoolCycle">, escuelaID: Id<"school">, data: UpdateCicloEscolarData) => {
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

  // Eliminar ciclo escolar
  deleteCicloEscolar: async (cicloEscolarID: Id<"schoolCycle">) => {
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
    ciclosEscolares: [],
    selectedCiclo: null,
    isLoading: false,
    error: null,
  }),
}));

// Hook personalizado que combina Zustand con Convex
export const useCicloEscolarWithConvex = (escuelaID?: Id<"school">) => {
  const store = useCicloEscolarStore();
  
  // Queries para obtener ciclos escolares
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
    if (ciclosEscolares) {
      // Mapear los datos de Convex al formato esperado por el store
      const mappedCiclos: CicloEscolar[] = ciclosEscolares.map(ciclo => ({
        _id: ciclo._id,
        schoolId: ciclo.schoolId,
        name: ciclo.name,
        startDate: ciclo.startDate,
        endDate: ciclo.endDate,
        status: ciclo.status,
        createdAt: ciclo.createdAt,
        updatedAt: ciclo.updatedAt,
      }));
      store.setCiclosEscolares(mappedCiclos);
    } else if (escuelaID) {
      store.setCiclosEscolares([]);
    }
  }, [ciclosEscolares, escuelaID, store]);

  // Funciones que usan las mutations de Convex
  const fetchCiclosEscolares = React.useCallback(async (escuelaID: Id<"school">) => {
    try {
      store.setLoading(true);
      store.clearError();
      
      // Los datos se actualizarán automáticamente a través del useEffect
      // que escucha cambios en la query ciclosEscolares
      store.setLoading(false);
      return useCicloEscolarStore.getState().ciclosEscolares;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener ciclos escolares';
      store.setError(errorMessage);
      store.setLoading(false);
      return [];
    }
  }, [store]);

  const fetchCicloEscolarById = React.useCallback(async (cicloEscolarID: Id<"schoolCycle">) => {
    try {
      store.setLoading(true);
      store.clearError();
      
      // Para obtener un ciclo específico, podemos buscarlo en el store actual
      // o crear una query específica si es necesario
      const ciclos = useCicloEscolarStore.getState().ciclosEscolares;
      const cicloEncontrado = ciclos.find(ciclo => ciclo._id === cicloEscolarID);
      
      store.setLoading(false);
      return cicloEncontrado || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener ciclo escolar';
      store.setError(errorMessage);
      store.setLoading(false);
      return null;
    }
  }, [store]);

  const createCicloEscolar = React.useCallback(async (data: CreateCicloEscolarData) => {
    try {
      store.setLoading(true);
      store.clearError();
      
      await crearCicloEscolarMutation(data);
      
      store.setLoading(false);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear ciclo escolar';
      store.setError(errorMessage);
      store.setLoading(false);
      return false;
    }
  }, [crearCicloEscolarMutation, store]);

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

  return React.useMemo(() => ({
    // Estado del store
    ciclosEscolares: store.ciclosEscolares,
    selectedCiclo: store.selectedCiclo,
    isLoading: store.isLoading,
    error: store.error,
    
    // Acciones
    fetchCiclosEscolares,
    fetchCicloEscolarById,
    createCicloEscolar,
    updateCicloEscolar,
    deleteCicloEscolar,
    setSelectedCiclo: store.setSelectedCiclo,
    clearError: store.clearError,
    reset: store.reset,
  }), [
    store.ciclosEscolares,
    store.selectedCiclo,
    store.isLoading,
    store.error,
    fetchCiclosEscolares,
    fetchCicloEscolarById,
    createCicloEscolar,
    updateCicloEscolar,
    deleteCicloEscolar,
    store.setSelectedCiclo,
    store.clearError,
    store.reset,
  ]);
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