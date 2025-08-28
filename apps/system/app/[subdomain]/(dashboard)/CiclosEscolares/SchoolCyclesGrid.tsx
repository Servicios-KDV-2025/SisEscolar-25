import { Badge } from "@repo/ui/components/shadcn/badge";
import { Input } from "@repo/ui/components/shadcn/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/shadcn/select";
import { useState, useEffect, useMemo } from "react";
import { SchoolCycleCard } from "./SchoolCycleCard";
import { Button } from "@repo/ui/components/shadcn/button";
import { Plus } from "@repo/ui/icons";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { User } from "stores/userStore";
import { CicloEscolar, useCicloEscolarWithConvex } from "stores/useSchoolCiclesStore";
import { CrudDialog, useCrudDialog, WithId } from "@repo/ui/components/dialog/crud-dialog";
import { cicloEscolarSchema } from "@/types/shoolCycles";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/shadcn/form";

type SchoolCyclesGridProps = {
    currentSchool: {
        userSchoolId: Id<"userSchool">;
        school: {
            _id: Id<"school">;
            _creationTime: number;
            address: string;
            name: string;
            status: "active" | "inactive";
            email: string;
            phone: string;
            imgUrl: string;
            createdAt: number;
            updatedAt: number;
            subdomain: string;
            shortName: string;
            cctCode: string;
            description: string;
        };
        role: ("superadmin" | "admin" | "auditor" | "teacher" | "tutor")[];
        status: "active" | "inactive";
        department: "direction" | "secretary" | "schoolControl" | "technology" | undefined;
        createdAt: number;
        updatedAt: number;
    } | null;
    currentUser: User | null;
};

