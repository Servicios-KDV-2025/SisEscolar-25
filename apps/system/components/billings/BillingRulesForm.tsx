import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/shadcn/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select";
import { Input } from "@repo/ui/components/shadcn/input";
import { Textarea } from "@repo/ui/components/shadcn/textarea";

interface BillingRuleValues {
    type?: "late_fee" | "early_discount" | "cutoff";
    lateFeeType?: "percentage" | "fixed";
    lateFeeValue?: number;
    startDay?: number;
    endDay?: number;
    cutoffAfterDays?: number;
    scope?: "estandar" | "becarios" | "all_students";
}

const generateDescription = (values: BillingRuleValues) => {
    const { type, lateFeeType, lateFeeValue, startDay, endDay, cutoffAfterDays, scope } = values;

    let description = "";

    if (type === "late_fee") {
        if (lateFeeType && lateFeeValue !== undefined && startDay !== undefined && endDay !== undefined) {
            const valueText = lateFeeType === "percentage" ? `${lateFeeValue}%` : `$${lateFeeValue}`;
            description = `Recargo por pago tardío desde el día ${startDay} después del vencimiento hasta el día ${endDay}, aplicando un ${lateFeeType === "percentage" ? "porcentaje" : "monto fijo"} de ${valueText}. Ejemplo: Si un estudiante no paga a tiempo, se le aplicará un recargo de ${valueText} por cada día de retraso entre el día ${startDay} y el día ${endDay}, o hasta que realice el pago.`;
        } else {
            description = `Recargo por pago tardío`;
        }
    } else if (type === "early_discount") {
        if (lateFeeType && lateFeeValue !== undefined && startDay !== undefined && endDay !== undefined) {
            const valueText = lateFeeType === "percentage" ? `${lateFeeValue}%` : `$${lateFeeValue} pesos`;
            description = `Descuento por pago anticipado desde el día ${startDay} hasta el día ${endDay}, con un ${lateFeeType === "percentage" ? "porcentaje" : "monto fijo"} de ${valueText}. Ejemplo: Si un estudiante paga temprano, recibe un descuento de ${valueText} entre los días ${startDay} y ${endDay}.`;
        } else {
            description = `Descuento por pronto pago`;
        }
    } else if (type === "cutoff") {
        if (cutoffAfterDays !== undefined) {
            description = `Corte de servicios o acceso después de ${cutoffAfterDays} días de mora. Ejemplo: Si un estudiante tiene pagos pendientes por más de ${cutoffAfterDays} días, se le cortará el acceso a servicios escolares.`;
        } else {
            description = `Suspensión por impago`;
        }
    }

    if (scope && scope !== "all_students") {
        const scopeLabel = scope === "estandar" ? "estándar" : scope === "becarios" ? "becarios" : scope;
        description += ` Aplica para estudiantes ${scopeLabel}.`;
    }

    return description;
};

interface BillingRulesProps {
    form: UseFormReturn<Record<string, unknown>>;
    operation: "create" | "edit" | "view" | "delete";
}

export function BillingRulesForm({
    form,
    operation,
}: BillingRulesProps) {
    const nameValue = (form.watch("name") as string) || "";
    const descriptionValue =
        (form.watch("description") as string) || "";

    const currentType = form.watch("type");

    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (operation === "create" || operation === "edit") {
                const relevantFields = ["type", "lateFeeType", "lateFeeValue", "startDay", "endDay", "cutoffAfterDays", "scope"];
                if (relevantFields.includes(name || "")) {
                    const currentValues = form.getValues();
                    const autoDescription = generateDescription(currentValues);
                    if (autoDescription !== currentValues.description) {
                        form.setValue("description", autoDescription);
                    }
                }
            }
        });
        return () => subscription.unsubscribe();
    }, [form, operation]);

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input
                                    {...field}
                                    placeholder="Nombre de la regla"
                                    value={field.value as string}
                                    disabled={operation === "view"}
                                    maxLength={50}
                                />
                                <div className="absolute right-2 top-2 text-xs text-muted-foreground">
                                    {nameValue.length}/50
                                </div>
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Textarea
                                    {...field}
                                    placeholder="La descripción se genera automáticamente con ejemplos basados en los campos completados"
                                    value={field.value as string}
                                    disabled={true}
                                    maxLength={400}
                                    className="pr-12"
                                />
                                <div className="absolute right-2 top-2 text-xs text-muted-foreground">
                                    {descriptionValue.length}/400
                                </div>
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="scope"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Alcance</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value?.toString()}
                                disabled={operation === "view"}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecciona un alcance" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="estandar">Estándar</SelectItem>
                                    <SelectItem value="becarios">Becarios</SelectItem>
                                    <SelectItem value="all_students">Todos los estudiantes</SelectItem>
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
                            <FormLabel>Tipo</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value?.toString()}
                                disabled={operation === "view"}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecciona un tipo" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="late_fee">Recargo por mora</SelectItem>
                                    <SelectItem value="early_discount">Descuento anticipado</SelectItem>
                                    <SelectItem value="cutoff">Corte</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>




            {(currentType === "late_fee" || currentType === "early_discount") && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="lateFeeType"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Tipo de {form.watch("type") === "late_fee" ? "Recargo" : "Descuento"}</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value?.toString()}
                                        disabled={operation === "view"}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecciona tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="percentage">Porcentaje</SelectItem>
                                            <SelectItem value="fixed">Fijo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="lateFeeValue"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Valor del {form.watch("type") === "late_fee" ? "Recargo" : "Descuento"}</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="number"
                                            placeholder="0.00"
                                            value={typeof field.value === "number" || typeof field.value === "string" ? field.value : ""}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                            disabled={operation === "view"}
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
                            name="startDay"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Día de Inicio</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="number"
                                            placeholder="0"
                                            value={typeof field.value === "number" || typeof field.value === "string" ? field.value : ""}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                            disabled={operation === "view"}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="endDay"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Día de Fin</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="number"
                                            placeholder="0"
                                            value={typeof field.value === "number" || typeof field.value === "string" ? field.value : ""}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                            disabled={operation === "view"}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>


                </>
            )}

            {(currentType === "cutoff") && (
                <FormField
                    control={form.control}
                    name="cutoffAfterDays"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Días para Corte</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="number"
                                    placeholder="0"
                                    value={typeof field.value === "number" || typeof field.value === "string" ? field.value : ""}
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                    disabled={operation === "view"}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
        </div>
    );
}
