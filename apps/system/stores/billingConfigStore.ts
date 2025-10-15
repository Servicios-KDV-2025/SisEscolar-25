"use client";

import { create } from "zustand";
import { useQuery, useMutation } from "convex/react";
import { useCallback, useEffect } from "react";
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { BillingConfigType } from "@/types/billingConfig";



export type CreateBillingConfigData = {
    schoolId: Id<"school">;
    schoolCycleId: Id<"schoolCycle">;
    scope: "all_students" | "specific_groups" | "specific_grades" | "specific_students";
    targetGroup?: Id<"group">[];
    targetGrade?: string[];
    targetStudent?: Id<"student">[];
    recurrence_type: "cuatrimestral" | "semestral" | "sabatino" | "mensual" | "diario" | "semanal" | "anual" | "unico";
    type: "inscripción" | "colegiatura" | "examen" | "material-escolar" | "seguro-vida" | "plan-alimenticio" | "otro";
    amount: number;
    ruleIds?: Id<"billingRule">[];
    startDate: number;
    endDate: number;
    status: "required" | "optional" | "inactive";
    createdBy: Id<"user">;
    updatedBy: Id<"user">;
};


export type UpdateBillingConfigData = {
    _id: Id<"billingConfig">;
    schoolId: Id<"school">;
    schoolCycleId?: Id<"schoolCycle">;
    scope?: "all_students" | "specific_groups" | "specific_grades" | "specific_students";
    targetGroup?: Id<"group">[];
    targetGrade?: string[];
    targetStudent?: Id<"student">[];
    recurrence_type?: "cuatrimestral" | "semestral" | "sabatino" | "mensual" | "diario" | "semanal" | "anual" | "unico";
    type?: "inscripción" | "colegiatura" | "examen" | "material-escolar" | "seguro-vida" | "plan-alimenticio" | "otro";
    amount?: number;
    ruleIds?: Id<"billingRule">[];
    startDate?: number;
    endDate?: number;
    status?: "required" | "optional" | "inactive";
    updatedBy: Id<"user">;
    updatedAt?: number;
};

export type BillingConfigStore = {
    billingConfigs: BillingConfigType[];
    selectedBillingConfig: BillingConfigType | null;
    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
    error: string | null;
    createError: string | null;
    updateError: string | null;
    deleteError: string | null;
    setBillingConfig: (billingConfig: BillingConfigType[]) => void;
    setSelectedBillingConfig: (billingConfig: BillingConfigType | null) => void;
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
    billingConfigs: [],
    selectedBillingConfig: null,
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
    createError: null,
    updateError: null,
    deleteError: null,
};

