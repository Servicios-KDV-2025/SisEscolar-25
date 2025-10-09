import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/shadcn/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select";
import { Input } from "@repo/ui/components/shadcn/input";
import { Group } from "stores/groupStore";
import { SchoolCycleType } from '@/types/temporalSchema';
import { Student } from "@/types/student";
import { GenericMultiSelect } from "./GenericMultiSelect";
import { PAYMENT_TYPES, RECURRENCE_TYPES, SCOPE_TYPES, STATUS_TYPES } from "lib/billing/constants";

interface BillingConfigProps {
    form: UseFormReturn<Record<string, unknown>>;
    operation: "create" | "edit" | "view" | "delete";
    groups: Group[] | undefined;
    schoolCycles: SchoolCycleType[] | undefined;
    students: Student[] | undefined;
}

export function BillingConfigForm({
    form,
    operation,
    groups,
    schoolCycles,
    students
}: BillingConfigProps) {
    const currentScope = form.watch("scope");
    useEffect(() => {
        

        switch (currentScope) {
            case 'all_students':
                form.setValue('targetGrade', []);
                form.setValue('targetGroup', []);
                form.setValue('targetStudent', []);
                break;
            case 'specific_grades':
                form.setValue('targetGroup', []);
                form.setValue('targetStudent', []);
                break;
            case 'specific_groups':
                form.setValue('targetGrade', []);
                form.setValue('targetStudent', []);
                break;
            case 'specific_students':
                form.setValue('targetGrade', []);
                form.setValue('targetGroup', []);
                break;
        }
    }, [currentScope, form]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="pb-4">
                {form.watch("scope") === "specific_grades" ? (
                    <FormField
                        control={form.control}
                        name="targetGrade"
                        render={({ field }) => {
                            const grupos = [...new Set(groups?.map(g => g.grade) ?? [])].map(grade => ({ grade }));
                            return (
                                <FormItem>
                                    <FormLabel>Grados (Selecciona uno o varios)</FormLabel>
                                    <GenericMultiSelect
                                        items={grupos ?? []}
                                        value={field.value as string[] ?? []}
                                        onChange={field.onChange}
                                        getKey={(g) => g.grade}
                                        getLabel={(g) => g.grade}
                                        placeholder="Selecciona grados..."
                                        emptyMessage="No se encontraron grados"
                                        disabled={operation === "view"}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )
                        }}
                    />
                ) : form.watch("scope") === "specific_students" ? (
                    <FormField
                        control={form.control}
                        name="targetStudent"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estudiantes (Busca y selecciona)</FormLabel>
                                <GenericMultiSelect
                                    items={(students ?? []).map(s => ({
                                        _id: s._id,
                                        firstName: s.name ?? "",
                                        lastName: s.lastName ?? "",
                                    }))}
                                    value={field.value as string[] ?? []}
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
                ) : form.watch("scope") === "specific_groups" && (
                    <FormField
                        control={form.control}
                        name="targetGroup"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Grupos (Selecciona uno o varios)</FormLabel>
                                <GenericMultiSelect
                                    items={groups ?? []}
                                    value={field.value as string[] ?? []}
                                    onChange={field.onChange}
                                    getKey={(g) => g._id}
                                    getLabel={(g) => g.grade + " " + g.name}
                                    placeholder="Selecciona grupos..."
                                    emptyMessage="No se encontraron grupos"
                                    disabled={operation === "view"}
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />)}
            </div>



        </div>);
}
