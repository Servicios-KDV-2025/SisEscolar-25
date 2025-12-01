"use client";

import { create } from "zustand";
import { useQuery, useMutation } from "convex/react";
import { useCallback, useEffect } from "react";
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { BillingRule } from "@/types/billingRule";

export type CreateBillingRuleData = {
    schoolId: Id<"school">;
    name: string;
    description?: string;
    type: "late_fee" | "early_discount" | "cutoff";
    scope: "estandar" | "becarios" | "all_students";
    status: 'active' | 'inactive';
    lateFeeType?: "percentage" | "fixed";
    lateFeeValue?: number;
    startDay?: number;
    endDay?: number;
    maxUses?: number;
    usedCount?: number;
    cutoffAfterDays?: number;
    createdBy: Id<"user">;
    updatedBy: Id<"user">;
};

export type UpdateBillingRuleData = {
    _id: Id<"billingRule">;
    schoolId: Id<"school">;
    name?: string;
    description?: string;
    type?: "late_fee" | "early_discount" | "cutoff";
    scope?: "estandar" | "becarios" | "all_students";
    status?: 'active' | 'inactive';
    lateFeeType?: "percentage" | "fixed";
    lateFeeValue?: number;
    startDay?: number;
    endDay?: number;
    maxUses?: number;
    usedCount?: number;
    cutoffAfterDays?: number;
    updatedBy: Id<"user">;
    updatedAt?: number;
};

export type BillingRuleStore = {
    billingRules: BillingRule[];
    selectedBillingRule: BillingRule | null;
    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
    error: string | null;
    createError: string | null;
    updateError: string | null;
    deleteError: string | null;
    setBillingRule: (billingRule: BillingRule[]) => void;
    setSelectedBillingRule: (billingRule: BillingRule | null) => void;
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
    billingRules: [],
    selectedBillingRule: null,
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
    createError: null,
    updateError: null,
    deleteError: null,
};

export const useBillingRuleStore = create<BillingRuleStore>((set) => ({
    ...initialState,
    setBillingRule: (billingRules) => set({ billingRules }),
    setSelectedBillingRule: (selectedBillingRule) => set({ selectedBillingRule }),
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

export const useBillingRule = (schoolId?: string) => {
    const {
        billingRules,
        selectedBillingRule,
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
        error,
        createError,
        updateError,
        deleteError,
        setBillingRule,
        setSelectedBillingRule,
        setCreating,
        setUpdating,
        setDeleting,
        setCreateError,
        setUpdateError,
        setDeleteError,
        clearErrors,
    } = useBillingRuleStore();

    const billingRulesQuery = useQuery(
        api.functions.billingRule.getAllBillingRulesBySchool,
        schoolId ? { schoolId: schoolId as Id<"school"> } : "skip"
    );

    const createBillingRuleMutation = useMutation(api.functions.billingRule.createBillingRuleWithSchoolId);
    const updateBillingRuleMutation = useMutation(api.functions.billingRule.updateBillingRuleWithSchoolId);
    const deleteBillingRuleMutation = useMutation(api.functions.billingRule.deleteBillingRuleWithSchoolId);

    const createBillingRule = useCallback(async (data: CreateBillingRuleData) => {
        setCreating(true);
        setCreateError(null);

        try {
            await createBillingRuleMutation({
                ...data,
                schoolId: data.schoolId as Id<"school">
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al crear regla de facturación';
            const errMess = errorMessage?.split(': ').at(-1);
            setCreateError(errMess!);
            throw new Error(errMess!);
        } finally {
            setCreating(false);
        }
    }, [createBillingRuleMutation, setCreating, setCreateError]);

    const updateBillingRule = useCallback(async (data: UpdateBillingRuleData) => {
        setUpdating(true);
        setUpdateError(null);
        try {
            switch (data.type) {
                case 'late_fee':
                case 'early_discount':
                    data.cutoffAfterDays = undefined;
                    break;
                case 'cutoff':
                    data.lateFeeType = undefined;
                    data.lateFeeValue = undefined;
                    data.startDay = undefined;
                    data.endDay = undefined;
                    break;
            }

            await updateBillingRuleMutation({
                _id: data._id as Id<"billingRule">,
                schoolId: data.schoolId as Id<"school">,
                name: data.name,
                description: data.description,
                type: data.type,
                scope: data.scope,
                status: data.status,
                lateFeeType: data.lateFeeType,
                lateFeeValue: data.lateFeeValue,
                startDay: data.startDay,
                endDay: data.endDay,
                maxUses: data.maxUses,
                usedCount: data.usedCount,
                cutoffAfterDays: data.cutoffAfterDays,
                updatedBy: data.updatedBy as Id<"user">,
                updatedAt: data.updatedAt as number,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al actualizar regla de facturación';
            const errMess = errorMessage?.split(': ').at(-1);
            setUpdateError(errMess!);
            throw new Error(errMess!);
        } finally {
            setUpdating(false);
        }
    }, [updateBillingRuleMutation, setUpdating, setUpdateError]);

    const deleteBillingRule = useCallback(async (id: string) => {
        setDeleting(true);
        setDeleteError(null);
        try {
            await deleteBillingRuleMutation({
                _id: id as Id<"billingRule">,
                schoolId: schoolId as Id<"school">,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al eliminar regla de facturación';
            const errMess = errorMessage?.split(': ').at(-1);
            setDeleteError(errMess!);
            throw new Error(errMess!);
        } finally {
            setDeleting(false);
        }
    }, [deleteBillingRuleMutation, setDeleting, setDeleteError, schoolId]);

    useEffect(() => {
        if (billingRulesQuery) {
            setBillingRule(
                (billingRulesQuery as BillingRule[]).map((rule) => ({
                    _id: rule._id,
                    _creationTime: rule._creationTime,
                    schoolId: rule.schoolId,
                    name: rule.name,
                    description: rule.description ?? undefined,
                    type: rule.type,
                    scope: rule.scope,
                    status: rule.status,
                    lateFeeType: rule.lateFeeType ?? undefined,
                    lateFeeValue: rule.lateFeeValue ?? undefined,
                    startDay: rule.startDay ?? undefined,
                    endDay: rule.endDay ?? undefined,
                    maxUses: rule.maxUses ?? undefined,
                    usedCount: rule.usedCount ?? undefined,
                    cutoffAfterDays: rule.cutoffAfterDays ?? undefined,
                    createdBy: rule.createdBy,
                    updatedBy: rule.updatedBy,
                    createdAt: rule.createdAt,
                    updatedAt: rule.updatedAt ?? undefined,
                }))
            );
        }
    }, [billingRulesQuery, setBillingRule]);

    const isQueryLoading = billingRulesQuery === undefined && schoolId !== undefined;

    return {
        billingRules,
        selectedBillingRule,
        isLoading: isLoading || isQueryLoading,
        isCreating,
        isUpdating,
        isDeleting,
        error,
        createError,
        updateError,
        deleteError,
        createBillingRule,
        updateBillingRule,
        deleteBillingRule,
        setSelectedBillingRule,
        clearErrors,
    };
};