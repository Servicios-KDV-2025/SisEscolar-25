import { create } from "zustand";
import { useQuery, useMutation } from "convex/react";
import { useCallback, useEffect } from "react";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { api } from "@repo/convex/convex/_generated/api";

export type Group = {
    _id: Id<"group">,
    _creationTime: number;
    name: string;
    grade: string;
    status: "active" | "inactive";
    updatedAt: number;
    updatedBy: Id<"user">;
}

// Tipos para crear y actualizar grupo
type CreateGroupData = {
    schoolId: Id<"school">;
    name: string;
    grade: string;
    status: "active" | "inactive";
};


export type UpdateGroupData = {
    _id: string;
    schoolId: string;
    name: string;
    grade: string;
    status: "active" | "inactive";
    updatedAt?: number;
    updatedBy?: Id<"user">;
}

// Store de Grupo con CRUD completo
export type GroupStore = {
    groups: Group[];
    selectedGroup: Group | null;
    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
    error: string | null;
    createError: string | null;
    updateError: string | null;
    deleteError: string | null;
    setGroups: (groups: Group[]) => void;
    setSelectedGroup: (group: Group | null) => void;
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
    groups: [],
    selectedGroup: null,
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
    createError: null,
    updateError: null,
    deleteError: null,
};

export const useGroupStore = create<GroupStore>((set) => ({
    ...initialState,
    setGroups: (groups) => set({ groups }),
    setSelectedGroup: (selectedGroup) => set({ selectedGroup }),
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

type GroupResultFromQuery = {
    _id: Id<"group">,
    _creationTime: number;
    name: string;
    grade: string;
    status: "active" | "inactive";
    updatedAt: number;
    updatedBy: Id<"user">;
};

export const useGroup = (schoolId?: string) => {
    const {
        groups,
        selectedGroup,
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
        error,
        createError,
        updateError,
        deleteError,
        setGroups,
        setSelectedGroup,

        setCreating,
        setUpdating,
        setDeleting,
        setLoading,

        setCreateError,
        setUpdateError,
        setDeleteError,
        clearErrors,
    } = useGroupStore();

    // Query para obtener los grupos de la escuela
    const groupsQuery = useQuery(
        api.functions.group.getAllGroupsBySchool,
        schoolId ? { schoolId: schoolId as Id<"school"> } : "skip"
    );

    // Mutations
    const createGroupMutation = useMutation(api.functions.group.createGroup);
    const updateGroupMutation = useMutation(api.functions.group.updateGroup);
    const deleteGroupMutation = useMutation(api.functions.group.deleteGroup);

    // CREATE
    const createGroup = useCallback(async (data: CreateGroupData) => {
        setCreating(true);
        setCreateError(null);
        try {
            await createGroupMutation({
                schoolId: data.schoolId as Id<"school">,
                name: data.name,
                grade: data.grade,
                status: data.status
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al crear grupo';
            const errMess = errorMessage?.split(': ').at(-1);
            setCreateError(errMess!);
            throw new Error(errMess!);
        } finally {
            setCreating(false);
        }
    }, [createGroupMutation, setCreating, setCreateError]);

    // UPDATE
    const updateGroup = useCallback(async (data: UpdateGroupData) => {
        setUpdating(true);
        setUpdateError(null);
        try {
            await updateGroupMutation({
                _id: data._id as Id<"group">,
                schoolId: data.schoolId as Id<"school">,
                name: data.name,
                grade: data.grade,
                status: data.status as 'active' | 'inactive',
                updatedAt: data.updatedAt as number,
                updatedBy: data.updatedBy as Id<"user">,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al actualizar grupo';
            const errMess = errorMessage?.split(': ').at(-1);
            setUpdateError(errMess!);
            throw new Error(errMess!);
        } finally {
            setUpdating(false);
        }
    }, [updateGroupMutation, setUpdating, setUpdateError]);

    // DELETE
    const deleteGroup = useCallback(async (id: string, schoolId: string | undefined) => {
        setDeleting(true);
        setDeleteError(null);
        try {
            await deleteGroupMutation({
                _id: id as Id<"group">,
                schoolId: schoolId as Id<"school">,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al eliminar grupo';
            const errMess = errorMessage?.split(': ').at(-1);
            setDeleteError(errMess!);
            throw new Error(errMess!);
        } finally {
            setDeleting(false);
        }
    }, [deleteGroupMutation, setDeleting, setDeleteError]);

    // Refrescar grupos cuando cambie la query
    useEffect(() => {
        setLoading(true);
        if (groupsQuery) {
            setGroups(
                (groupsQuery as GroupResultFromQuery[]).map((g) => ({
                    _id: g._id as Id<"group">,
                    _creationTime: g._creationTime,
                    name: g.name,
                    grade: g.grade,
                    status: g.status,
                    updatedAt: g.updatedAt,
                    updatedBy: g.updatedBy
                }))
            );
            setLoading(false);
        }
        setLoading(false);
    }, [groupsQuery, setGroups, setLoading]);


    return {
        groups,
        selectedGroup,
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
        error,
        createError,
        updateError,
        deleteError,
        createGroup,
        updateGroup,
        deleteGroup,
        setSelectedGroup,
        clearErrors,
    };
}; 