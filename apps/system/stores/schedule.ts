import { create } from "zustand";
import { api } from "@repo/convex/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { useCallback, useEffect } from "react";
import { Id } from "@repo/convex/convex/_generated/dataModel";

// Tipo de HORARIO basado en tu schema de Convex
export type Schedule = {
  _id: string;
  schoolId: string;
  name: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'inactive';
  updatedAt: number;
};

// Tipos para crear y actualizar horarios
export type CreateScheduleData = {
  schoolId: string;
  name: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'inactive';
  updatedAt: number;
};

export type UpdateScheduleData = {
  id: string;
  schoolId: string;
  name?: string;
  startTime?: string;
  endTime?: string;
  status?: 'active' | 'inactive';
  updatedAt?: number;
};

// Store de Horarios con CRUD completo
export type ScheduleStore = {
  schedule: Schedule[];
  selectedSchedule: Schedule | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
  setSchedule: (schedule: Schedule[]) => void;
  setSelectedSchedule: (schedule: Schedule | null) => void;
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
};

const initialState = {
  schedule: [],
  selectedSchedule: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  createError: null,
  updateError: null,
  deleteError: null,
};

export const useScheduleStore = create<ScheduleStore>((set) => ({
  ...initialState,
  setSchedule: (schedule) => set({ schedule }),
  setSelectedSchedule: (selectedSchedule) => set({ selectedSchedule }),
  setLoading: (isLoading) => set({ isLoading }),
  setCreating: (isCreating) => set({ isCreating }),
  setUpdating: (isUpdating) => set({ isUpdating }),
  setDeleting: (isDeleting) => set({ isDeleting }),
  setError: (error) => set({ error }),
  setCreateError: (createError) => set({ createError }),
  setUpdateError: (updateError) => set({ updateError }),
  setDeleteError: (deleteError) => set({ deleteError }),
  clearErrors: () => set({
    error: null,
    createError: null,
    updateError: null,
    deleteError: null,
  }),
  reset: () => set(initialState),
}));

type ScheduleQueryData = {
  _id: string;
  schoolId: string;
  name: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'inactive';
  updatedAt: number;
};

// export const useSchdule = (schoolId?: string) => {
export const useSchdule = (schoolId?: Id<'school'>) => {
  const {
    schedule,
    selectedSchedule,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    createError,
    updateError,
    deleteError,
    setSchedule,
    setSelectedSchedule,
    setCreating,
    setUpdating,
    setDeleting,
    setCreateError,
    setUpdateError,
    setDeleteError,
    clearErrors,
  } = useScheduleStore();

  // Query para obtener los horario de la escuela
  const scheduleQuery = useQuery(
    api.functions.schedule.getSchedulesBySchools,
    // schoolId ? { schoolId: schoolId as Id<"school"> } : "skip"
    schoolId ? { schoolId } : "skip"
  );

  // Mutations
  const createScheduleMutation = useMutation(api.functions.schedule.createSchedule);
  const updateScheduleMutation = useMutation(api.functions.schedule.updateSchedule);
  const deleteScheduleMutation = useMutation(api.functions.schedule.deleteSchedule);

  // CREATE
  const createSchedule = useCallback(async (data: CreateScheduleData) => {
    setCreating(true);
    setCreateError(null);
    try {
      await createScheduleMutation({
        ...data,
        schoolId: data.schoolId as Id<"school">,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear periodo';
      setCreateError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setCreating(false);
    }
  }, [createScheduleMutation, setCreating, setCreateError]);

  // UPDATE
  const updateSchedule = useCallback(async (data: UpdateScheduleData) => {
    setUpdating(true);
    setUpdateError(null);
    try {
      await updateScheduleMutation({
        id: data.id as Id<"schedule">,
        schoolId: data.schoolId as Id<"school">,
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status,
        updatedAt: data.updatedAt ?? Date.now(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar horario';
      setUpdateError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUpdating(false);
    }
  }, [updateScheduleMutation, setUpdating, setUpdateError]);

  // DELETE
  const deleteSchedule = useCallback(async (id: string, schoolId: string) => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteScheduleMutation({
        id: id as Id<"schedule">,
        schoolId: schoolId as Id<"school">,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar horario';
      setDeleteError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setDeleting(false);
    }
  }, [deleteScheduleMutation, setDeleting, setDeleteError]);

  // Refrescar periodos cuando cambie la query
  useEffect(() => {
    if (scheduleQuery) {
      setSchedule(
        (scheduleQuery as ScheduleQueryData[]).map((p) => ({
          _id: p._id,
          schoolId: p.schoolId,
          name: p.name,
          startTime: p.startTime,
          endTime: p.endTime,
          status: p.status,
          updatedAt: p.updatedAt,
        }))
      );
    }
  }, [scheduleQuery, setSchedule]);

  return {
    schedule,
    selectedSchedule,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    createError,
    updateError,
    deleteError,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    setSelectedSchedule,
    clearErrors,
  };
}; 