export function SchoolCyclesGrid({ currentSchool, currentUser }: SchoolCyclesGridProps) {
    const [cycles, setCycles] = useState<CicloEscolar[]>([]);
    const [filteredCycles, setFilteredCycles] = useState<CicloEscolar[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived" | "inactive">("all");
    const [duplicateNameError, setDuplicateNameError] = useState<string | null>(null);

    const {
        ciclosEscolares,
        isCreating,
        isUpdating,
        isDeleting,
        createError,
        updateError,
        deleteError,
        createCicloEscolar,
        updateCicloEscolar,
        deleteCicloEscolar,
        clearErrors,
    } = useCicloEscolarWithConvex(currentSchool?.school._id);

    const {
        isOpen,
        operation,
        data,
        openCreate,
        openEdit,
        openView,
        openDelete,
        close,
    } = useCrudDialog(cicloEscolarSchema, {
        name: "",
        startDate: "",
        endDate: "",
        status: "inactive"
    });

    const validateUniqueName = (name: string, currentId?: string) => {
        const normalizedName = name.trim().toLowerCase();
        return !ciclosEscolares.some(cycle =>
            cycle.name.toLowerCase() === normalizedName &&
            cycle._id !== currentId
        );
    };

    // Funciones adaptadoras para los tipos
    const handleOpenEdit = (ciclo: CicloEscolar) => {
        openEdit(ciclo as unknown as Record<string, unknown> & Partial<WithId>);
    };

    const handleOpenView = (ciclo: CicloEscolar) => {
        openView(ciclo as unknown as Record<string, unknown> & Partial<WithId>);
    };

    const handleOpenDelete = (ciclo: CicloEscolar) => {
        openDelete(ciclo as unknown as Record<string, unknown> & Partial<WithId>);
    };

    const handleClose = () => {
        setDuplicateNameError(null);
        close();
    };

    const handleDelayedClose = () => {
        setDuplicateNameError(null);
        setTimeout(() => {
            close();
        }, 1000);
    };

    // Función para formatear el timestamp al formato YYYY-MM-DD
    const formatTimestampToInputDate = (timestamp: number | undefined) => {
        if (!timestamp) return "";
        try {
            const date = new Date(timestamp);
            // Ajuste para la zona horaria local para evitar errores de un día
            const offset = date.getTimezoneOffset();
            const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
            return adjustedDate.toISOString().split('T')[0];
        } catch (error) {
            return "";
        }
    };

    // Prepara los datos para el diálogo, convirtiendo las fechas.
    const dialogData = useMemo(() => {
        if (!data) {
            return undefined;
        }
        return {
            ...data,
            startDate: formatTimestampToInputDate(data.startDate as number),
            endDate: formatTimestampToInputDate(data.endDate as number),
        };
    }, [data]);

    useEffect(() => {
        setCycles(ciclosEscolares);
        setFilteredCycles(ciclosEscolares);
    }, [ciclosEscolares]);

    useEffect(() => {
        let filtered = cycles;

        // Filtrar por término de búsqueda
        if (searchTerm) {
            filtered = filtered.filter(
                (cycle) => cycle.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtrar por estado
        if (statusFilter !== "all") {
            filtered = filtered.filter((cycle) => cycle.status === statusFilter);
        }

        setFilteredCycles(filtered);
    }, [cycles, searchTerm, statusFilter]);

    const handleSubmit = async (values: Record<string, unknown>) => {
        if (!currentSchool?.school._id) {
            return;
        }
        if (!validateUniqueName(values.name as string, data?._id as string)) {
            setDuplicateNameError("Ya existe un ciclo escolar con este nombre");
            return;
        }
        try {
            if (operation === "create") {
                await createCicloEscolar({
                    schoolId: currentSchool.school._id,
                    name: values.name as string,
                    startDate: new Date(values.startDate as string).getTime(),
                    endDate: new Date(values.endDate as string).getTime(),
                    status: values.status as "active" | "archived" | "inactive"
                });
                handleDelayedClose();
            } else if (operation === "edit" && data?._id) {
                await updateCicloEscolar({
                    cicloEscolarID: data._id as Id<"schoolCycle">,
                    schoolId: currentSchool.school._id,
                    name: values.name as string,
                    startDate: new Date(values.startDate as string).getTime(),
                    endDate: new Date(values.endDate as string).getTime(),
                    status: values.status as "active" | "archived" | "inactive"
                });
                handleDelayedClose();
            }
        } catch (error) {
            console.error("Error al enviar datos:", error);
        }

    };

    const handleDelete = async (id: string) => {
        await deleteCicloEscolar(id as Id<"schoolCycle">);
    };

    return (
        <div className="space-y-6">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Buscar ciclos escolares..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                </div>
                <div className="flex justify-end items-center">
                    <Button
                        onClick={openCreate}
                        disabled={isCreating}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Ciclo
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={(value: "all" | "active" | "archived" | "inactive") => setStatusFilter(value)}>
                        <SelectTrigger className="w-28">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="archived">Archivado</SelectItem>
                            <SelectItem value="inactive">Inactivo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Contador de resultados */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Mostrando {filteredCycles.length} de {cycles.length} ciclos
                </p>
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                        Activos: {cycles.filter((c) => c.status === "active").length}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        Archivados: {cycles.filter((c) => c.status === "archived").length}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        Inactivos: {cycles.filter((c) => c.status === "inactive").length}
                    </Badge>
                </div>
            </div>

            {/* Mostrar errores del store de ciclos */}
            {(createError || updateError || deleteError || duplicateNameError) && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="text-sm text-red-600">
                        {createError && (
                            <div>Error al crear el ciclo: {createError}</div>
                        )}
                        {updateError && (
                            <div>Error al actualizar el ciclo: {updateError}</div>
                        )}
                        {deleteError && (
                            <div>Error al eliminar el ciclo: {deleteError}</div>
                        )}
                        {duplicateNameError && (
                            <div>Error de validación: {duplicateNameError}</div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            clearErrors();
                            setDuplicateNameError(null);
                        }}
                        className="text-xs text-blue-500 underline mt-1"
                    >
                        Limpiar errores
                    </button>
                </div>
            )}

            {/* Grid de Ciclos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCycles.map((cycle) => (
                    <SchoolCycleCard
                        key={cycle._id}
                        ciclo={cycle}
                        isUpdating={isUpdating}
                        isDeleting={isDeleting}
                        openEdit={handleOpenEdit}
                        openView={handleOpenView}
                        openDelete={handleOpenDelete}
                    />
                ))}
            </div>

            {/* Estado vacío */}
            {filteredCycles.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Ciclos no encontrados con los criterios de búsqueda.</p>
                </div>
            )}

            {/* CrudDialog */}
            <CrudDialog
                operation={operation}
                title={
                    operation === "create"
                        ? "Crear Nuevo Ciclo Escolar"
                        : operation === "edit"
                            ? "Editar Ciclo Escolar"
                            : "Ver Ciclo Escolar"
                }
                description={
                    operation === "create"
                        ? "Completa la información del nuevo ciclo escolar"
                        : operation === "edit"
                            ? "Modifica la información del ciclo escolar"
                            : "Información del ciclo escolar"
                }
                schema={cicloEscolarSchema}
                defaultValues={{
                    name: "",
                    startDate: "",
                    endDate: "",
                    status: "inactive"
                }}
                data={dialogData}
                isOpen={isOpen}
                onOpenChange={handleClose}
                onSubmit={handleSubmit}
                onDelete={handleDelete}
            >
                {(form, operation) => (
                    <div className="grid gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Ciclo</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ej: Ciclo Escolar 2024-2025"
                                            value={field.value as string || ""}
                                            onChange={field.onChange}
                                            onBlur={() => {
                                                if (field.value && !validateUniqueName(field.value as string, data?._id as string)) {
                                                    setDuplicateNameError("Ya existe un ciclo escolar con este nombre");
                                                } else {
                                                    setDuplicateNameError(null);
                                                }
                                            }}
                                            disabled={operation === "view"}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha de Inicio</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            value={field.value as string || ""}
                                            onChange={field.onChange}
                                            disabled={operation === "view"}
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
                                            value={field.value as string || ""}
                                            onChange={field.onChange}
                                            disabled={operation === "view"}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Estado</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value as string}
                                        disabled={operation === "view"}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un estado" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="inactive">Inactivo</SelectItem>
                                            <SelectItem value="active">Activo</SelectItem>
                                            <SelectItem value="archived">Archivado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}
            </CrudDialog>
        </div>
    );
}