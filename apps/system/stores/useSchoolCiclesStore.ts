import { create } from 'zustand';
import { useQuery, useMutation, useConvex } from 'convex/react';
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from '@repo/convex/convex/_generated/dataModel';
import { useCallback, useEffect, useMemo } from 'react';

// Tipos para el ciclo escolar
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

// Estado del store
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

// Estado inicial
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
export const useCicloEscolarWithConvex = (schoolId?: Id<"school">) => {
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
        setCreateError,
        setUpdateError,
        setDeleteError,
        clearErrors,
        reset
    } = useCicloEscolarStore();

    // Queries para obtener ciclos escolares
    const ciclosEscolaresQuery = useQuery(
        api.functions.schoolCycles.ObtenerCiclosEscolares,
        schoolId ? { escuelaID: schoolId } : 'skip'
    );

    // Mutations
    const crearCicloEscolarMutation = useMutation(api.functions.schoolCycles.CrearCicloEscolar);
    const actualizarCicloEscolarMutation = useMutation(api.functions.schoolCycles.ActualizarCicloEscolar);
    const eliminarCicloEscolarMutation = useMutation(api.functions.schoolCycles.EliminarCicloEscolar);

    // Actualizar el store cuando cambien los ciclos escolares
    useEffect(() => {
        if (ciclosEscolaresQuery) {
            const mappedCiclos: CicloEscolar[] = ciclosEscolaresQuery.map((ciclo: any) => ({
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
        } else if (ciclosEscolaresQuery === null) {
            // Maneja el caso en que no hay ciclos y la query devuelve null
            setCiclosEscolares([]);
        }
    }, [ciclosEscolaresQuery, setCiclosEscolares]);

    // Manejar el estado de carga general
    useEffect(() => {
        setLoading(ciclosEscolaresQuery === undefined);
    }, [ciclosEscolaresQuery, setLoading]);

    // Funciones que usan las mutations de Convex
    const createCicloEscolar = useCallback(async (data: CreateCicloEscolarData) => {
        if (!data.schoolId) {
            setCreateError('No hay escuela seleccionada');
            return false;
        }

        setCreating(true);
        setCreateError(null);
        try {
            await crearCicloEscolarMutation({
                escuelaID: data.schoolId,
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
    }, [crearCicloEscolarMutation, setCreating, setCreateError]);

    const updateCicloEscolar = useCallback(async (data: UpdateCicloEscolarData) => {
        setUpdating(true);
        setUpdateError(null);
        try {
            await actualizarCicloEscolarMutation({
                cicloEscolarID: data.cicloEscolarID,
                escuelaID: data.schoolId,
                ...(data.name && { nombre: data.name }),
                ...(data.startDate && { fechaInicio: data.startDate }),
                ...(data.endDate && { fechaFin: data.endDate }),
                ...(data.status && { status: data.status }),
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
    
    // Exponer el estado y las acciones
    return {
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
        createCicloEscolar,
        updateCicloEscolar,
        deleteCicloEscolar,
        setSelectedCiclo,
        clearErrors,
        reset,
    };
};
