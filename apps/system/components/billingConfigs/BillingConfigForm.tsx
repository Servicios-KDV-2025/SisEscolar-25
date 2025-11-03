import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/shadcn/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select";
import { Input } from "@repo/ui/components/shadcn/input";
import { Group } from "stores/groupStore";
import { SchoolCycleType } from '@/types/temporalSchema';
import { Student } from "@/types/student";
import { GenericMultiSelect } from "./GenericMultiSelect";
import { PAYMENT_TYPES, RECURRENCE_TYPES, SCOPE_TYPES, STATUS_TYPES } from "lib/billing/constants";
import { BILLING_RULE_SCOPES, BILLING_RULE_TYPES, BillingRule } from "@/types/billingRule";
import { formatCurrency } from "lib/utils";
import { Info } from "@repo/ui/icons";
import { useMemo } from "react";

interface BillingConfigProps {
    form: UseFormReturn<Record<string, unknown>>;
    operation: "create" | "edit" | "view" | "delete";
    groups: Group[] | undefined;
    schoolCycles: SchoolCycleType[] | undefined;
    students: Student[] | undefined;
    billingRules: BillingRule[] | undefined;
}

export function BillingConfigForm({
    form,
    operation,
    groups,
    schoolCycles,
    students,
    billingRules
}: BillingConfigProps) {
    const currentScope = form.watch("scope");
    const selectedSchoolCycleId = form.watch("schoolCycleId");
    const uniqueGrades = [...new Set(groups?.map(g => g.grade) ?? [])].map(grade => ({ grade }));
    const filteredStudents = useMemo(() => {
        if (!selectedSchoolCycleId || !students) return [];
        return students.filter(s => s.schoolCycleId === selectedSchoolCycleId);
    }, [selectedSchoolCycleId, students]);
    const formattedStudents = filteredStudents.map(s => ({
        _id: s._id,
        firstName: s.name ?? "",
        lastName: s.lastName ?? "",
    }));

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="schoolCycleId"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Ciclo Escolar</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value as string}
                                disabled={operation === "view"}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecciona un ciclo escolar" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {schoolCycles?.map((c) => (
                                        <SelectItem key={c._id} value={c._id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Tipo de Pago</FormLabel>
                            <Select
                                value={field.value as string}
                                onValueChange={field.onChange}
                                disabled={operation === "view"}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecciona el tipo" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Object.entries(PAYMENT_TYPES).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="recurrence_type"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Recurrencia</FormLabel>
                            <Select
                                value={field.value as string}
                                onValueChange={field.onChange}
                                disabled={operation === "view"}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecciona la recurrencia" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Object.entries(RECURRENCE_TYPES).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => {
                        const inputValue = field.value === null || field.value === undefined
                            ? ""
                            : String(field.value);

                        return (
                            <FormItem>
                                <FormLabel>Monto</FormLabel>
                                <FormControl>
                                    <Input
                                        className="w-full"
                                        type="number"
                                        placeholder="0.00"
                                        min="0"
                                        step="1"
                                        value={inputValue}
                                        onChange={(e) => {
                                            const value = e.target.value
                                            field.onChange(value === "" ? undefined : Number(value))
                                        }}
                                        disabled={operation === "view"}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )
                    }}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fecha de Inicio</FormLabel>
                            <FormControl>
                                <Input
                                    type="date"
                                    disabled={operation === 'view'}
                                    min={new Date().toISOString().split("T")[0]}
                                    value={
                                        field.value
                                            ? (typeof field.value === 'number'
                                                ? new Date(field.value).toISOString().split("T")[0]
                                                : new Date(field.value as string).toISOString().split("T")[0])
                                            : ''
                                    }
                                    onChange={(e) => field.onChange(e.target.value)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fecha de Fin</FormLabel>
                            <FormControl>
                                <Input
                                    type="date"
                                    disabled={operation === 'view'}
                                    min={new Date().toISOString().split("T")[0]}
                                    value={
                                        field.value
                                            ? (typeof field.value === 'number'
                                                ? new Date(field.value).toISOString().split("T")[0] 
                                                : new Date(field.value as string).toISOString().split("T")[0])
                                            : ''
                                    }
                                    onChange={(e) => field.onChange(e.target.value)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Estado</FormLabel>
                            <Select
                                value={field.value as string}
                                onValueChange={field.onChange}
                                disabled={operation === "view"}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecciona el estado" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Object.entries(STATUS_TYPES).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="scope"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Alcance</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value as string}
                                disabled={operation === "view"}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecciona el alcance" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Object.entries(SCOPE_TYPES).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="space-y-4 pb-4">
                {currentScope === "specific_grades" && (
                    <FormField
                        control={form.control}
                        name="targetGrade"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Grados (Selecciona uno o varios)</FormLabel>
                                <GenericMultiSelect
                                    items={uniqueGrades}
                                    value={(field.value as string[]) ?? []}
                                    onChange={field.onChange}
                                    getKey={(g) => g.grade}
                                    getLabel={(g) => g.grade}
                                    placeholder="Selecciona grados..."
                                    emptyMessage="No se encontraron grados"
                                    disabled={operation === "view"}
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                {currentScope === "specific_students" && (
                    <FormField
                        control={form.control}
                        name="targetStudent"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estudiantes (Busca y selecciona)</FormLabel>
                                <GenericMultiSelect
                                    items={formattedStudents}
                                    value={(field.value as string[]) ?? []}
                                    onChange={field.onChange}
                                    getKey={(s) => s._id}
                                    getLabel={(s) => (
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="font-medium truncate">
                                                {s.firstName} {s.lastName}
                                            </span>
                                        </div>
                                    )}
                                    searchable
                                    getSearchText={(s) => `${s.firstName} ${s.lastName}`}
                                    placeholder="Busca y selecciona estudiantes..."
                                    emptyMessage="No se encontraron estudiantes"
                                    disabled={operation === "view"}
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                {currentScope === "specific_groups" && (
                    <FormField
                        control={form.control}
                        name="targetGroup"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Grupos (Selecciona uno o varios)</FormLabel>
                                <GenericMultiSelect
                                    items={groups ?? []}
                                    value={(field.value as string[]) ?? []}
                                    onChange={field.onChange}
                                    getKey={(g) => g._id}
                                    getLabel={(g) => `${g.grade} ${g.name}`}
                                    placeholder="Selecciona grupos..."
                                    emptyMessage="No se encontraron grupos"
                                    disabled={operation === "view"}
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <FormField
                    control={form.control}
                    name="ruleIds"
                    render={({ field }) => (
                        <FormItem className="w-full pt-1">
                            <FormLabel>Políticas de Cobros</FormLabel>
                            <GenericMultiSelect
                                items={billingRules ?? []}
                                value={(field.value as string[]) ?? []}
                                onChange={field.onChange}
                                getKey={(rule) => rule._id}
                                getLabel={(rule) => (
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="hidden sm:flex font-medium text-sm truncate">{rule.name}</span>
                                        <span className="sm:hidden font-medium text-sm truncate">{BILLING_RULE_TYPES[rule.type]}</span>
                                        {rule.description && (
                                            <span className=" hidden sm:flex text-xs text-muted-foreground truncate mt-1">
                                                {rule.description.length > 75
                                                    ? rule.description.substring(0, 75) + "..."
                                                    : rule.description}
                                            </span>
                                        )}
                                        {(rule.type === 'late_fee' || rule.type === 'early_discount') && rule.lateFeeValue && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs font-medium text-gray-500">{rule.type === "late_fee" ? "Recargo:" : "Descuento:"}   </span>
                                                <span className="text-xs font-semibold text-gray-600 bg-gray-50 py-0.5 rounded">
                                                    {rule.lateFeeType === 'percentage' ? `${rule.lateFeeValue}%` : `$${formatCurrency(rule.lateFeeValue || 0)} MXN`}
                                                </span>
                                            </div>
                                        )}
                                        {rule.type === 'cutoff' && rule.cutoffAfterDays && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs font-medium text-gray-500">Días de tolerancia:</span>
                                                <span className="text-xs font-semibold text-gray-600 bg-gray-50 py-0.5 rounded">
                                                    {rule.cutoffAfterDays} día{rule.cutoffAfterDays !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs font-medium text-gray-500">Aplica: </span>
                                            <span className="text-xs font-semibold text-gray-600 bg-gray-50 rounded">
                                                {BILLING_RULE_SCOPES[rule.scope]}
                                            </span>
                                        </div>
                                    </div>

                                )}
                                getSearchText={(rule) => `${rule.name} ${rule.description || ''}`}
                                placeholder="Selecciona política de cobros..."
                                emptyMessage="No se encontraron políticas de cobros"
                                disabled={operation === "view"}
                                searchable
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />

            </div>
            <div className="flex flex-row text-xs text-muted-foreground gap-2">
                <Info className="h-4.5 w-4.5 items-center" />
                <p className="">
                    En caso de que el monto del descuento sea inferior al mínimo requerido, dicho descuento no será aplicado.
                </p>
            </div>
        </div>
    );
}