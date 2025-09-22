import { create } from "zustand";
import { useQuery, useMutation } from "convex/react";
import { useCallback } from "react";
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { useCurrentSchool } from "./userSchoolsStore";


export type Term = {
    _id: string;
    _creationTime: number;
    name: string;
    key: string;
    startDate: number;
    endDate: number;
    status: 'active' | 'inactive' | 'closed';
    schoolCycleId: string;
    schoolId: string;
};

export type CreateTermData = {
    name: string;
    key: string;
    startDate: number;
    endDate: number;
    schoolCycleId: string;
    schoolId: string;
};

export type UpdateTermData = {
    termId: string;
    data: {
        name?: string;
        key?: string;
        startDate?: number;
        endDate?: number;
        status?: 'active' | 'inactive' | 'closed';
    };
};

// Store state for mutations
type TermStoreState = {
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
    createError: string | null;
    updateError: string | null;
    deleteError: string | null;
};

// Store actions for mutations
type TermStoreActions = {
    setCreating: (creating: boolean) => void;
    setUpdating: (updating: boolean) => void;
    setDeleting: (deleting: boolean) => void;
    setCreateError: (error: string | null) => void;
    setUpdateError: (error: string | null) => void;
    setDeleteError: (error: string | null) => void;
    clearErrors: () => void;
    reset: () => void;
};

const initialState: TermStoreState = {
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    createError: null,
    updateError: null,
    deleteError: null,
};

export const useTermStore = create<TermStoreState & TermStoreActions>((set) => ({
    ...initialState,
    setCreating: (isCreating) => set({ isCreating }),
    setUpdating: (isUpdating) => set({ isUpdating }),
    setDeleting: (isDeleting) => set({ isDeleting }),
    setCreateError: (createError) => set({ createError }),
    setUpdateError: (updateError) => set({ updateError }),
    setDeleteError: (deleteError) => set({ deleteError }),
    clearErrors: () => set({
        createError: null,
        updateError: null,
        deleteError: null,
    }),
    reset: () => set(initialState),
}));

export const useTerm = (schoolCycleId?: string, schoolId?: Id<"school">) => {
    const {
        isCreating,
        isUpdating,
        isDeleting,
        createError,
        updateError,
        deleteError,
        setCreating,
        setUpdating,
        setDeleting,
        setCreateError,
        setUpdateError,
        setDeleteError,
        clearErrors,
    } = useTermStore();

    // Queries
    const termsByCycleQuery = useQuery(
        api.functions.terms.getTermsByCycleId,
        schoolCycleId && schoolCycleId !== "all" 
            ? { schoolCycleId: schoolCycleId as Id<"schoolCycle"> } 
            : "skip"
    );

    const allTermsBySchoolQuery = useQuery(
        api.functions.terms.getAllTermsBySchool,
        schoolId && schoolCycleId === "all"
            ? { schoolId: schoolId }
            : "skip"
    );

    const queryResult = schoolCycleId === "all" ? allTermsBySchoolQuery : termsByCycleQuery;
    const isLoading = queryResult === undefined;

    // Mutations
    const createTermMutation = useMutation(api.functions.terms.createTerm);
    const updateTermMutation = useMutation(api.functions.terms.updateTerm);
    const deleteTermMutation = useMutation(api.functions.terms.deleteTerm);

    // CREATE
    const createTerm = useCallback(async (data: CreateTermData) => {
        setCreating(true);
        setCreateError(null);
        try {
            await createTermMutation({
                ...data,
                schoolCycleId: data.schoolCycleId as Id<"schoolCycle">,
                schoolId: data.schoolId as Id<"school">,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create term';
            setCreateError(errorMessage);
            throw error;
        } finally {
            setCreating(false);
        }
    }, [createTermMutation, setCreating, setCreateError]);

    // UPDATE
    const updateTerm = useCallback(async (data: UpdateTermData) => {
        setUpdating(true);
        setUpdateError(null);
        try {
            await updateTermMutation({
                termId: data.termId as Id<"term">,
                data: data.data,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update term';
            setUpdateError(errorMessage);
            throw error;
        } finally {
            setUpdating(false);
        }
    }, [updateTermMutation, setUpdating, setUpdateError]);

    // DELETE
    const deleteTerm = useCallback(async (termId: string) => {
        setDeleting(true);
        setDeleteError(null);
        try {
            await deleteTermMutation({
                termId: termId as Id<"term">,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete term';
            setDeleteError(errorMessage);
            throw error;
        } finally {
            setDeleting(false);
        }
    }, [deleteTermMutation, setDeleting, setDeleteError]);

    return {
        terms: (queryResult as Term[]) || [],
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
        createError,
        updateError,
        deleteError,
        createTerm,
        updateTerm,
        deleteTerm,
        clearErrors,
    };
};