export const useBillingConfigStore = create<BillingConfigStore>((set) => ({
    ...initialState,
    setBillingConfig: (billingConfigs) => set({ billingConfigs }),
    setSelectedBillingConfig: (selectedBillingConfig) => set({ selectedBillingConfig }),
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

export const useBillingConfig = (schoolId?: string) => {
    const {
        billingConfigs,
        selectedBillingConfig,
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
        error,
        createError,
        updateError,
        deleteError,
        setBillingConfig,
        setSelectedBillingConfig,
        setCreating,
        setUpdating,
        setDeleting,
        setCreateError,
        setUpdateError,
        setDeleteError,
        clearErrors,
    } = useBillingConfigStore();

    const billingConfigsQuery = useQuery(
        api.functions.billingConfig.getBillingsConfigs,
        schoolId ? { schoolId: schoolId as Id<"school"> } : "skip"
    );

    const createBillingConfigMutation = useMutation(api.functions.billingConfig.createBillingConfig);
    const updateBillingConfigMutation = useMutation(api.functions.billingConfig.updateBillingConfig);
    const deleteBillingConfigMutation = useMutation(api.functions.billingConfig.deleteBillingConfig);

    const createBillingConfig = useCallback(async (data: CreateBillingConfigData) => {
        setCreating(true);
        setCreateError(null);
        try {
            switch (data.scope) {
                case 'all_students':
                    data.targetGrade = [];
                    data.targetGroup = [];
                    data.targetStudent = [];
                    break;
                case 'specific_grades':
                    data.targetGroup = [];
                    data.targetStudent = [];
                    break;
                case 'specific_groups':
                    data.targetGrade = [];
                    data.targetStudent = [];
                    break;
                case 'specific_students':
                    data.targetGrade = [];
                    data.targetGroup = [];
                    break;
            }

            await createBillingConfigMutation({
                schoolId: data.schoolId,
                schoolCycleId: data.schoolCycleId,
                scope: data.scope,
                targetGroup: data.targetGroup,
                targetGrade: data.targetGrade,
                targetStudent: data.targetStudent,
                recurrence_type: data.recurrence_type,
                type: data.type,
                amount: data.amount,
                ruleIds: data.ruleIds,
                startDate: data.startDate,
                endDate: data.endDate,
                status: data.status,
                createdBy: data.createdBy,
                updatedBy: data.updatedBy,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al crear configuración de facturación';
            const errMess = errorMessage?.split(': ').at(-1);
            setCreateError(errMess!);
            throw new Error(errMess!);
        } finally {
            setCreating(false);
        }
    }, [createBillingConfigMutation, setCreating, setCreateError]);

    const updateBillingConfig = useCallback(async (data: UpdateBillingConfigData) => {
        setUpdating(true);
        setUpdateError(null);
        try {

            switch (data.scope) {
                case 'all_students':
                    data.targetGrade = [];
                    data.targetGroup = [];
                    data.targetStudent = [];
                    break;
                case 'specific_grades':
                    data.targetGroup = [];
                    data.targetStudent = [];
                    break;
                case 'specific_groups':
                    data.targetGrade = [];
                    data.targetStudent = [];
                    break;
                case 'specific_students':
                    data.targetGrade = [];
                    data.targetGroup = [];
                    break;
            }
            await updateBillingConfigMutation({
                id: data._id,
                schoolId: data.schoolId,
                schoolCycleId: data.schoolCycleId,
                scope: data.scope,
                targetGroup: data.targetGroup,
                targetGrade: data.targetGrade,
                targetStudent: data.targetStudent,
                recurrence_type: data.recurrence_type,
                type: data.type,
                amount: data.amount,
                ruleIds: data.ruleIds,
                startDate: data.startDate,
                endDate: data.endDate,
                status: data.status,
                updatedBy: data.updatedBy
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al actualizar configuración de facturación';
            const errMess = errorMessage?.split(': ').at(-1);
            setUpdateError(errMess!);
            throw new Error(errMess!);
        } finally {
            setUpdating(false);
        }
    }, [updateBillingConfigMutation, setUpdating, setUpdateError]);

    const deleteBillingConfig = useCallback(async (id: string) => {
        setDeleting(true);
        setDeleteError(null);
        try {
            await deleteBillingConfigMutation({
                id: id as Id<"billingConfig">,
                schoolId: schoolId as Id<"school">,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al eliminar configuración de facturación';
            const errMess = errorMessage?.split(': ').at(-1);
            setDeleteError(errMess!);
            throw new Error(errMess!);
        } finally {
            setDeleting(false);
        }
    }, [deleteBillingConfigMutation, setDeleting, setDeleteError, schoolId]);

    useEffect(() => {
        if (billingConfigsQuery) {
            setBillingConfig(
                (billingConfigsQuery as BillingConfigType[]).map((config) => ({
                    _id: config._id,
                    _creationTime: config._creationTime,
                    schoolId: config.schoolId,
                    schoolCycleId: config.schoolCycleId,
                    scope: config.scope,
                    targetGroup: config.targetGroup ?? undefined,
                    targetGrade: config.targetGrade ?? undefined,
                    targetStudent: config.targetStudent ?? undefined,
                    recurrence_type: config.recurrence_type,
                    type: config.type,
                    amount: config.amount,
                    ruleIds: config.ruleIds ?? undefined,
                    startDate: config.startDate,
                    endDate: config.endDate,
                    status: config.status,
                    createdBy: config.createdBy,
                    updatedBy: config.updatedBy,
                    createdAt: config.createdAt,
                    updatedAt: config.updatedAt ?? undefined,
                }))
            );
        }
    }, [billingConfigsQuery, setBillingConfig]);

    return {
        billingConfigs,
        selectedBillingConfig,
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
        error,
        createError,
        updateError,
        deleteError,
        createBillingConfig,
        updateBillingConfig,
        deleteBillingConfig,
        setSelectedBillingConfig,
        clearErrors,
    };
};