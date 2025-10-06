import { create } from "zustand";
import { useQuery, useMutation } from "convex/react";
import { useCallback, useEffect, useMemo } from "react";
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { ClassroomType, CreateBy, SchoolCycleType, TeacherType } from "@/types/temporalSchema";
import { Subject } from "./subjectStore";
import { Group } from "./groupStore";

export type ClassCatalog = {
    _id: string;
    schoolId: string;
    schoolCycleId: string;
    subjectId: string;
    classroomId: string;
    teacherId: string;
    groupId?: string;
    name: string;
    status: 'active' | 'inactive';
    createdBy?: string;
    updatedAt: number;
};

export type ClassCatalogWithDetails = ClassCatalog & {
    schoolCycle?: SchoolCycleType | null;
    subject?: Subject | null;
    classroom?: ClassroomType | null;
    teacher?: TeacherType | null;
    group?: Group | null;
    createData?: CreateBy | null;
};

export type CreateClassCatalogData = {
    schoolId: string;
    schoolCycleId: string;
    subjectId: string;
    classroomId: string;
    teacherId: string;
    groupId: string;
    name: string;
    status: 'active' | 'inactive';
    createdBy: string;
};

export type UpdateClassCatalogData = {
    _id: string;
    schoolId: string;
    schoolCycleId: string;
    subjectId: string;
    classroomId: string;
    teacherId: string;
    groupId?: string;
    name: string;
    status: 'active' | 'inactive';
    updatedAt: number;
};

//   Store state
type ClassCatalogStoreState = {
    classCatalogs: ClassCatalog[];
    selectedClassCatalog: ClassCatalog | null;
    classCatalogsWithDetails: ClassCatalogWithDetails[];
    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
    error: string | null;
    createError: string | null;
    updateError: string | null;
    deleteError: string | null;
};

