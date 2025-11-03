import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/shadcn/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select";
import { Input } from "@repo/ui/components/shadcn/input";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui/components/shadcn/tooltip";
import { Info } from "lucide-react";

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
            description = `Se aplicará un recargo por pago tardío desde el día ${startDay} hasta el día ${endDay} después del vencimiento, con un ${lateFeeType === "percentage" ? "porcentaje" : "monto fijo"} de ${valueText}. Ejemplo: si un estudiante no realiza el pago a tiempo, se le cobrará un recargo de ${valueText} por cada día de retraso dentro de este periodo.`;
        } else {
            description = `Recargo por pago tardío`;
        }
    } else if (type === "early_discount") {
        if (lateFeeType && lateFeeValue !== undefined && startDay !== undefined && endDay !== undefined) {
            const valueText = lateFeeType === "percentage" ? `${lateFeeValue}%` : `$${lateFeeValue} pesos`;
            description = `Se aplicará un descuento por pago anticipado desde el días ${startDay} hasta el día ${endDay}, con un ${lateFeeType === "percentage" ? "porcentaje" : "monto fijo"} de ${valueText}. Ejemplo: si un estudiante paga dentro de este periodo, recibirá un descuento de ${valueText}.`;
        } else {
            description = `Descuento disponible por pronto pago.`;
        }
    } else if (type === "cutoff") {
        if (cutoffAfterDays !== undefined) {
            description = `Suspensión de servicios o acceso después de ${cutoffAfterDays} días de mora. Ejemplo: si un estudiante mantiene un adeudo por más de ${cutoffAfterDays} días, se restringirá su acceso a los servicios escolares.`;
        } else {
            description = `Suspensión de servicios por falta de pago.`;
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
        <TooltipProvider>
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
                                    placeholder="Nombre de la política"
                                    value={field.value as string}
                                    disabled={operation === "view"}
                                    maxLength={80}
                                />
                                <div className="absolute right-2 top-2 text-xs text-muted-foreground">
                                    {nameValue.length}/80
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
                                    <FormLabel>{form.watch("lateFeeType") === "percentage" ? "Porcentaje" : "Monto"} del {form.watch("type") === "late_fee" ? "Recargo" : "Descuento"}</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                                                {form.watch("lateFeeType") === "percentage" ? "%" : form.watch("lateFeeType") === "fixed" ? "$" : ""}
                                            </span>
                                            <Input
                                                {...field}
                                                type="number"
                                                placeholder="0"
                                                value={typeof field.value === "number" || typeof field.value === "string" ? field.value : ""}
                                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                disabled={operation === "view"}
                                                className="pl-7 "
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                    {form.watch("lateFeeType") === "percentage" && (
                                        <p className="text-xs text-muted-foreground">
                                            Ingresa el porcentaje de descuento (1-100%)
                                        </p>
                                    )}
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
                                    <div className="flex items-center gap-1.5">
                                        <FormLabel>Día de Inicio</FormLabel>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-3.5 w-3.5 hover:text-black text-blue-600 transition-colors cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs bg-white border shadow-md rounded-md">
                                                <div className="space-y-2 p-1">
                                                    <p className="font-medium text-sm text-gray-900">
                                                        {currentType === "late_fee" ? "Recargo por pago tardío" : "Descuento anticipado"}
                                                    </p>
                                                    <p className="text-xs text-gray-600 leading-relaxed">
                                                        {currentType === "late_fee"
                                                            ? "Especifica desde qué día después del vencimiento se aplicará el recargo. Ejemplo: con 5 días, el recargo comenzará a aplicarse el día 5 posterior al vencimiento."
                                                            : "Especifica desde qué día se podrá aplicar el descuento. Ejemplo: si se coloca “1”, el descuento estará disponible desde el primer día del cobro."
                                                        }
                                                    </p>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
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
                                    <div className="flex items-center gap-1.5">
                                        <FormLabel>Día de Fin</FormLabel>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-3.5 w-3.5 hover:text-black text-blue-600 transition-colors cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs bg-white border text-white shadow-md rounded-md">
                                                <div className="space-y-2 p-1">
                                                    <p className="font-medium text-sm text-gray-900">
                                                        {currentType === "late_fee" ? "Recargo por pago tardío" : "Descuento anticipado"}
                                                    </p>
                                                    <p className="text-xs text-gray-600 leading-relaxed">
                                                        {currentType === "late_fee"
                                                            ? "Especifica hasta qué día después del vencimiento se aplicará el recargo. Ejemplo: con 10 días, el recargo dejará de aplicarse después de 10 días después de aplicar la política."
                                                            : "Especifica hasta qué día se podrá aplicar el descuento. Ejemplo: si se coloca “10”, el descuento estará disponible 10 días después de aplicar la política."
                                                        }
                                                    </p>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
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
        </TooltipProvider>
    );
}
