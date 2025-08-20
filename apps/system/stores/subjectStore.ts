"use client";

import { create } from "zustand";
import { useQuery, useMutation } from "convex/react";
import { useCallback, useEffect } from "react";
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";

export type Subject = {
    _id: Id<"subject">;
    _creationTime: number;
    schoolId: Id<"school">;
    name: string;
    description?: string;
    credits?: number;
    status: 'active' | 'inactive';
    updatedAt: number;
    updatedBy: Id<"user">;
};

// Tipo para crear materia (sin _id y con campos opcionales)
export type CreateSubjectData = {
    schoolId: Id<"school">;
    name: string;
    description?: string;
    credits?: number;
    status: 'active' | 'inactive';
    updatedAt?: number;
    updatedBy?: Id<"user">;
};

// Tipo para actualizar materia (todos los campos opcionales excepto _id)
export type UpdateSubjectData = {
    _id: Id<"subject">;
    schoolId: Id<"school">;
    name?: string;
    description?: string;
    credits?: number;
    status?: 'active' | 'inactive';
    updatedAt?: number;
    updatedBy?: Id<"user">;
};

// Store de Materia con CRUD completo
export type SubjectStore = {
    subjects: Subject[];
    selectedSubject: Subject | null;
    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
    error: string | null;
    createError: string | null;
    updateError: string | null;
    deleteError: string | null;
    setSubject: (subject: Subject[]) => void;
    setSelectedSubject: (subject: Subject | null) => void;
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
    subjects: [],
    selectedSubject: null,
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
    createError: null,
    updateError: null,
    deleteError: null,
};

export const useSubjectStore = create<SubjectStore>((set) => ({
    ...initialState,
    setSubject: (subjects) => set({ subjects }),
    setSelectedSubject: (selectedSubject) => set({ selectedSubject }),
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

export const useSubject = (schoolId?: string) => {
    const {
        subjects,
        selectedSubject,
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
        error,
        createError,
        updateError,
        deleteError,
        setSubject,
        setSelectedSubject,
        setCreating,
        setUpdating,
        setDeleting,
        setCreateError,
        setUpdateError,
        setDeleteError,
        clearErrors,
    } = useSubjectStore();

    // Query para obtener las materias de la escuela
    const subjectsQuery = useQuery(
        api.functions.subjet.getAllSubjetsBySchool,
        schoolId ? { schoolId: schoolId as Id<"school"> } : "skip"
    );

    // Mutations
    const createSubjectMutation = useMutation(api.functions.subjet.createSubjectWithSchoolId);
    const updateSubjectMutation = useMutation(api.functions.subjet.updateSubjectWithSchoolId);
    const deleteSubjectMutation = useMutation(api.functions.subjet.deleteSubjectWithSchoolId);

    // CREATE
    const createSubject = useCallback(async (data: CreateSubjectData) => {
        setCreating(true);
        setCreateError(null);
        try {
            await createSubjectMutation({
                ...data,
                schoolId: data.schoolId as Id<"school">
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al crear materia';
            setCreateError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setCreating(false);
        }
    }, [createSubjectMutation, setCreating, setCreateError]);

    // UPDATE
    const updateSubject = useCallback(async (data: UpdateSubjectData) => {
        setUpdating(true);
        setUpdateError(null);
        try {
            await updateSubjectMutation({
                _id: data._id as Id<"subject">,
                schoolId: data.schoolId as Id<"school">,
                name: data.name as string,
                description: data.description,
                credits: data.credits,
                status: data.status as 'active' | 'inactive',
                updatedAt: data.updatedAt as number,
                updatedBy: data.updatedBy as Id<"user">
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al actualizar materia';
            setUpdateError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setUpdating(false);
        }
    }, [updateSubjectMutation, setUpdating, setUpdateError]);

    // DELETE
    const deleteSubject = useCallback(async (id: string) => {
        setDeleting(true);
        setDeleteError(null);
        try {
            await deleteSubjectMutation({
                _id: id as Id<"subject">,
                schoolId: schoolId as Id<"school">,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al eliminar materia';
            setDeleteError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setDeleting(false);
        }
    }, [deleteSubjectMutation, setDeleting, setDeleteError, schoolId]);

    // Refrescar materias cuando cambie la query
    useEffect(() => {
        if (subjectsQuery) {
            setSubject(
                (subjectsQuery as Subject[]).map((m) => ({
                    _id: m._id,
                    _creationTime: m._creationTime,
                    schoolId: m.schoolId,
                    name: m.name,
                    description: m.description ?? undefined,
                    credits: m.credits ?? undefined,
                    status: m.status,
                    updatedAt: m.updatedAt ?? Date.now(),
                    updatedBy: m.updatedBy ?? "unknown"
                }))
            );
        }
    }, [subjectsQuery, setSubject]);

    return {
        subjects,
        selectedSubject,
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
        error,
        createError,
        updateError,
        deleteError,
        createSubject,
        updateSubject,
        deleteSubject,
        setSelectedSubject,
        clearErrors,
    };
}; 