//   Store actions
type ClassCatalogStoreActions = {
    setClassCatalogs: (classCatalogs: ClassCatalog[]) => void;
    setSelectedClassCatalog: (classCatalog: ClassCatalog | null) => void;
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

const initialState: ClassCatalogStoreState = {
    classCatalogs: [],
    classCatalogsWithDetails: [],
    selectedClassCatalog: null,
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
    createError: null,
    updateError: null,
    deleteError: null,
};

export const useClassCatalogStore = create<ClassCatalogStoreState & ClassCatalogStoreActions>((set) => ({
    ...initialState,
    setClassCatalogs: (classCatalogs) => set({ classCatalogs }),
    setSelectedClassCatalog: (selectedClassCatalog) => set({ selectedClassCatalog }),
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

export const useClassCatalog = (
    schoolId?: Id<"school">,
    roleFilters?: { canViewAll: boolean; tutorId?: Id<"user">; teacherId?: Id<"user"> }
) => {
    const {
        classCatalogs,
        selectedClassCatalog,
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
        error,
        createError,
        updateError,
        deleteError,
        setClassCatalogs,
        setSelectedClassCatalog,
        setCreating,
        setUpdating,
        setDeleting,
        setCreateError,
        setUpdateError,
        setDeleteError,
        clearErrors,
    } = useClassCatalogStore();

    // Queries
    const classCatalogsQuery = useQuery(
        api.functions.classCatalog.getAllClassCatalog,
        schoolId ? {
            schoolId: schoolId as Id<"school">,
            canViewAll: roleFilters!.canViewAll,
            teacherId: roleFilters!.teacherId,
            tutorId: roleFilters!.tutorId,
        } : "skip"
    );

    const classCatalogWithRoleFilter = useQuery(
        api.functions.classCatalog.getClassCatalogWithRoleFilter,
        schoolId && roleFilters ? {
            schoolId,
            canViewAll: roleFilters.canViewAll,
            tutorId: roleFilters.tutorId,
            teacherId: roleFilters.teacherId
        } : 'skip'
    )

    // Mutations
    const createClassCatalogMutation = useMutation(api.functions.classCatalog.createClassCatalog);
    const updateClassCatalogMutation = useMutation(api.functions.classCatalog.updateClassCatalog);
    const deleteClassCatalogMutation = useMutation(api.functions.classCatalog.deleteClassCatalog);

    const classCatWiRol = classCatalogWithRoleFilter as ClassCatalog[];

    // CREATE
    const createClassCatalog = useCallback(async (data: CreateClassCatalogData) => {
        setCreating(true);
        setCreateError(null);
        try {
            console.log('Store - Creating class catalog:', data);
            await createClassCatalogMutation({
                ...data,
                schoolId: data.schoolId as Id<"school">,
                schoolCycleId: data.schoolCycleId as Id<'schoolCycle'>,
                subjectId: data.subjectId as Id<'subject'>,
                classroomId: data.classroomId as Id<'classroom'>,
                teacherId: data.teacherId as Id<'user'>,
                groupId: data.groupId as Id<'group'>,
                createdBy: data.createdBy as Id<'user'>
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create class catalog';
            console.error('Store - Creation error:', errorMessage, error);
            setCreateError(errorMessage);
            throw error;
        } finally {
            setCreating(false);
        }
    }, [createClassCatalogMutation, setCreating, setCreateError]);

    // UPDATE
    const updateClassCatalog = useCallback(async (data: UpdateClassCatalogData) => {
        setUpdating(true);
        setUpdateError(null);
        try {
            await updateClassCatalogMutation({
                ...data,
                _id: data._id as Id<"classCatalog">,
                schoolId: data.schoolId as Id<"school">,
                schoolCycleId: data.schoolCycleId as Id<"schoolCycle">,
                subjectId: data.subjectId as Id<"subject">,
                classroomId: data.classroomId as Id<"classroom">,
                teacherId: data.teacherId as Id<"user">,
                groupId: data.groupId as Id<"group">,
                updatedAt: data.updatedAt,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update class catalog';
            setUpdateError(errorMessage);
            throw error;
        } finally {
            setUpdating(false);
        }
    }, [updateClassCatalogMutation, setUpdating, setUpdateError]);

    // DELETE
    const deleteClassCatalog = useCallback(async (id: string, schoolId: string | undefined) => {
        setDeleting(true);
        setDeleteError(null);
        try {
            await deleteClassCatalogMutation({
                _id: id as Id<"classCatalog">,
                schoolId: schoolId as Id<"school">,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete class catalog';
            setDeleteError(errorMessage);
            throw error;
        } finally {
            setDeleting(false);
        }
    }, [deleteClassCatalogMutation, setDeleting, setDeleteError]);

    // Update store when query results change
    useEffect(() => {
        if (classCatalogWithRoleFilter) {
            setClassCatalogs(classCatWiRol);
            return;
        }

        if (classCatalogsQuery) {
            setClassCatalogs(classCatalogsQuery as ClassCatalogWithDetails[]);
            return;
        }
    }, [classCatWiRol, classCatalogWithRoleFilter, classCatalogsQuery, setClassCatalogs])

    return {
        classCatalogs,
        classCatalogsWithDetails: (classCatalogsQuery as ClassCatalogWithDetails[]) || [],
        selectedClassCatalog,
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
        error,
        createError,
        updateError,
        deleteError,
        createClassCatalog,
        updateClassCatalog,
        deleteClassCatalog,
        setSelectedClassCatalog,
        clearErrors,
    };
};
// getClassCatalogWithRoleFilter

export const useClassCatalogWithPermissions = (
    schoolId?: Id<"school">,
    getStudentFilters?: () => { canViewAll: boolean; tutorId?: Id<"user">; teacherId?: Id<"user"> }
) => {
    const studentFilters = useMemo(() => {
        return getStudentFilters?.() || { canViewAll: false };
    }, [getStudentFilters]);

    return useClassCatalog(schoolId, studentFilters);
};
